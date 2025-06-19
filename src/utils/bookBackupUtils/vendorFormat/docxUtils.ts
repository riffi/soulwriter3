// Утилиты для импорта книги из DOCX.
// Функции отвечают за разбор документа и преобразование его в внутренний формат.
import JSZip from 'jszip';
import { IBook, IChapter, IScene } from '@/entities/BookEntities';
import { generateUUID } from '@/utils/UUIDUtils';
import { notifications } from '@mantine/notifications';
import { importBookData } from '@/utils/bookBackupUtils/bookBackupManager';
import moment from 'moment';
import { buildBackupData, textFromHtml } from '@/utils/bookBackupUtils/vendorFormat/shared';

/**
 * Читает файл document.xml.rels и строит карту связей между rId и путями к ресурсам.
 */
async function extractRelations(zip: JSZip): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (!relsFile) return map;

  const relsXml = await relsFile.async('string');
  const doc = new DOMParser().parseFromString(relsXml, 'application/xml');
  doc.querySelectorAll('Relationship').forEach(rel => {
    const id = rel.getAttribute('Id');
    const target = rel.getAttribute('Target');
    if (id && target) map.set(id, target);
  });
  return map;
}

// Карта расширений изображений к соответствующим MIME-типам
const mimeMap: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

// Определение MIME-типа по расширению файла
function mimeFromExt(ext: string): string {
  const key = ext.toLowerCase();
  return mimeMap[key] ?? 'image/png';
}

/**
 * Выделяет идентификаторы стилей, которые соответствуют заголовкам различных уровней.
 * Это помогает определить границы глав в документе.
 */
export function extractHeadingStyleIds(stylesXml: string): Set<string> {
  const doc = new DOMParser().parseFromString(stylesXml, 'text/xml');
  const styles = doc.getElementsByTagName('w:style');
  const headingStyleIds = new Set<string>();

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    const nameNode = style.getElementsByTagName('w:name')[0];
    const styleId = style.getAttribute('w:styleId');

    if (nameNode && styleId) {
      const nameVal = nameNode.getAttribute('w:val')?.toLowerCase();
      if (nameVal && /(heading|заголовок|title|подзаголовок)/i.test(nameVal)) {
        headingStyleIds.add(styleId);
      }
    }
  }

  return headingStyleIds;
}

/**
 * Проверяет, является ли стиль заголовком.
 * Стиль сравнивается с известными именами и списком извлечённых id.
 */
export function isHeadingStyle(styleValNorm: string | null, headingStyleIds: Set<string>): boolean {
  if (!styleValNorm) return false;

  const norm = styleValNorm.toLowerCase();
  return /(heading\d*|title|subtitle|заголовок)/i.test(norm) || headingStyleIds.has(styleValNorm);
}

/**
 * Извлекает изображение из параграфа и возвращает HTML-тег <img>.
 * Путь к файлу определяется с помощью карты отношений.
 */
async function extractImageHtml(
  paragraph: Element,
  zip: JSZip,
  relsMap: Map<string, string>,
): Promise<string> {
  const blip = paragraph.querySelector('*|blip');
  const rId = blip?.getAttribute('r:embed') || blip?.getAttribute('r:id');
  if (rId && relsMap.has(rId)) {
    const target = relsMap.get(rId)!;
    const path = `word/${target}`;
    const imgFile = zip.file(path);
    if (imgFile) {
      const base64 = await imgFile.async('base64');
      const ext = path.split('.').pop() || 'png';
      const mime = mimeFromExt(ext);
      return `<img src="data:${mime};base64,${base64}" />`;
    }
  }
  return '';
}

/**
 * На основе параграфов документа формирует массивы глав и сцен.
 * Заголовки определяются по стилям, текст разделяется и обогащается изображениями.
 */
async function buildScenesAndChapters(
  paragraphs: Element[],
  zip: JSZip,
  relsMap: Map<string, string>,
  headingStyleIds: Set<string>,
): Promise<{ chapters: Omit<IChapter, 'id'>[]; scenes: IScene[] }> {
  const chapters: Omit<IChapter, 'id'>[] = [];
  const scenes: IScene[] = [];
  let hasHeadings = false;
  let currentTitle = '';
  let currentBody = '';
  let chapterOrder = 1;

  // Сохраняет накопленный текст как новую сцену и главу
  const pushScene = () => {
    const text = textFromHtml(currentBody);
    scenes.push({
      title: currentTitle || `Глава ${chapterOrder}`,
      body: currentBody.trim(),
      order: scenes.length + 1,
      chapterId: chapterOrder,
      totalSymbolCountWithSpaces: text.length,
      totalSymbolCountWoSpaces: text.replace(/\s/g, '').length,
    });
    chapters.push({
      title: currentTitle || `Глава ${chapterOrder}`,
      order: chapterOrder,
      contentSceneId: scenes.length,
    });
  };

  // Перебираем все параграфы и собираем текст и изображения
  for (const p of paragraphs) {
    const styleEl = p.querySelector('*|pPr *|pStyle');
    const styleVal = styleEl?.getAttribute('w:val') || styleEl?.getAttribute('val');
    const styleValNorm = styleVal?.toLowerCase();

    const imgHtml = await extractImageHtml(p, zip, relsMap);

    // Если параграф является заголовком, начинаем новую главу
    if (isHeadingStyle(styleValNorm, headingStyleIds)) {
      hasHeadings = true;
      if (currentBody) {
        pushScene();
        chapterOrder += 1;
        currentBody = '';
      }
      currentTitle = p.textContent?.trim() || '';
    } else {
      // Обычный текстовый параграф
      const paragraphText = p.textContent || '';
      currentBody += `<p>${paragraphText}</p>${imgHtml}`;
    }
  }

  // Добавляем последнюю сцену, если текст остался
  if (currentBody) {
    pushScene();
  }

  // Если не было заголовков, собираем весь текст в одну главу
  if (!hasHeadings && scenes.length > 1) {
    const combinedBody = scenes.map(s => s.body).join('');
    const text = textFromHtml(combinedBody);
    scenes.splice(0, scenes.length, {
      title: `Глава 1`,
      body: combinedBody.trim(),
      order: 1,
      chapterId: 1,
      totalSymbolCountWithSpaces: text.length,
      totalSymbolCountWoSpaces: text.replace(/\s/g, '').length,
    });
    chapters.splice(0, chapters.length, {
      title: `Глава 1`,
      order: 1,
      contentSceneId: 1,
    });
  }
  // Возвращаем готовые главы и сцены

  return { chapters, scenes };
}
/**
 * Основная точка входа для импорта DOCX-файла.
 * Архив распаковывается, извлекаются данные о книге и тексте,
 * после чего книга сохраняется во внутреннюю БД.
 */
export const importDocxFile = async (file: File): Promise<boolean> => {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
          // Загружаем DOCX как zip-архив
        const zip = await JSZip.loadAsync(arrayBuffer);
        // Чтение метаданных (название, автор)
        const coreXml = await zip.file('docProps/core.xml')?.async('string');
        const coreDoc = coreXml
          ? new DOMParser().parseFromString(coreXml, 'application/xml')
          : null;
        const title =
          coreDoc?.getElementsByTagName('dc:title')[0]?.textContent ||
          file.name.replace('.docx', '');
        const author =
          coreDoc?.getElementsByTagName('dc:creator')[0]?.textContent ||
          'Автор не указан';

        // Формируем карту вложенных ресурсов (изображений)
        const relsMap = await extractRelations(zip);
        const docXml = await zip.file('word/document.xml')?.async('string');
        const stylesXml = await zip.file('word/styles.xml')?.async('string');
        if (!docXml) throw new Error('document.xml not found');
        if (!stylesXml) throw new Error('styles.xml not found');
        const doc = new DOMParser().parseFromString(docXml, 'application/xml');
        // Разбираем стили параграфов из файла styles.xml
        const headingStyleIds = extractHeadingStyleIds(stylesXml);

        const paragraphs = Array.from(doc.querySelectorAll('*|p'));
        const { chapters, scenes } = await buildScenesAndChapters(
          paragraphs,
          zip,
          relsMap,
          headingStyleIds,
        );

        // Создаём объект книги и заполняем его данными
        const newBook: IBook = {
          uuid: generateUUID(),
          title,
          author,
          form: 'Роман',
          genre: '',
          configurationUuid: '',
          configurationTitle: '',
          cover: undefined,
          kind: 'book',
          description: `Книга импортирована из (${file.name})`,
          chapterOnlyMode: 1,
          localUpdatedAt: moment().toISOString(true),
          syncState: 'localChanges'
        };

        // Подготавливаем данные для импорта и сохраняем книгу
        const backupData = buildBackupData(newBook, chapters, scenes);

        await importBookData(backupData);

        // Показываем сообщение об успешном импорте
        notifications.show({
          title: 'Импорт завершён',
          message: `${file.name} успешно импортирован`,
          color: 'teal',
        });
        resolve(true);
      // Если что-то пошло не так, выводим ошибку
        // Ошибка парсинга или сохранения
      } catch (error) {
        console.error('Error importing DOCX:', error);
        notifications.show({
          title: 'Ошибка импорта',
          message: `Не удалось импортировать ${file.name}`,
          color: 'red',
        });
        resolve(false);
      }
    };

    // Обработка ошибок чтения файла
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось прочитать файл.',
        color: 'red',
      });
      resolve(false);
    };

    // Начинаем чтение файла
    reader.readAsArrayBuffer(file);
  });
};

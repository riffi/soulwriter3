// docxUtils.ts
import JSZip from 'jszip';
import { IBook, IChapter, IScene } from '@/entities/BookEntities';
import { generateUUID } from '@/utils/UUIDUtils';
import { notifications } from '@mantine/notifications';
import { BackupData, importBookData } from '@/utils/bookBackupManager';

// Helper to extract text from HTML
function textFromHtml(html: string): string {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html').body.textContent || '';
}

// Extract relations map from document.xml.rels
async function getRelations(zip: JSZip): Promise<Map<string, string>> {
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

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}

export const importDocxFile = async (file: File): Promise<boolean> => {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Metadata
        const coreXml = await zip.file('docProps/core.xml')?.async('string');
        const coreDoc = coreXml
            ? new DOMParser().parseFromString(coreXml, 'application/xml')
            : null;
        const title =
            coreDoc?.getElementsByTagName('dc:title')[0]?.textContent || file.name;
        const author =
            coreDoc?.getElementsByTagName('dc:creator')[0]?.textContent ||
            'Unknown Author';

        const relsMap = await getRelations(zip);
        const docXml = await zip.file('word/document.xml')?.async('string');
        if (!docXml) throw new Error('document.xml not found');
        const doc = new DOMParser().parseFromString(docXml, 'application/xml');
        const paragraphs = Array.from(doc.querySelectorAll('*|p'));

        const chapters: Omit<IChapter, 'id'>[] = [];
        const scenes: IScene[] = [];
        let currentTitle = '';
        let currentBody = '';
        let chapterOrder = 1;

        for (const p of paragraphs) {
          // Find style element inside the paragraph properties
          let styleEl: Element | null = null;
          const pPr = p.querySelector('*|pPr');
          if (pPr) {
            styleEl = pPr.querySelector('*|pStyle');
          }
          const styleVal =
              styleEl?.getAttribute('w:val') || styleEl?.getAttribute('val');
          const styleValNorm = styleVal?.toLowerCase();

          // Handle images inside a paragraph
          let imgHtml = '';
          const blip = p.querySelector('*|blip');
          const rId =
              blip?.getAttribute('r:embed') || blip?.getAttribute('r:id');
          if (rId && relsMap.has(rId)) {
            const target = relsMap.get(rId)!;
            const path = `word/${target}`;
            const imgFile = zip.file(path);
            if (imgFile) {
              const base64 = await imgFile.async('base64');
              const ext = path.split('.').pop() || 'png';
              const mime = mimeFromExt(ext);
              imgHtml = `<img src="data:${mime};base64,${base64}" />`;
            }
          }

          const isHeading = styleValNorm
              ? /(heading\d*|title|subtitle|1|2|3|4|5|6)/i.test(styleValNorm)
              : false;
          if (isHeading) {
            if (currentBody) {
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
              chapterOrder += 1;
              currentBody = '';
            }
            currentTitle = p.textContent?.trim() || '';
          } else {
            const paragraphText = p.textContent || '';
            currentBody += `<p>${paragraphText}</p>${imgHtml}`;
          }
        }

        // Push the last scene & chapter
        if (currentBody) {
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
        }

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
          description: `Imported from DOCX (${file.name})`,
          chapterOnlyMode: 1,
        };

        const scenesToImport: Omit<IScene, 'body'>[] = [];
        const sceneBodies: { sceneId: number; body: string }[] = [];
        scenes.forEach((scene, index) => {
          const sceneId = index + 1;
          const { body, ...rest } = scene;
          scenesToImport.push({ ...(rest as Omit<IScene, 'body'>), id: sceneId });
          sceneBodies.push({ sceneId, body });
        });

        const backupData: BackupData = {
          book: newBook,
          chapters,
          scenes: scenesToImport,
          sceneBodies,
          blockInstances: [],
          blockParameterInstances: [],
          blockInstanceRelations: [],
          bookConfigurations: [
            {
              uuid: generateUUID(),
              title: newBook.title,
              description: '',
            },
          ],
          blocks: [],
          blockParameterGroups: [],
          blockParameters: [],
          blockParameterPossibleValues: [],
          blocksRelations: [],
          blockTabs: [],
          blockInstanceSceneLinks: [],
          blockInstanceGroups: [],
          knowledgeBasePages: [],
        };

        await importBookData(backupData);

        notifications.show({
          title: 'Импорт завершён',
          message: `${file.name} успешно импортирован`,
          color: 'teal',
        });
        resolve(true);
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

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось прочитать файл.',
        color: 'red',
      });
      resolve(false);
    };

    reader.readAsArrayBuffer(file);
  });
};

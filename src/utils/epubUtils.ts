// epubUtils.ts
import ePub, { Book } from 'epubjs';
import { IBook, IChapter, IScene } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { notifications } from "@mantine/notifications";
import {importBookData} from "@/utils/bookBackupManager";

// Вспомогательная функция для извлечения HTML из документа
function extractHtmlFromDocument(doc: Document): string {
    const body = doc.body || doc.documentElement;
    if (!body) return '';

    // Опционально: очистка от нежелательных тегов, таких как <script> или <style>
    const scripts = body.querySelectorAll('script, style');
    scripts.forEach(s => s.remove());

    return body.innerHTML;
}

// Вспомогательная функция для извлечения HTML из contents (загруженной секции)
function extractHtmlFromContents(contents: any): string {
    if (!contents) return '';

    // Если это уже документ
    if (contents.documentElement || contents.body) {
        return extractHtmlFromDocument(contents as Document);
    }

    // Если это элемент (например, body)
    if (contents.ownerDocument) {
        return contents.innerHTML || '';
    }

    // Если это строка, парсим её
    if (typeof contents === 'string') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(contents, 'text/html');
        return extractHtmlFromDocument(doc);
    }

    // Fallback для объектов, которые могут быть переданы
    if (contents.innerHTML) {
        return contents.innerHTML;
    }
    if (contents.outerHTML) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(contents.outerHTML, 'text/html');
        return doc.body.innerHTML;
    }

    console.warn("Could not extract HTML from contents object.");
    return '';
}

// Функция для разделения HTML-содержимого на сцены
function splitHtmlIntoScenes(chapterHtml: string): string[] {
    if (!chapterHtml.trim()) {
        return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(chapterHtml, 'text/html');
    const body = doc.body;
    const breakPlaceholder = '';

    // Ищем элементы-разделители и заменяем их на комментарий-плейсхолдер
    const elements = body.querySelectorAll('hr, p, div, h1, h2, h3, h4, h5, h6');
    for (const el of elements) {
        const tagName = el.tagName.toLowerCase();

        // Разделитель <hr>
        if (tagName === 'hr') {
            if (el.parentNode) {
                el.parentNode.replaceChild(doc.createComment('SCENE_BREAK'), el);
            }
            continue;
        }

        // Элемент, содержащий только символы-разделители (***, ---, ###)
        const text = el.textContent?.trim() || '';
        const cleanedText = text.replace(/\s/g, ''); // убираем все пробелы
        if (/^(\*|-|#){3,}$/.test(cleanedText) && cleanedText.length > 0) {
            // Убедимся, что внутри нет ничего кроме разделителей и пробелов
            if(el.innerHTML.replace(/<[^>]*>?/gm, '').trim() === text) {
                if (el.parentNode) {
                    el.parentNode.replaceChild(doc.createComment('SCENE_BREAK'), el);
                }
            }
        }
    }

    // Сериализуем обратно в HTML и разделяем по плейсхолдеру
    const fullHtml = body.innerHTML;
    let scenes = fullHtml.split(breakPlaceholder);

    // Фильтруем пустые сцены и очень короткие
    scenes = scenes
        .map(scene => scene.trim())
        .filter(scene => scene.length > 100); // Порог для HTML можно сделать выше, т.к. теги занимают место


    return scenes.length > 0 ? scenes : [chapterHtml]; // Возвращаем исходный HTML если не удалось разделить
}

// Функция для генерации названия сцены
function generateSceneTitle(sceneText: string, sceneNumber: number): string {
    return `Сцена ${sceneNumber}`
}

async function extractChaptersAndScenesFromEpub(bookEpub: Book) {
    // Рекурсивная функция для обработки TOC, включая вложенные элементы
    const flattenTocItems = (tocItems: any[], parentTitle?: string): any[] => {
        const result: any[] = [];
        for (const item of tocItems) {
            // Если есть дочерние элементы, они могут быть главами
            if (item.subitems && item.subitems.length > 0) {
                // Рекурсивно обрабатываем дочерние элементы
                result.push(...flattenTocItems(item.subitems, item.label));
            } else {
                if (item.href !== 'toc.xhtml'){
                    result.push({
                        label: item.label,
                        href: item.href
                    });
                }
            }
        }

        return result;
    };

    const flatTocItems = flattenTocItems(bookEpub.navigation.toc);

    const chaptersToCreate: Omit<IChapter, 'id'>[] = [];
    const scenes: IScene[] = [];
    let chapterOrder = 1;

    for (const tocItem of flatTocItems) {
        const chapterTitle = tocItem.label.trim() || `Глава ${chapterOrder}`;
        chaptersToCreate.push({
            title: chapterTitle,
            order: chapterOrder,
        });

        const sceneChapterOrderLink = chapterOrder;

        try {
            // Очищаем href от якорей
            const cleanHref = tocItem.href.split('#')[0];

            // Ищем соответствующий spine item
            const spineItem = bookEpub.spine.spineItems.find(item =>
                item.href === cleanHref ||
                item.href === tocItem.href ||
                item.canonical === cleanHref ||
                cleanHref.endsWith(item.href) ||
                item.href.endsWith(cleanHref)
            );

            if (spineItem) {
                try {
                    // Используем метод spine для загрузки секции
                    const section = bookEpub.spine.get(spineItem.href);

                    if (section) {
                        // Загружаем содержимое
                        const contents = await section.load(bookEpub.load.bind(bookEpub));

                        if (contents) {
                            const chapterHtml = extractHtmlFromContents(contents);

                            if (chapterHtml.trim()) {
                                const sceneHtmls = splitHtmlIntoScenes(chapterHtml);

                                sceneHtmls.forEach((sceneHtml, index) => {
                                    if (sceneHtml.trim()) {
                                        const sceneTitle = generateSceneTitle(sceneHtml, index + 1);
                                        scenes.push({
                                            title: sceneTitle,
                                            body: sceneHtml.trim(),
                                            order: index + 1,
                                            chapterId: sceneChapterOrderLink,
                                        });
                                    }
                                });
                            } else {
                                // Если HTML не извлечен, создаем сцену с предупреждением
                                scenes.push({
                                    title: `${chapterTitle} - Сцена 1`,
                                    body: `<p>Содержимое главы "${chapterTitle}" не удалось извлечь из загруженной секции.</p>`,
order: 1,
    chapterId: sceneChapterOrderLink,
});
}
} else {
    scenes.push({
        title: `${chapterTitle} - Пустая секция`,
        body: `<p>Секция главы "${chapterTitle}" пуста.</p>`,
        order: 1,
        chapterId: sceneChapterOrderLink,
    });
}
} else {
    scenes.push({
        title: `${chapterTitle} - Секция не найдена`,
        body: `<p>Секция для главы "${chapterTitle}" не найдена.</p>`,
        order: 1,
        chapterId: sceneChapterOrderLink,
    });
}
} catch (sectionError) {
    console.warn(`Section load error for ${tocItem.label}:`, sectionError);

    // Fallback: пробуем через URL загрузку
    try {
        const response = await fetch(spineItem.url);
        const content = await response.text();
        const parser = new DOMParser();

        let doc: Document;
        try {
            doc = parser.parseFromString(content, 'application/xhtml+xml');
            if (doc.documentElement.tagName === 'parsererror') {
                throw new Error('XHTML parse error');
            }
        } catch {
            doc = parser.parseFromString(content, 'text/html');
        }

        const chapterHtml = extractHtmlFromDocument(doc);

        if (chapterHtml.trim()) {
            const sceneHtmls = splitHtmlIntoScenes(chapterHtml);

            sceneHtmls.forEach((sceneHtml, index) => {
                if (sceneHtml.trim()) {
                    const sceneTitle = generateSceneTitle(sceneHtml, index + 1);
                    scenes.push({
                        title: sceneTitle,
                        body: sceneHtml.trim(),
                        order: index + 1,
                        chapterId: sceneChapterOrderLink,
                    });
                }
            });
        } else {
            scenes.push({
                title: `${chapterTitle} - Fetch fallback`,
                body: `<p>Содержимое главы "${chapterTitle}" загружено через fetch, но HTML не извлечен.</p>`,
                order: 1,
                chapterId: sceneChapterOrderLink,
            });
        }
    } catch (fetchError) {
        console.warn(`Fetch fallback failed for ${tocItem.label}:`, fetchError);
        scenes.push({
            title: `${chapterTitle} - Ошибка загрузки`,
            body: `<p>Не удалось загрузить содержимое главы "${chapterTitle}". Ошибки: ${sectionError.message}, ${fetchError.message}</p>`,
            order: 1,
            chapterId: sceneChapterOrderLink,
        });
    }
}
} else {
    // Если spine item не найден, пробуем создать URL вручную
    console.warn(`Spine item not found for href: ${tocItem.href}`);

    try {
        // Пробуем разные варианты URL
        const baseUrl = bookEpub.url ? bookEpub.url.replace(/\/[^\/]*$/, '/') : '';
        const possibleUrls = [
            `${baseUrl}${cleanHref}`,
            `${baseUrl}OEBPS/${cleanHref}`,
            `${baseUrl}OPS/${cleanHref}`,
            `${baseUrl}Text/${cleanHref}`
        ];

        let content = '';
        for (const url of possibleUrls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    content = await response.text();
                    break;
                }
            } catch (urlError) {
                continue;
            }
        }

        if (content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const chapterHtml = extractHtmlFromDocument(doc);

            if (chapterHtml.trim()) {
                const sceneHtmls = splitHtmlIntoScenes(chapterHtml);

                sceneHtmls.forEach((sceneHtml, index) => {
                    if (sceneHtml.trim()) {
                        const sceneTitle = generateSceneTitle(sceneHtml, index + 1);
                        scenes.push({
                            title: sceneTitle,
                            body: sceneHtml.trim(),
                            order: index + 1,
                            chapterId: sceneChapterOrderLink,
                        });
                    }
                });
            } else {
                scenes.push({
                    title: `${chapterTitle} - Manual URL`,
                    body: `<p>Содержимое главы "${chapterTitle}" загружено по URL, но HTML не извлечен.</p>`,
                    order: 1,
                    chapterId: sceneChapterOrderLink,
                });
            }
        } else {
            scenes.push({
                title: `${chapterTitle} - URL не найден`,
                body: `<p>Не удалось найти рабочий URL для главы "${chapterTitle}".</p>`,
                order: 1,
                chapterId: sceneChapterOrderLink,
            });
        }
    } catch (manualError) {
        scenes.push({
            title: `${chapterTitle} - Manual error`,
            body: `<p>Ошибка при ручной загрузке главы "${chapterTitle}": ${manualError.message}</p>`,
            order: 1,
            chapterId: sceneChapterOrderLink,
        });
    }
}
} catch (chapterLoadError) {
    console.error(`Error loading/processing chapter "${tocItem.label}":`, chapterLoadError);
    notifications.show({
        title: 'Chapter Error',
        message: `Could not process chapter: ${tocItem.label}`,
        color: 'orange'
    });

    scenes.push({
        title: `${chapterTitle} - Общая ошибка`,
        body: `<p>Общая ошибка при загрузке содержимого главы "${chapterTitle}": ${chapterLoadError.message}</p>`,
        order: 1,
        chapterId: sceneChapterOrderLink,
    });
}

chapterOrder++;
}

return { chaptersToCreate, scenes };
}

export const importEpubFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const bookEpub = ePub();
                await bookEpub.open(reader.result as ArrayBuffer);

                const bookUuid = generateUUID();
                const metadata = await bookEpub.loaded.metadata;

                let bookCoverBase64: string | undefined = undefined;
                try {
                    const coverUrl = await bookEpub.coverUrl();
                    if (coverUrl) {
                        const response = await fetch(coverUrl);
                        const blob = await response.blob();
                        bookCoverBase64 = await new Promise((resolve, reject) => {
                            const coverReader = new FileReader();
                            coverReader.onloadend = () => resolve(coverReader.result as string);
                            coverReader.onerror = reject;
                            coverReader.readAsDataURL(blob);
                        });
                    }
                } catch (coverError) {
                    console.error("Error processing cover image:", coverError);
                    notifications.show({ title: 'Cover Error', message: 'Could not load cover image.', color: 'orange' });
                }

                const newBook: IBook = {
                    uuid: bookUuid,
                    title: metadata.title || 'Untitled Book',
                    author: metadata.creator || 'Unknown Author',
                    form: 'Роман',
                    genre: '',
                    configurationUuid: '',
                    configurationTitle: '',
                    cover: bookCoverBase64,
                    kind: 'book',
                    description: metadata.description || `Imported from EPUB (${file.name})`,
                };
                const { chaptersToCreate, scenes } = await extractChaptersAndScenesFromEpub(bookEpub);
                const backupData = {
                    book: newBook,
                    chapters: chaptersToCreate,
                    scenes: scenes,
                    blockInstances: [],
                    blockParameterInstances: [],
                    blockInstanceRelations: [],
                    bookConfigurations: [],
                    blocks: [],
                    blockParameterGroups: [],
                    blockParameters: [],
                    blockParameterPossibleValues: [],
                    blocksRelations: [],
                    blockTabs: [],
                    blockInstanceSceneLinks: [],
                };
                await importBookData(backupData)

                notifications.show({
                    title: 'EPUB Processed',
                    message: `Data for "${newBook.title}" prepared. Attempting import.`,
                    color: 'info'
                });

                // Импортируем данные книги
                return resolve(true);
            } catch (error) {
                console.error("Error processing EPUB:", error);
                notifications.show({
                    title: 'EPUB Import Failed',
                    message: `Failed to import EPUB: ${error.message || 'Unknown error'}`,
                    color: 'red',
                });
                resolve(false);
            }
        };

        reader.onerror = () => {
            console.error("FileReader error:", reader.error);
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

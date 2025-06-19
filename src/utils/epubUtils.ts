// epubUtils.ts
import ePub, { Book } from 'epubjs';
import JSZip from 'jszip';
import { IBook, IChapter, IScene } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { notifications } from "@mantine/notifications";
import {BackupData, importBookData} from "@/utils/bookBackupManager";
import { configDatabase } from "@/entities/configuratorDb";
import { connectToBookDatabase } from "@/entities/bookDb";

// Helper function to extract text from an HTML string for accurate character counting
function getTextFromHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

/**
 * Находит все изображения в HTML-фрагменте, загружает их из EPUB-архива
 * и встраивает их в теги <img> как строки Base64.
 * @param chapterHtml HTML-содержимое главы.
 * @param bookEpub Экземпляр книги epubjs.
 * @returns Промис, который разрешается в HTML-строку с встроенными изображениями.
 */
async function embedImagesAsBase64(chapterHtml: string, bookEpub: any): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapterHtml, 'text/html');
    const images = Array.from(doc.querySelectorAll('img'));

    for (const img of images) {
        let src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) continue;

        try {
            // Получаем MIME-тип по расширению файла
            let mimeType = 'image/jpeg';
            if (src.endsWith('.png')) mimeType = 'image/png';
            else if (src.endsWith('.gif')) mimeType = 'image/gif';
            else if (src.endsWith('.svg')) mimeType = 'image/svg+xml';
            else if (src.endsWith('.webp')) mimeType = 'image/webp';

            // Получаем base64-строку через epub.js
            let base64: string | null = null;
            if (bookEpub.archive && typeof bookEpub.archive.getBase64 === 'function') {
                // epub.js v0.3+
                base64 = await bookEpub.archive.getBase64('/' + src);
                if (!base64){
                    await bookEpub.archive.getBase64('/OEBPS/'+src);
                }
            }
            else if (bookEpub.resources && typeof bookEpub.resources.get === 'function') {

                // epub.js v0.2.x
                const resource = await bookEpub.resources.get(src);
                if (resource && typeof resource.getBase64 === 'function') {
                    base64 = await resource.getBase64();
                }
            }

            if (base64) {
                img.setAttribute('src', `data:${base64}`);
            }
        } catch (error) {
            console.warn(`Could not embed image with src "${src}":`, error);
        }
    }

    return doc.body.innerHTML;
}



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

        const sceneIndex = scenes.length;
        const sceneChapterOrderLink = chapterOrder;

        let chapterHtml = '';

        try {
            const cleanHref = tocItem.href.split('#')[0];
            const spineItem = bookEpub.spine.spineItems.find(item =>
                item.href === cleanHref ||
                item.href === tocItem.href ||
                item.canonical === cleanHref ||
                cleanHref.endsWith(item.href) ||
                item.href.endsWith(cleanHref)
            );

            if (spineItem) {
                try {
                    const section = bookEpub.spine.get(spineItem.href);
                    if (section) {
                        const contents = await section.load(bookEpub.load.bind(bookEpub));
                        if (contents) {
                            chapterHtml = extractHtmlFromContents(contents);
                        } else {
                            chapterHtml = `<p>Секция главы "${chapterTitle}" пуста.</p>`;
                        }
                    } else {
                        chapterHtml = `<p>Секция для главы "${chapterTitle}" не найдена.</p>`;
                    }
                } catch (sectionError) {
                    console.warn(`Section load error for ${tocItem.label}:`, sectionError);
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
                        chapterHtml = extractHtmlFromDocument(doc);
                    } catch (fetchError) {
                        console.warn(`Fetch fallback failed for ${tocItem.label}:`, fetchError);
                        chapterHtml = `<p>Не удалось загрузить содержимое главы "${chapterTitle}". Ошибки: ${sectionError.message}, ${fetchError.message}</p>`;
                    }
                }
            } else {
                chapterHtml = `<p>Секция для главы "${chapterTitle}" не найдена.</p>`;
            }
        } catch (chapterLoadError) {
            console.error(`Error loading/processing chapter "${tocItem.label}":`, chapterLoadError);
            notifications.show({
                title: 'Chapter Error',
                message: `Could not process chapter: ${tocItem.label}`,
                color: 'orange'
            });
            chapterHtml = `<p>Общая ошибка при загрузке содержимого главы "${chapterTitle}": ${chapterLoadError.message}</p>`;
        }

        chapterHtml = await embedImagesAsBase64(chapterHtml, bookEpub);

        if (!chapterHtml.trim()) {
            chapterHtml = `<p>Содержимое главы "${chapterTitle}" не найдено.</p>`;
        }

        const sceneText = getTextFromHtml(chapterHtml);
        scenes.push({
            title: chapterTitle,
            body: chapterHtml.trim(),
            order: sceneIndex + 1,
            chapterId: sceneChapterOrderLink,
            totalSymbolCountWithSpaces: sceneText.length,
            totalSymbolCountWoSpaces: sceneText.replace(/\s/g, '').length,
        });

        chaptersToCreate.push({
            title: chapterTitle,
            order: chapterOrder,
            contentSceneId: sceneIndex + 1,
        });

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
                    chapterOnlyMode: 1
                };
                const { chaptersToCreate, scenes } = await extractChaptersAndScenesFromEpub(bookEpub);

                // Dexie stores scene body in a separate table. Prepare data accordingly
                const scenesToImport: Omit<IScene, 'body'>[] = [];
                const sceneBodiesToImport: { sceneId: number; body: string }[] = [];

                scenes.forEach((scene, index) => {
                    const sceneId = index + 1;
                    const { body, ...sceneWithoutBody } = scene;
                    scenesToImport.push({ ...(sceneWithoutBody as Omit<IScene, 'body'>), id: sceneId });
                    sceneBodiesToImport.push({ sceneId, body: body || '' });
                });

                const backupData: BackupData = {
                    book: newBook,
                    chapters: chaptersToCreate,
                    scenes: scenesToImport,
                    sceneBodies: sceneBodiesToImport,
                    blockInstances: [],
                    blockParameterInstances: [],
                    blockInstanceRelations: [],
                    bookConfigurations: [{
                        uuid: generateUUID(),
                        title: newBook.title || 'Untitled Book',
                        description: '',
                    }],
                    blocks: [],
                    blockParameterGroups: [],
                    blockParameters: [],
                    blockParameterPossibleValues: [],
                    blocksRelations: [],
                    blockTabs: [],
                    blockInstanceSceneLinks: [],
                    blockInstanceGroups: [],
                    knowledgeBasePages: []
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

export const exportBookToEpub = async (bookUuid: string): Promise<boolean> => {
    try {
        const book = await configDatabase.books.get({ uuid: bookUuid });
        if (!book) throw new Error('Book not found');

        const db = connectToBookDatabase(bookUuid);
        const chapters = await db.chapters.orderBy('order').toArray();
        const scenes = await db.scenes.toArray();
        const sceneBodies = await db.sceneBodies.toArray();

        const bodyMap = new Map<number, string>();
        sceneBodies.forEach(b => bodyMap.set(b.sceneId, b.body));

        scenes.forEach(s => (s as any).body = bodyMap.get(s.id!) || '');

        const chapterData: { title: string; html: string }[] = [];

        if (chapters.length) {
            chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
            for (const ch of chapters) {
                const chScenes = scenes
                    .filter(s => s.chapterId === ch.id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
                const html = chScenes.map(s => s.body).join('');
                chapterData.push({ title: ch.title, html });
            }
        } else {
            scenes.sort((a, b) => (a.order || 0) - (b.order || 0));
            scenes.forEach((s, idx) => {
                chapterData.push({ title: s.title || `Chapter ${idx + 1}`, html: s.body });
            });
        }

        const imagesToAdd: { id: string; fileName: string; base64: string; mime: string }[] = [];
        let imageIndex = 1;
        const parser = new DOMParser();

        chapterData.forEach(ch => {
            const doc = parser.parseFromString(ch.html, 'text/html');
            const imgs = Array.from(doc.querySelectorAll('img[src^="data:"]'));
            imgs.forEach(img => {
                const src = img.getAttribute('src');
                if (!src) return;
                const match = src.match(/^data:([^;]+);base64,(.*)$/);
                if (!match) return;
                const mime = match[1];
                const base64 = match[2];
                const ext = mime.split('/')[1] || 'img';
                const fileName = `img${imageIndex}.${ext}`;
                imagesToAdd.push({ id: `img${imageIndex}`, fileName, base64, mime });
                img.setAttribute('src', `../images/${fileName}`);
                imageIndex++;
            });
            ch.html = doc.body.innerHTML;
        });

        const zip = new JSZip();
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        const metaInf = zip.folder('META-INF');
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n  <rootfiles>\n    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n  </rootfiles>\n</container>`;
        metaInf.file('container.xml', containerXml);

        const oebps = zip.folder('OEBPS');
        const textFolder = oebps.folder('text');
        const imagesFolder = oebps.folder('images');

        const manifestItems: string[] = [
            '<item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
        ];
        const spineItems: string[] = [];
        const navPoints: string[] = [];

        imagesToAdd.forEach(img => {
            imagesFolder.file(img.fileName, img.base64, { base64: true });
            manifestItems.push(`<item id="${img.id}" href="images/${img.fileName}" media-type="${img.mime}"/>`);
        });

        chapterData.forEach((ch, idx) => {
            const fileName = `text/chapter${idx + 1}.xhtml`;
            const htmlContent = `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${ch.title}</title></head><body>${ch.html}</body></html>`;
            textFolder.file(`chapter${idx + 1}.xhtml`, htmlContent);
            manifestItems.push(`<item id="chapter${idx + 1}" href="${fileName}" media-type="application/xhtml+xml"/>`);
            spineItems.push(`<itemref idref="chapter${idx + 1}"/>`);
            navPoints.push(`<navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}"><navLabel><text>${ch.title}</text></navLabel><content src="${fileName}"/></navPoint>`);
        });

        let coverMeta = '';
        if (book.cover) {
            const match = book.cover.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
                const mime = match[1];
                const base64 = match[2];
                const ext = mime.split('/')[1] || 'jpg';
                oebps.file(`cover.${ext}`, base64, { base64: true });
                manifestItems.push(`<item id="cover-image" href="cover.${ext}" media-type="${mime}"/>`);
                coverMeta = '<meta name="cover" content="cover-image"/>';
            }
        }

        const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n  <head>\n    <meta name="dtb:uid" content="${book.uuid}"/>\n    <meta name="dtb:depth" content="1"/>\n    <meta name="dtb:totalPageCount" content="0"/>\n    <meta name="dtb:maxPageNumber" content="0"/>\n  </head>\n  <docTitle><text>${book.title}</text></docTitle>\n  <navMap>\n    ${navPoints.join('\n    ')}\n  </navMap>\n</ncx>`;
        oebps.file('toc.ncx', tocNcx);

        const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>\n<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">\n  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n    <dc:title>${book.title}</dc:title>\n    <dc:creator>${book.author}</dc:creator>\n    <dc:language>ru</dc:language>\n    <dc:identifier id="BookId">${book.uuid}</dc:identifier>\n    ${coverMeta}\n  </metadata>\n  <manifest>\n    ${manifestItems.join('\n    ')}\n  </manifest>\n  <spine toc="toc">\n    ${spineItems.join('\n    ')}\n  </spine>\n</package>`;
        oebps.file('content.opf', contentOpf);

        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title}.epub`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    } catch (error: any) {
        console.error('EPUB export error', error);
        notifications.show({
            title: 'Ошибка',
            message: 'Не удалось экспортировать EPUB',
            color: 'red',
        });
        return false;
    }
};

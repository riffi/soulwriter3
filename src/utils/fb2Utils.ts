// fb2Utils.ts
import { IBook, IChapter, IScene } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { notifications } from "@mantine/notifications";
import { BackupData, importBookData } from "@/utils/bookBackupManager";

// Replace <image> tags with <img> and convert binaries to data URLs
function convertSectionToHtml(section: Element, images: Map<string, string>): string {
    const doc = document.implementation.createHTMLDocument('');
    const clone = section.cloneNode(true) as Element;
    const title = clone.querySelector('title');
    if (title) title.remove();

    clone.querySelectorAll('image').forEach(imgNode => {
        const ref =
            imgNode.getAttribute('href') ||
            imgNode.getAttribute('xlink:href') ||
            imgNode.getAttribute('l:href');
        if (ref) {
            const id = ref.replace(/^#/, '');
            const src = images.get(id);
            const imgEl = doc.createElement('img');
            if (src) imgEl.setAttribute('src', src);
            imgNode.parentNode?.replaceChild(imgEl, imgNode);
        }
    });

    doc.body.appendChild(clone);
    return doc.body.innerHTML;
}

export const importFb2File = async (file: File): Promise<boolean> => {
    return new Promise(resolve => {
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(reader.result as string, 'application/xml');

                const images = new Map<string, string>();
                xml.querySelectorAll('binary[id]').forEach(bin => {
                    const id = bin.getAttribute('id');
                    if (!id) return;
                    const type = bin.getAttribute('content-type') || 'image/jpeg';
                    const base64 = bin.textContent?.trim() || '';
                    images.set(id, `data:${type};base64,${base64}`);
                });

                const bookTitle = xml.querySelector('title-info > book-title')?.textContent || 'Untitled Book';
                const firstName = xml.querySelector('title-info > author > first-name')?.textContent || '';
                const lastName = xml.querySelector('title-info > author > last-name')?.textContent || '';
                const author = `${firstName} ${lastName}`.trim() || 'Unknown Author';

                let cover: string | undefined;
                const coverHref = xml.querySelector('title-info > coverpage > image')?.getAttribute('href');
                if (coverHref) {
                    const id = coverHref.replace(/^#/, '');
                    cover = images.get(id);
                }

                const bookUuid = generateUUID();
                const chapters: Omit<IChapter, 'id'>[] = [];
                const scenes: IScene[] = [];

                let order = 1;
                xml.querySelectorAll('body > section').forEach(section => {
                    const chapterTitle = section.querySelector('title > p')?.textContent?.trim() || `Глава ${order}`;
                    const html = convertSectionToHtml(section, images);
                    const text = new DOMParser().parseFromString(html, 'text/html').body.textContent || '';

                    scenes.push({
                        title: chapterTitle,
                        body: html.trim(),
                        order,
                        chapterId: order,
                        totalSymbolCountWithSpaces: text.length,
                        totalSymbolCountWoSpaces: text.replace(/\s/g, '').length,
                    });

                    chapters.push({ title: chapterTitle, order, contentSceneId: order });

                    order++;
                });

                const newBook: IBook = {
                    uuid: bookUuid,
                    title: bookTitle,
                    author,
                    form: 'Роман',
                    genre: '',
                    configurationUuid: '',
                    configurationTitle: '',
                    cover,
                    kind: 'book',
                    description: `Imported from FB2 (${file.name})`,
                    chapterOnlyMode: 1
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
                };

                await importBookData(backupData);

                notifications.show({
                    title: 'FB2 Processed',
                    message: `Data for "${newBook.title}" prepared. Attempting import.`,
                    color: 'info',
                });

                resolve(true);
            } catch (error: any) {
                console.error('Error processing FB2:', error);
                notifications.show({
                    title: 'FB2 Import Failed',
                    message: `Failed to import FB2: ${error.message || 'Unknown error'}`,
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

        reader.readAsText(file);
    });
};

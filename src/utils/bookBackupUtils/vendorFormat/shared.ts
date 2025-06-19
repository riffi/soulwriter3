import { IBook, IChapter, IScene } from '@/entities/BookEntities';
import { generateUUID } from '@/utils/UUIDUtils';
import { BackupData } from '@/utils/bookBackupUtils/bookBackupManager';

export function cleanForWordCount(text: string): string {
  return text
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/\u2060/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r?\n/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function textFromHtml(html: string): string {
  const parser = new DOMParser();
  const parsedText = parser.parseFromString(html, 'text/html').body.textContent || '';
  return cleanForWordCount(parsedText);
}

export function prepareScenesData(scenes: IScene[]): {
  scenesToImport: Omit<IScene, 'body'>[];
  sceneBodies: { sceneId: number; body: string }[];
} {
  const scenesToImport: Omit<IScene, 'body'>[] = [];
  const sceneBodies: { sceneId: number; body: string }[] = [];
  scenes.forEach((scene, index) => {
    const sceneId = index + 1;
    const { body, ...rest } = scene;
    scenesToImport.push({ ...(rest as Omit<IScene, 'body'>), id: sceneId });
    sceneBodies.push({ sceneId, body: body || '' });
  });
  return { scenesToImport, sceneBodies };
}

export function buildBackupData(
  book: IBook,
  chapters: Omit<IChapter, 'id'>[],
  scenes: IScene[]
): BackupData {
  const { scenesToImport, sceneBodies } = prepareScenesData(scenes);
  return {
    book,
    chapters,
    scenes: scenesToImport,
    sceneBodies,
    blockInstances: [],
    blockParameterInstances: [],
    blockInstanceRelations: [],
    bookConfigurations: [
      {
        uuid: generateUUID(),
        title: book.title,
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
}

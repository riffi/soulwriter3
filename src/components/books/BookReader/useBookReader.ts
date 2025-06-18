import { useEffect, useState } from 'react';
import { bookDb } from '@/entities/bookDb';
import { useLiveQuery } from "dexie-react-hooks";
import { SceneRepository } from "@/repository/Scene/SceneRepository";
import { ChapterRepository } from "@/repository/Scene/ChapterRepository";
import { useUiSettingsStore } from "@/stores/uiSettingsStore/uiSettingsStore";

export const useBookReader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { chapterOnlyMode } = useUiSettingsStore();

  const chapters = useLiveQuery(() => ChapterRepository.getAll(bookDb), [], null);
  const scenes = useLiveQuery(async () => {
    if (chapterOnlyMode) {
      const chaps = await ChapterRepository.getAll(bookDb);
      const chapterScenes = await Promise.all(
          chaps.map(async (c) => {
            if (c.contentSceneId !== undefined) {
              const sc = await SceneRepository.getById(bookDb, c.contentSceneId);
              return sc ? { ...sc, order: c.order, chapterId: c.id } : undefined;
            }
            return undefined;
          })
      );
      return chapterScenes.filter((s): s is NonNullable<typeof s> => !!s).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return SceneRepository.getAll(bookDb);
  }, [chapterOnlyMode], null);


  useEffect(() => {
    if (scenes === null || chapters === null) {
      // Queries are still loading
      setLoading(true);
    } else if (scenes instanceof Error || chapters instanceof Error) {
      // Handle error case
      setError('Failed to load book data');
      setLoading(false);
    } else {
      // Data loaded successfully
      setLoading(false);
    }
  }, [scenes, chapters]);

  return { scenes, chapters, loading, error };
};

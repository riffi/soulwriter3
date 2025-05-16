import { useEffect, useState } from 'react';
import { IScene, IChapter } from '@/entities/BookEntities';
import { bookDb } from '@/entities/bookDb';
import { useLiveQuery } from "dexie-react-hooks";

export const useBookReader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scenes = useLiveQuery(() => bookDb.scenes.orderBy("order").toArray(), [], null);
  const chapters = useLiveQuery(() => bookDb.chapters.orderBy("order").toArray(), [], null);

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

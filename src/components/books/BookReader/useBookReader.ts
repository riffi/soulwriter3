// hooks/useBookData.ts
import { useEffect, useState } from 'react';
import { IScene, IChapter } from '@/entities/BookEntities';
import { bookDb } from '@/entities/bookDb';

export const useBookReader = () => {
  const [data, setData] = useState<{ scenes: IScene[]; chapters: IChapter[] }>({ scenes: [], chapters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [chaptersData, scenesData] = await Promise.all([
          bookDb.chapters.orderBy('order').toArray(),
          bookDb.scenes.orderBy('order').toArray(),
        ]);
        setData({ scenes: scenesData, chapters: chaptersData });
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { ...data, loading, error };
};

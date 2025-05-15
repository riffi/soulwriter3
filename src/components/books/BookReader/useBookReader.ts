// hooks/useBookData.ts
import { useEffect, useState } from 'react';
import { IScene, IChapter } from '@/entities/BookEntities';
import { bookDb } from '@/entities/bookDb';
import {useLiveQuery} from "dexie-react-hooks";

export const useBookReader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scenes = useLiveQuery(() => bookDb.scenes.orderBy("order").toArray(), []);
  const chapters = useLiveQuery(() => bookDb.chapters.orderBy("order").toArray(), []);

  return {scenes, chapters, loading, error };
};

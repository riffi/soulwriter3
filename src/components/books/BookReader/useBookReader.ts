import { useEffect, useState } from 'react';
import { bookDb } from '@/entities/bookDb';
import { useLiveQuery } from "dexie-react-hooks";
import {SceneRepository} from "@/repository/Scene/SceneRepository";
import {ChapterRepository} from "@/repository/Scene/ChapterRepository";

export const useBookReader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scenes = useLiveQuery(() => SceneRepository.getAll(bookDb), [], null);
  const chapters = useLiveQuery(() => ChapterRepository.getAll(bookDb), [], null);


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

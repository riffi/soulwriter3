import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiSettingsStore {
  noteManagerMode: 'folders' | 'list';
  setNoteManagerMode: (mode: 'folders' | 'list') => void;

  notesSortType: 'date' | 'title';
  setNotesSortType: (sortType: 'date' | 'title') => void;
}

export const useUiSettingsStore = create<UiSettingsStore>()(
    persist(
        (set) => ({
          noteManagerMode: 'folders',
          setNoteManagerMode: (mode) => set({ noteManagerMode: mode }),

          notesSortType: 'date',
          setNotesSortType: (sortType) => set({ notesSortType: sortType }),
        }),
        {
          name: 'ui-settings-storage',
        }
    )
);

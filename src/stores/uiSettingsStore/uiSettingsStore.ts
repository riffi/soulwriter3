import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BlockInstanceSortType = 'date' | 'title';

interface UiSettingsState {
    noteManagerMode: 'folders' | 'list';
    setNoteManagerMode: (mode: 'folders' | 'list') => void;

    notesSortType: 'date' | 'title';
    setNotesSortType: (sortType: 'date' | 'title') => void;

    blockInstanceViewMode: 'data' | 'diagram';
    setBlockInstanceViewMode: (mode: 'data' | 'diagram') => void;

    blockInstanceSortType: BlockInstanceSortType;
    setBlockInstanceSortType: (mode: BlockInstanceSortType) => void;
}

export const useUiSettingsStore = create<UiSettingsState>()(
    persist(
        (set) => ({
            noteManagerMode: 'folders',
            setNoteManagerMode: (mode) => set({ noteManagerMode: mode }),

            notesSortType: 'date',
            setNotesSortType: (sortType) => set({ notesSortType: sortType }),

            blockInstanceViewMode: 'diagram',
            setBlockInstanceViewMode: (mode) => set({ blockInstanceViewMode: mode }),

            blockInstanceSortType: 'date',
            setBlockInstanceSortType: (type) => set({ blockInstanceSortType: type }),
        }),
        {
            name: 'ui-settings-storage',
        }
    )
);

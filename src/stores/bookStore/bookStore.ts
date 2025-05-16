import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {IBook} from "@/entities/BookEntities";

interface BookStore {
  selectedBook: IBook | null;
  selectBook: (book: IBook) => void;
  clearSelectedBook: () => void;
  collapsedChapters: number[];
  toggleChapterCollapse: (chapterId: number) => void;
}

export const useBookStore = create<BookStore>()(
    persist(
        (set, get) => ({
          selectedBook: null,
          collapsedChapters: [],
          selectBook: (book) => set({ selectedBook: book }),
          clearSelectedBook: () => set({ selectedBook: null, collapsedChapters: [] }),
          toggleChapterCollapse: (chapterId) => {
            const current = get().collapsedChapters;
            set({
              collapsedChapters: current.includes(chapterId)
                  ? current.filter(id => id !== chapterId)
                  : [...current, chapterId]
            });
          }
        }),
        {
          name: 'selected-book-storage',
        }
    )
);

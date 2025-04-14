// stores/bookStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {IBook} from "@/entities/BookEntities";

interface BookStore {
  selectedBook: IBook | null;
  selectBook: (book: IBook) => void;
  clearSelectedBook: () => void;
}

export const useBookStore = create<BookStore>()(
    persist(
        (set) => ({
          selectedBook: null,
          selectBook: (book) => set({ selectedBook: book }),
          clearSelectedBook: () => set({ selectedBook: null }),
        }),
        {
          name: 'selected-book-storage',
        }
    )
);

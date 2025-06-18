// hooks/useBookDbConnection.ts
import { useEffect } from "react";
import { useBookStore } from "@/stores/bookStore/bookStore";
import { connectToBookDatabase, bookDb } from "@/entities/bookDb";

export const useBookDbConnection = () => {
  const { selectedBook } = useBookStore();

  useEffect(() => {
    if (selectedBook && !bookDb) {
      connectToBookDatabase(selectedBook.uuid);
    }
  }, [selectedBook]);
};

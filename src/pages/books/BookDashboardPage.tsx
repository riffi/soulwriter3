import {BookDashboard} from "@/components/books/BookDashboard/BookDashboard";
import {useBookStore} from "@/stores/bookStore/bookStore";

export const BookDashboardPage = () => {
  const {selectedBook} = useBookStore()

  return (
      <>
        <BookDashboard bookUuid={selectedBook?.uuid}/>
      </>
  )

}

import {useLiveQuery} from "dexie-react-hooks";
import {bookDb} from "@/entities/bookDb";

export const useSceneLayout = () => {
  const scenes = useLiveQuery(() => bookDb.scenes.orderBy("order").toArray(), [])
  const chapters = useLiveQuery(() => bookDb.chapters.orderBy("order").toArray(), [])

  return {
    scenes,
    chapters
  }
}

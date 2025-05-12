import {INote} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";
import moment from "moment";

const save = async (db: configDatabase, note: INote) => {
  const dataToSave = {...note};
  dataToSave.updatedAt = moment().toISOString(true);
  if (!note.id) {
    return await db.notes.add(dataToSave);
  }
  return await db.notes.put(dataToSave);
}

const getByUuid = async (db: configDatabase, uuid: string) => {
  return await db.notes.where('uuid').equals(uuid).first();
}

export const NoteRepository = {
  save,
  getByUuid
}

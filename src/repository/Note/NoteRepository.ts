import {INote} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb"; // Removed ConfigDatabase import
import moment from "moment";

const save = async (db: typeof configDatabase, note: INote) => { // Changed type to typeof configDatabase
  const dataToSave = {...note};
  dataToSave.updatedAt = moment().toISOString(true);
  if (!note.id) {
    return await db.notes.add(dataToSave);
  }
  return await db.notes.put(dataToSave);
}

const getByUuid = async (db: typeof configDatabase, uuid: string) => { // Changed type to typeof configDatabase
  return await db.notes.where('uuid').equals(uuid).first();
}

const remove = async (db: typeof configDatabase, uuid: string) => { // Changed type to typeof configDatabase
  return await db.notes.where('uuid').equals(uuid).delete();
}

export const NoteRepository = {
  save,
  getByUuid,
  remove
}

import { useLiveQuery } from "dexie-react-hooks";
import { configDatabase } from "@/entities/configuratorDb";
import { INote, INoteGroup } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";

export const useNoteManager = () => {
  const { showDialog } = useDialog();

  const noteGroups = useLiveQuery<INoteGroup[]>(() =>
      configDatabase.notesGroups.toArray(), []
  );

  const notes = useLiveQuery<INote[]>(() =>
      configDatabase.notes.toArray(), []
  );

  const createNoteGroup = async (group: Omit<INoteGroup, 'id'>) => {
    const newGroup = {
      ...group,
      uuid: generateUUID(),
      order: noteGroups?.length || 0
    };
    await configDatabase.notesGroups.add(newGroup as INoteGroup);
    return newGroup;
  };

  const updateNoteGroup = async (group: INoteGroup) => {
    if (!group.id){
      await createNoteGroup(group)
    }
    else{
      await configDatabase.notesGroups.update(group.id!, group);
    }
  };

  const deleteNoteGroup = async (uuid: string) => {
    const confirm = await showDialog("Подтверждение", "Удалить группу и все заметки в ней?");
    if (!confirm) return;

    const groupNotes = await configDatabase.notes
    .where('noteGroupUuid').equals(uuid)
    .toArray();

    await configDatabase.notes.bulkDelete(groupNotes.map(n => n.id!));
    await configDatabase.notesGroups.where('uuid').equals(uuid).delete();
  };

  const createNote = async (note: Omit<INote, 'id' | 'uuid'>) => {
    const newNote = {
      ...note,
      uuid: generateUUID(),
      body: '',
      tags: note.tags.join(','), // Преобразуем массив в строку
      order: notes?.length || 0
    };
    await configDatabase.notes.add(newNote as INote);
    return newNote;
  };

  const updateNote = async (note: INote) => {
    await configDatabase.notes.update(note.id!, note);
  };

  const deleteNote = async (uuid: string) => {
    await configDatabase.notes.where('uuid').equals(uuid).delete();
  };

  return {
    noteGroups: noteGroups || [],
    notes: notes || [],
    createNoteGroup,
    updateNoteGroup,
    deleteNoteGroup,
    createNote,
    updateNote,
    deleteNote
  };
};

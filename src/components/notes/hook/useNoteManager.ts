import { useLiveQuery } from "dexie-react-hooks";
import { configDatabase } from "@/entities/configuratorDb";
import { INote, INoteGroup } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import {NoteRepository} from "@/repository/Note/NoteRepository";

export const useNoteManager = () => {
  const { showDialog } = useDialog();

  const getTopLevelGroups = () => configDatabase.notesGroups.filter(
      (group) => group.parentUuid === undefined || group.parentUuid === "topLevel")
      .toArray();

  const getChildGroups = (parentUuid: string) => configDatabase.notesGroups.where('parentUuid').equals(parentUuid).toArray();

  const getNotesByGroup = (groupUuid: string) => configDatabase.notes.where('noteGroupUuid').equals(groupUuid).toArray();
  const getAllNotes = () => configDatabase.notes.toArray();


  const createNoteGroup = async (group: Omit<INoteGroup, 'id'>) => {
    const newGroup = {
      ...group,
      uuid: generateUUID(),
      parentUuid: group.parentUuid || "topLevel",
      kindCode: group.kindCode || 'userGroup', // Add this line
      order: await configDatabase.notesGroups.count()
    };
    await configDatabase.notesGroups.add(newGroup as INoteGroup);
    return newGroup;
  };

  const updateNoteGroup = async (group: INoteGroup) => {
    if (!group.id) {
      await createNoteGroup(group);
    } else {
      // Сохраняем остальные свойства группы
      const existingGroup = await configDatabase.notesGroups.get(group.id);
      const updatedGroup = { ...existingGroup, ...group };
      await configDatabase.notesGroups.update(group.id, updatedGroup);
    }
  };

  const deleteNoteGroup = async (uuid: string) => {
    // Fetch the group first
    const groupToDelete = await configDatabase.notesGroups.where('uuid').equals(uuid).first();

    // Check if the group exists and if it's a system group
    if (groupToDelete && groupToDelete.kindCode === 'system') {
      // Ideally, show a notification here, but hooks shouldn't directly cause UI side effects like notifications.
      // The component calling this function should handle the notification.
      // For now, we can console log or just prevent deletion.
      console.warn(`Attempted to delete a system group: ${groupToDelete.title}`);
      // Or use the showDialog for feedback, though it's already used for confirmation.
      // A different dialog or a more specific error state might be better.
      // For this task, let's use showDialog to give feedback.
      await showDialog("Ошибка", "Системные группы не могут быть удалены.");
      return;
    }

    const confirm = await showDialog("Подтверждение", "Удалить папку и все вложенные элементы?");
    if (!confirm) return;

    // ... rest of the function (deleteChildrenRecursively and transaction) remains the same
    const deleteChildrenRecursively = async (parentUuid: string) => {
      const childGroups = await configDatabase.notesGroups
          .where('parentUuid')
          .equals(parentUuid)
          .toArray();

      await Promise.all(childGroups.map(async (group) => {
        await deleteChildrenRecursively(group.uuid);
        await configDatabase.notesGroups.delete(group.id!); // Added non-null assertion for id
      }));

      await configDatabase.notes
          .where('noteGroupUuid')
          .equals(parentUuid)
          .delete();
    };

    await configDatabase.transaction('rw', configDatabase.notesGroups, configDatabase.notes, async () => {
      await deleteChildrenRecursively(uuid);
      await configDatabase.notesGroups.where('uuid').equals(uuid).delete();
    });
  };

  const createNote = async (note: Omit<INote, 'id' | 'uuid'>) => {
    const newNote = {
      ...note,
      uuid: generateUUID(),
      body: '',
      order: await configDatabase.notes.count()
    };
    await NoteRepository.save(configDatabase, newNote as INote);
    return newNote;
  };

  const updateNote = async (note: INote) => {
    if (!note.id) return;
    await NoteRepository.save(configDatabase, note);
  };

  const deleteNote = async (uuid: string) => {
    const confirm = await showDialog("Подтверждение", "Удалить заметку?");
    if (!confirm) return;
    await NoteRepository.remove(configDatabase, uuid);
  };

  return {
    getTopLevelGroups,
    getChildGroups,
    getNotesByGroup,
    getAllNotes,
    createNoteGroup,
    updateNoteGroup,
    deleteNoteGroup,
    createNote,
    deleteNote,
    updateNote
  };
};

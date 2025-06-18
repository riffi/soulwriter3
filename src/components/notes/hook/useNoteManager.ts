import { useLiveQuery } from "dexie-react-hooks";
import { configDatabase } from "@/entities/configuratorDb";
import { INote, INoteGroup } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import {NoteRepository} from "@/repository/Note/NoteRepository";
import {NoteGroupRepository} from "@/repository/Note/NoteGroupRepository";

export const useNoteManager = () => {
  const { showDialog } = useDialog();

  const getTopLevelGroups = () => NoteGroupRepository.getTopLevel(configDatabase);

  const getChildGroups = (parentUuid: string) => NoteGroupRepository.getChildren(configDatabase, parentUuid);

  const getNotesByGroup = (groupUuid: string) => configDatabase.notes.where('noteGroupUuid').equals(groupUuid).toArray();

  const getAllNotes = (bookUuid?: string) => {
    if (bookUuid) {
      return configDatabase.notes.where('bookUuid').equals(bookUuid).toArray();
    }
    return configDatabase.notes.toArray();
  };

  const createNoteGroup = async (group: Omit<INoteGroup, 'id'>) => {
    const prepared = {
      ...group,
      uuid: generateUUID(),
    } as Omit<INoteGroup, 'id'>;
    return NoteGroupRepository.create(configDatabase, prepared);
  };

  const updateNoteGroup = async (group: INoteGroup) => {
    await NoteGroupRepository.update(configDatabase, group);
  };

  const deleteNoteGroup = async (uuid: string) => {
    // Fetch the group first
    const groupToDelete = await NoteGroupRepository.getByUuid(configDatabase, uuid);

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
      const childGroups = await NoteGroupRepository.getChildren(configDatabase, parentUuid);

      await Promise.all(childGroups.map(async (group) => {
        await deleteChildrenRecursively(group.uuid);
        if (group.id !== undefined) {
          await NoteGroupRepository.deleteById(configDatabase, group.id);
        }
      }));

      await configDatabase.notes
          .where('noteGroupUuid')
          .equals(parentUuid)
          .delete();
    };

    await configDatabase.transaction('rw', configDatabase.notesGroups, configDatabase.notes, async () => {
      await deleteChildrenRecursively(uuid);
      await NoteGroupRepository.remove(configDatabase, uuid);
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

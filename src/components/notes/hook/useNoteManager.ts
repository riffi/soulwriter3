import { useLiveQuery } from "dexie-react-hooks";
import { configDatabase } from "@/entities/configuratorDb";
import { INote, INoteGroup } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";

export const useNoteManager = () => {
  const { showDialog } = useDialog();

  const getTopLevelGroups = () => configDatabase.notesGroups.where('parentUuid').equals("topLevel").toArray();
  const getChildGroups = (parentUuid: string) => configDatabase.notesGroups.where('parentUuid').equals(parentUuid).toArray();

  const getNotesByGroup = (groupUuid: string) => configDatabase.notes.where('noteGroupUuid').equals(groupUuid).toArray();
  const getAllNotes = () => configDatabase.notes.toArray();

  const createNoteGroup = async (group: Omit<INoteGroup, 'id'>) => {
    const newGroup = {
      ...group,
      uuid: generateUUID(),
      parentUuid: group.parentUuid || "topLevel",
      order: await configDatabase.notesGroups.count()
    };
    await configDatabase.notesGroups.add(newGroup as INoteGroup);
    return newGroup;
  };

  const updateNoteGroup = async (group: INoteGroup) => {
    if (!group.id) {
      await createNoteGroup(group);
    } else {
      await configDatabase.notesGroups.update(group.id, group);
    }
  };

  const deleteNoteGroup = async (uuid: string) => {
    const confirm = await showDialog("Подтверждение", "Удалить группу и все вложенные элементы?");
    if (!confirm) return;

    const deleteChildrenRecursively = async (parentUuid: string) => {
      // Удаляем все дочерние группы (включая глубокую вложенность)
      const childGroups = await configDatabase.notesGroups
        .where('parentUuid')
        .equals(parentUuid)
        .toArray();

      // Рекурсивно удаляем всех потомков
      await Promise.all(childGroups.map(async (group) => {
        await deleteChildrenRecursively(group.uuid); // Сначала удаляем вложенные элементы
        await configDatabase.notesGroups.delete(group.id);
      }));

      // Удаляем все заметки в текущей группе
      await configDatabase.notes
        .where('noteGroupUuid')
        .equals(parentUuid)
        .delete();
    };

    await configDatabase.transaction('rw', configDatabase.notesGroups, configDatabase.notes, async () => {
      // Удаляем всю иерархию
      await deleteChildrenRecursively(uuid);

      // Удаляем саму целевую папку
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
    await configDatabase.notes.add(newNote as INote);
    return newNote;
  };

  const deleteNote = async (uuid: string) => {
    await configDatabase.notes.where('uuid').equals(uuid).delete();
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
    deleteNote
  };
};

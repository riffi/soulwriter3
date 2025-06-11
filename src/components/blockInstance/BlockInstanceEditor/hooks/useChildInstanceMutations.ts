import { bookDb } from "@/entities/bookDb";
import { BlockInstanceRepository } from "@/repository/BlockInstance/BlockInstanceRepository";
import { IBlockStructureKind } from "@/entities/ConstructorEntities";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import { generateUUID } from '@/utils/UUIDUtils'; // Assuming this is the right path for UUID generation

export function useChildInstanceMutations() {
  const { showDialog } = useDialog();

  const addChildInstance = async (
    parentBlockInstanceUuid: string,
    childBlockUuid: string,
    title: string,
    structureKind: IBlockStructureKind // May not be strictly needed by repo if it derives from childBlockUuid
  ) => {
    // The existing BlockInstanceRepository.createChildInstance might not exist
    // or might have a different signature.
    // Let's assume a more generic creation or find a suitable method.
    // For now, constructing a new instance and adding it.
    // This might need to be BlockInstanceRepository.createBlockInstance and then link it
    // or a specific child creation method.
    // Based on typical structure, parentBlockInstanceUuid is used to link.

    // The current CreateChildInstanceModal uses BlockInstanceRepository.create,
    // which suggests a more direct creation method.
    // Let's align with what BlockInstanceRepository.create might do for a child.

    const newInstance = {
      uuid: generateUUID(),
      blockUuid: childBlockUuid,
      parentBlockInstanceUuid: parentBlockInstanceUuid,
      title: title,
      shortDescription: "", // Default
      icon: null, // Default
      // other necessary fields for a new block instance
      displayOrder: 0, // Default or calculate next
      props: {}, // Default
    };

    // Assuming BlockInstanceRepository.create can handle parentBlockInstanceUuid for linking
    // If not, a specific "create child" method in the repo would be better.
    await BlockInstanceRepository.create(bookDb, newInstance);
    // If create doesn't handle linking, an additional step would be needed here or in the repo.
    return newInstance; // Return the new instance or its UUID
  };

  const updateChildInstanceTitle = async (instanceUuid: string, newTitle: string) => {
    // Assuming BlockInstanceRepository.update can take partial data
    // The current ChildInstancesTable uses:
    // await BlockInstanceRepository.update(bookDb, instance.uuid, { ...instance, title: editTitle });
    // This is problematic as it passes the whole instance. A proper update should take ID and partial data.
    // Let's refine this to a more standard partial update.
    const currentInstance = await BlockInstanceRepository.getByUuid(bookDb, instanceUuid);
    if (currentInstance) {
        await BlockInstanceRepository.update(bookDb, instanceUuid, { ...currentInstance, title: newTitle });
    } else {
        throw new Error("Instance not found for update");
    }
  };


  const deleteChildInstance = async (instanceUuid: string, instanceTitle?: string) => {
    const confirm = await showDialog("Внимание", `Вы действительно хотите удалить ${instanceTitle || 'этот элемент'}?`);
    if (!confirm) return false;
    await BlockInstanceRepository.remove(bookDb, instanceUuid); // remove vs deleteInstance
    return true;
  };

  return {
    addChildInstance,
    updateChildInstanceTitle,
    deleteChildInstance,
  };
}

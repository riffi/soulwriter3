import { bookDb } from "@/entities/bookDb";
import { BlockInstanceRepository } from "@/entities/BlockInstanceRepository";
import { IIcon } from "@/entities/ConstructorEntities";

export function useBlockInstanceMutations(blockInstanceUuid: string) {
  const updateBlockInstanceTitle = async (newTitle: string) => {
    const blockInstance =
      await BlockInstanceRepository.getBlockInstanceByUuid(blockInstanceUuid);
    if (blockInstance) {
      await BlockInstanceRepository.updateBlockInstance(blockInstance.id!, {
        title: newTitle,
      });
    }
  };

  const updateBlockInstanceShortDescription = async (
    newShortDescription: string
  ) => {
    const blockInstance =
      await BlockInstanceRepository.getBlockInstanceByUuid(blockInstanceUuid);
    if (blockInstance) {
      await BlockInstanceRepository.updateBlockInstance(blockInstance.id!, {
        shortDescription: newShortDescription,
      });
    }
  };

  const updateBlockInstanceIcon = async (newIcon: IIcon) => {
    const blockInstance =
      await BlockInstanceRepository.getBlockInstanceByUuid(blockInstanceUuid);
    if (blockInstance) {
      await BlockInstanceRepository.updateBlockInstance(blockInstance.id!, {
        icon: newIcon,
      });
    }
  };

  return {
    updateBlockInstanceTitle,
    updateBlockInstanceShortDescription,
    updateBlockInstanceIcon,
  };
}

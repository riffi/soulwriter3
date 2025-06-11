import { bookDb } from "@/entities/bookDb";
import { BlockParameterInstanceRepository } from "@/entities/BlockParameterInstanceRepository";
import { IBlockParameterInstance } from "@/entities/BookEntities";

export function useBlockParameterMutations() {
  const addBlockParameterInstance = async (
    newInstance: IBlockParameterInstance
  ) => {
    await BlockParameterInstanceRepository.addParameterInstance(newInstance);
  };

  const deleteBlockParameterInstance = async (instanceId: number) => {
    await BlockParameterInstanceRepository.deleteParameterInstance(instanceId);
  };

  const updateBlockParameterInstanceValue = async (
    instance: IBlockParameterInstance,
    newValue: string | number
  ) => {
    await BlockParameterInstanceRepository.updateParameterInstance(instance, {
      value: newValue,
    });
  };

  return {
    addBlockParameterInstance,
    deleteBlockParameterInstance,
    updateBlockParameterInstanceValue,
  };
}

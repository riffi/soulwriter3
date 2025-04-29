import {BookDB} from "@/entities/bookDb";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import {BlockRepository} from "@/repository/BlockRepository";

const getByUuid = async (db: BookDB, blockInstanceUuid: string) => {
  return db.blockInstances.where('uuid').equals(blockInstanceUuid).first();
}

const getBlockInstances = async (db: BookDB, blockUuid: string) => {
  return  db.blockInstances
    .where('blockUuid')
    .equals(blockUuid)
    .toArray();
}

const appendDefaultParams = async (db: BookDB, instance: IBlockInstance)=> {
  const defaultParameters =
      await BlockRepository.getDefaultParameters(db, instance.blockUuid);


  const defaultParameterInstances = []
  for (const defaultParameter of defaultParameters) {
    const blockParameterInstance: IBlockParameterInstance = {
      uuid: generateUUID(),
      blockInstanceUuid: instance.uuid!!,
      blockParameterUuid: defaultParameter.uuid!!,
      blockParameterGroupUuid: defaultParameter.groupUuid,
      value: "",
    }
    defaultParameterInstances.push(blockParameterInstance);
  }
  await db
  .blockParameterInstances
  .bulkAdd(defaultParameterInstances)
}

export const BlockInstanceRepository = {
  getByUuid,
  getBlockInstances,
  appendDefaultParams,
}

import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance, IBlockParameterInstance} from "@/entities/BookEntities";
import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";

export const useBlockInstanceManager = (blockUuid: string) => {

  const block = useLiveQuery<IBlock>(() => {
    return bookDb.blocks
      .where('uuid')
      .equals(blockUuid)
      .first();
  }, [blockUuid]);

  const instances = useLiveQuery<IBlockInstance[]>(() => {
    return  bookDb.blockInstances
      .where('blockUuid')
      .equals(blockUuid)
      .toArray();
  }, [blockUuid]);

  async function appendDefaultParams(data: IBlockInstance) {
    const defaultParameters = await bookDb
      .blockParameters
      .where({
        blockUuid: data.blockUuid,
        isDefault: 1
      })
      .toArray()


    const defaultParameterInstances = []
    for (const defaultParameter of defaultParameters) {
      const blockParameterInstance: IBlockParameterInstance = {
        uuid: generateUUID(),
        blockInstanceUuid: data.uuid!!,
        blockParameterUuid: defaultParameter.uuid!!,
        blockParameterGroupUuid: defaultParameter.groupUuid,
        value: "",
      }
      defaultParameterInstances.push(blockParameterInstance);
    }
    await bookDb
    .blockParameterInstances
    .bulkAdd(defaultParameterInstances)
  }

  const addBlockInstance = async (data: IBlockInstance) => {
    console.log("Adding new block instance", data);
    const instanceId =  await bookDb.blockInstances.add(data);
    await appendDefaultParams(data);
  }

  const updateBlockInstance = async (data: IBlockInstance) => {
    await bookDb.blockInstances.put(data);
  }

  const deleteBlockInstance = async (data: IBlockInstance) => {
    await bookDb.blockParameterInstances.where('blockInstanceUuid').equals(data.uuid).delete();
    await bookDb.blockInstances.delete(data.id);
  }


  return {
    block,
    instances,
    addBlockInstance,
    updateBlockInstance,
    deleteBlockInstance
  }
}

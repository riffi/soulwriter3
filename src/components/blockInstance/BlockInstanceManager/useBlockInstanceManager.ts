import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";
import {IBlockInstance} from "@/entities/BookEntities";
import {configDatabase} from "@/entities/configuratorDb";
import {IBlock} from "@/entities/ConstructorEntities";

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
  return {
    block,
    instances
  }
}

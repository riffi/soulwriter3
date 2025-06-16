import {BookDB} from "@/entities/bookDb";
import { IBlockInstance, IBlockParameterInstance } from "@/entities/BookEntities";
import { generateUUID } from "@/utils/UUIDUtils";
import { updateBlockInstance } from "./BlockInstanceUpdateHelper";
import {BlockParameterRepository} from "@/repository/Block/BlockParameterRepository";
import {IBlockParameter} from "@/entities/ConstructorEntities";
import {updateBookSyncState} from "@/utils/bookSyncUtils";

async function updateBook(db: BookDB) {
    const bookUuid = db.name.replace('book_db_', '');
    await updateBookSyncState(bookUuid, 'localChanges');
}
export const getInstanceParams = async (db: BookDB, instanceUuid: string) => {
    return db.blockParameterInstances
        .where('blockInstanceUuid')
        .equals(instanceUuid)
        .toArray();
}

export const appendDefaultParam = async (db: BookDB, instance: IBlockInstance, param: IBlockParameter) => {
    const paramInstance: IBlockParameterInstance = {
        uuid: generateUUID(),
        blockInstanceUuid: instance.uuid!,
        blockParameterUuid: param.uuid!,
        blockParameterGroupUuid: param.groupUuid,
        value: "",
    };
    await db.blockParameterInstances.add(paramInstance);
    await updateBlockInstance(db, instance);
    await updateBook(db);
}

export const appendDefaultParams = async (db: BookDB, instance: IBlockInstance) => {
    if (!instance.uuid) return;

    const defaultParameters = await BlockParameterRepository.getDefaultParameters(db, instance.blockUuid);
    if (defaultParameters.length === 0) return;

    const paramInstances = defaultParameters.map(param => ({
        uuid: generateUUID(),
        blockInstanceUuid: instance.uuid!,
        blockParameterUuid: param.uuid!,
        blockParameterGroupUuid: param.groupUuid,
        value: "",
    }));

    await db.blockParameterInstances.bulkAdd(paramInstances);
    await updateBlockInstance(db, instance);
    await updateBook(db);
}

export const addParameterInstance = async (db: BookDB, instance: IBlockParameterInstance) => {
    await db.blockParameterInstances.add(instance);
    const blockInstance = await db.blockInstances.get({ uuid: instance.blockInstanceUuid });
    if (blockInstance) await updateBlockInstance(db, blockInstance);
    await updateBook(db);
}



export const updateParameterInstance = async (db: BookDB, id: number, changes: Partial<IBlockParameterInstance>) => {
    await db.blockParameterInstances.update(id, changes);
    const paramInstance = await db.blockParameterInstances.get(id);
    if (!paramInstance) return;

    const blockInstance = await db.blockInstances.get({ uuid: paramInstance.blockInstanceUuid });
    if (blockInstance) await updateBlockInstance(db, blockInstance);
    await updateBook(db);
}

export const deleteParameterInstance = async (db: BookDB, id: number) => {
    const paramInstance = await db.blockParameterInstances.get(id);
    if (!paramInstance) return;

    await db.blockParameterInstances.delete(id);
    const blockInstance = await db.blockInstances.get({ uuid: paramInstance.blockInstanceUuid });
    if (blockInstance) await updateBlockInstance(db, blockInstance);
    await updateBook(db);
}

export const removeAllForInstance = async (db: BookDB, instanceUuid: string) => {
    await Promise.all([
        db.blockParameterInstances.where('blockInstanceUuid').equals(instanceUuid).delete(),
        db.blockParameterInstances.where('value').equals(instanceUuid).delete()
    ]);
    await updateBook(db);
}

export const getReferencingParamsToInstance = async (db: BookDB, instanceUuid: string) => {
    return db.blockParameterInstances
        .filter(param => param.value === instanceUuid)
        .toArray()
}

export const BlockParameterInstanceRepository = {
    getInstanceParams,
    appendDefaultParam,
    appendDefaultParams,
    addParameterInstance,
    updateParameterInstance,
    deleteParameterInstance,
    removeAllForInstance,
    getReferencingParamsToInstance
}

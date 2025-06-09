import { BookDB } from "@/entities/bookDb";
import { IBlockInstanceRelation } from "@/entities/BookEntities";
import { BlockInstanceRepository } from "./BlockInstanceRepository";
import { updateBlockInstance } from "./BlockInstanceUpdateHelper";

export const getRelatedInstances = async (db: BookDB, blockInstanceUuid: string, relatedBlockUuid?: string) => {
    const [source, target] = await Promise.all([
        db.blockInstanceRelations
            .where('sourceInstanceUuid').equals(blockInstanceUuid)
            .filter(r => !relatedBlockUuid || r.targetBlockUuid === relatedBlockUuid)
            .toArray(),
        db.blockInstanceRelations
            .where('targetInstanceUuid').equals(blockInstanceUuid)
            .filter(r => !relatedBlockUuid || r.sourceBlockUuid === relatedBlockUuid)
            .toArray()
    ]);
    return [...source, ...target];
}

export const createRelation = async (
    db: BookDB,
    sourceInstanceUuid: string,
    targetInstanceUuid: string,
    sourceBlockUuid: string,
    targetBlockUuid: string,
    blockRelationUuid: string
) => {
    const relation: IBlockInstanceRelation = {
        sourceInstanceUuid,
        targetInstanceUuid,
        sourceBlockUuid,
        targetBlockUuid,
        blockRelationUuid
    };

    const [sourceInstance, targetInstance] = await Promise.all([
        BlockInstanceRepository.getByUuid(db, sourceInstanceUuid),
        BlockInstanceRepository.getByUuid(db, targetInstanceUuid)
    ]);

    await Promise.all([
        sourceInstance ? updateBlockInstance(db, sourceInstance) : Promise.resolve(),
        targetInstance ? updateBlockInstance(db, targetInstance) : Promise.resolve(),
        db.blockInstanceRelations.add(relation)
    ]);
}

export const removeRelation = async (db: BookDB, relation: IBlockInstanceRelation) => {
    if (!relation.id) return;

    await db.blockInstanceRelations.delete(relation.id);

    const [sourceInstance, targetInstance] = await Promise.all([
        BlockInstanceRepository.getByUuid(db, relation.sourceInstanceUuid),
        BlockInstanceRepository.getByUuid(db, relation.targetInstanceUuid)
    ]);

    await Promise.all([
        sourceInstance ? updateBlockInstance(db, sourceInstance) : Promise.resolve(),
        targetInstance ? updateBlockInstance(db, targetInstance) : Promise.resolve()
    ]);
}

export const removeAllForInstance = async (db: BookDB, instanceUuid: string) => {
    await Promise.all([
        db.blockInstanceRelations.where('sourceInstanceUuid').equals(instanceUuid).delete(),
        db.blockInstanceRelations.where('targetInstanceUuid').equals(instanceUuid).delete()
    ]);
}

export const BlockInstanceRelationRepository = {
    getRelatedInstances,
    createRelation,
    removeRelation,
    removeAllForInstance,
}

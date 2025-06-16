import {BlockAbstractDb} from "@/entities/BlockAbstractDb";
import {
    IBlock, // Needed for appendDefaultParamGroup
    IBlockParameter,
    IBlockParameterDataType,
    IBlockParameterPossibleValue
} from "@/entities/ConstructorEntities";
import {generateUUID} from "@/utils/UUIDUtils";
import { updateBook } from "@/utils/bookSyncUtils";

const getParameterGroups = async (db: BlockAbstractDb, blockUuid: string) => {
    return db.blockParameterGroups
        .where('blockUuid')
        .equals(blockUuid)
        .sortBy('orderNumber');
}

const getGroupByUuid = async (db: BlockAbstractDb, groupUuid: string) => {
    return db.blockParameterGroups.where('uuid').equals(groupUuid).first();
}

const getParamPossibleValues = async (db: BlockAbstractDb, parameterUuid: string) => {
    return db.blockParameterPossibleValues
        .where('parameterUuid')
        .equals(parameterUuid)
        .sortBy('orderNumber');
};

const getDisplayedParameters = async (db: BlockAbstractDb, blockUuid: string) => {
    return db.blockParameters
        .where('blockUuid')
        .equals(blockUuid)
        .and(param => param.displayInCard === 1)
        .toArray();
}

const getDefaultParameters = async (db: BlockAbstractDb, blockUuid: string) => {
    return db
        .blockParameters
        .where({
            blockUuid,
            isDefault: 1
        })
        .toArray()
}

const getParamsByGroup = async (db: BlockAbstractDb, groupUuid: string) => {
    return db.blockParameters
        .where('groupUuid')
        .equals(groupUuid)
        .toArray();
}

const deleteParameterGroup = async (db: BlockAbstractDb, blockUuid: string, groupUuid: string) => {

    // Удаляем все параметры, связанные с этой группой
    await db.blockParameters
        .where('groupUuid')
        .equals(groupUuid)
        .delete();

    // Удаляем группу
    await db.blockParameterGroups
        .where('uuid')
        .equals(groupUuid)
        .delete();

    // Обновляем порядковые номера для оставшихся групп
    const remainingGroups = await db.blockParameterGroups
        .where('blockUuid')
        .equals(blockUuid)
        .sortBy('orderNumber');

    await Promise.all(
        remainingGroups.map((group, index) =>
            db.blockParameterGroups.update(group.id!, {
                orderNumber: index
            })
        )
    );
    if (db instanceof BookDB) {
        await updateBook(db as BookDB);
    }
}

const updateParamPossibleValues = async (db: BlockAbstractDb, parameterUuid: string, possibleValues: string[]) => { // Changed type to string[]
                                                                                                                    // Удаляем старые значения
    await db.blockParameterPossibleValues
        .where('parameterUuid')
        .equals(parameterUuid)
        .delete();

    // Сохраняем новые значения
    await Promise.all(
        possibleValues.map((val, index) => // val is now a string
            db.blockParameterPossibleValues.add({
                uuid: generateUUID(),
                parameterUuid,
                value: val, // Use val here
                orderNumber: index,
            })
        )
    );
    if (db instanceof BookDB) {
        await updateBook(db as BookDB);
    }
}

const appendDefaultParamGroup = async (db: BlockAbstractDb, blockData: IBlock) => {
    await db.blockParameterGroups.add({
        blockUuid: blockData.uuid,
        uuid: generateUUID(),
        orderNumber: 0,
        description: '',
        title: 'Основное',
    })
    if (db instanceof BookDB) {
        await updateBook(db as BookDB);
    }
}

const getReferencingParametersFromBlock = async (db: BlockAbstractDb, blockUuid: string) => {
    return  db.blockParameters
        .filter(param => (
                (param.blockUuid === blockUuid)
                && (param.dataType === IBlockParameterDataType.blockLink)
            )
        )
        .toArray();
}

export const BlockParameterRepository = {
    getParameterGroups,
    getParamsByGroup,
    getGroupByUuid,
    getParamPossibleValues,
    getDisplayedParameters,
    getDefaultParameters,
    deleteParameterGroup,
    updateParamPossibleValues,
    appendDefaultParamGroup,
    getReferencingParametersFromBlock,
}

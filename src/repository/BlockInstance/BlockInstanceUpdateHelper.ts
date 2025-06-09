import { BookDB } from "@/entities/bookDb";
import { IBlockInstance } from "@/entities/BookEntities";

export const updateBlockInstance = async (db: BookDB, instance: IBlockInstance) => {
    if (instance.id === undefined) return;

    const updatedInstance = {
        ...instance,
        updatedAt: new Date().toISOString(),
    };
    await db.blockInstances.update(instance.id, updatedInstance);
}

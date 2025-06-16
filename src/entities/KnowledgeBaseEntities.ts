// Assuming these types are passed or defined if not imported from API file
import {IBlockInstance} from "@/entities/BookEntities";

export interface KnowledgeBaseEntity { // Assuming this is already defined or will be
    title: string;
    description: string;
    sceneDescription: string;
}

export interface KnowledgeBaseEntityDisplay extends KnowledgeBaseEntity {
    isExisting: boolean;
    isLinked?: boolean;
    instanceUuid?: string;
    instance?: IBlockInstance;
}


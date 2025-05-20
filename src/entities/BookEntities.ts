import {BlockRelationType, IBlock} from "@/entities/ConstructorEntities";

export interface IBook {
  id?: number;
  uuid: string;
  title: string;
  author: string;
  kind: string;
  configurationUuid: string;
  configurationTitle: string;
}

export interface IBlockInstance{
  id?: number;
  uuid?: string;
  blockUuid: string;
  title: string;
  parentInstanceUuid?: string;
}

export interface IBlockInstanceSceneLink{
  id?: number
  uuid?: string
  blockInstanceUuid: string
  blockUuid: string
  sceneId: number
}

export interface IBlockParameterInstance{
  id?: number;
  uuid?: string;
  blockInstanceUuid: string
  blockParameterUuid: string
  blockParameterGroupUuid: string;
  value: string | number;
}

export interface IScene{
  id?: number;
  title: string;
  body: string;
  order?: number;
  chapterId?: number;
  totalSymbolCountWithSpaces?: number;
  totalSymbolCountWoSpaces?: number;
}

export interface ISceneWithInstancesBlock{
  block: IBlock,
  instances: IBlockInstance[]
}
export interface ISceneWithInstances extends IScene{
  blockInstances: ISceneWithInstancesBlock[]
}


export interface IChapter {
  id?: number;
  title: string;
  order: number;
}

export interface IBlockInstanceRelation {
  id?: number;
  uuid?: string;
  sourceInstanceUuid: string;    // UUID исходного экземпляра блока
  targetInstanceUuid: string;    // UUID целевого экземпляра блока
  sourceBlockUuid: string;       // UUID исходного блока
  targetBlockUuid: string;       // UUID целевого блока
  blockRelationUuid: string;     // Ссылка на исходную связь между блоками
}

export interface INoteGroup{
  id?: number;
  uuid?: string;
  title: string;
  order?: number;
  parentUuid?: string;
}

export interface INote{
  id?: number;
  uuid?: string;
  title: string;
  tags: string;
  body: string;
  order?: number;
  noteGroupUuid?: string;
  updatedAt?: string;
}

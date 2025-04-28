import {IBlockParameter} from "@/entities/ConstructorEntities";
import {IBlockParameterInstance} from "@/entities/BookEntities";

export type FullParam = {
  parameter?: IBlockParameter;
  instance: IBlockParameterInstance;
};

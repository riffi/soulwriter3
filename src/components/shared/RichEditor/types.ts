export enum IWarningKind{
  CLICHE = "CLICHE",
  REPEAT = "REPEAT",
}

export enum IWarningKindTile{
  CLICHE = "Штампы",
  REPEAT = "Повторы",
}
export interface IWarning {
  from: number;
  to: number;
  text: string;
  kind: string;
}
export interface IClicheWarning extends IWarning{
  pattern: string;
}

export interface IRepeatWarning extends IWarning {
  groupIndex: string;
  active: boolean;
}

export interface IWarningContainer{
  warningKind: string;
  warnings: IWarning[];
}

export enum IWarningKind{
  CLICHE = "CLICHE",
  REPEAT = "REPEAT",
}

export enum IWarningKindTile{
  CLICHE = "Штампы",
  REPEAT = "Повторы",
}
export interface IWarning {
  id: string;
  from: number;
  to: number;
  text: string;
  kind: string;
  groupIndex: string;
  active: boolean;
}
export interface IClicheWarning extends IWarning{
  pattern: string;
}

export interface IRepeatWarning extends IWarning {

}

export interface IWarningGroup{
  groupIndex: string;
  warningKind: IWarningKind;
  warnings: IWarning[];
}
export interface IWarningContainer{
  warningKind: IWarningKind;
  warningGroups: IWarningGroup[];
}

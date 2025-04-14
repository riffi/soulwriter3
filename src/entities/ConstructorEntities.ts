export enum BlockParameterDataType {
  String = 'string',
  Text = 'text',
  Checkbox = 'checkbox',
  Dropdown = 'dropdown',
  BlockReference = 'block-reference',
  BlockParamReference = 'block-param-reference',
}

export interface IBookConfiguration{
  id?: number
  uuid?: string; // Автогенерация UUID
  title: string;
  description: string;
}

export interface IBookConfigurationVersion {
  id?: number;
  uuid?: string;
  configurationUuid: string; // Ссылка на основную конфигурацию
  versionNumber: number; // Номер версии
  isDraft: boolean; // Является ли черновиком
}

// Строительный блок
export interface IBlock {
  id?: number
  uuid?: string; // Автогенерация UUID
  title: string;
  configurationVersionUuid: string;
  description: string;
  useTabs: boolean; // Использовать вкладки
}

export interface IBlockParameterGroup{
  id?: number
  uuid?: string; // Автогенерация UUID
  title: string;
  blockUuid: string;
  description: string;
  orderNumber: number; // Порядковый номер
}

// Тип параметра строительного блока
export interface IBlockParameter {
  id?: number
  uuid?: string; // Автогенерация UUID
  title: string;
  groupUuid: string
  description: string;
  dataType: string// Вид данных
  linkedBlockUuid?: string; // Ссылка на другой строительный блок через UUID
  linkedParameterUuid?: string; // Ссылка на параметр строительного блока через UUID
  orderNumber: number; // Порядковый номер
}


// Возможные значения параметра для типа "выбор из списка"
export interface IBlockParameterPossibleValue {
  id?: number
  uuid?: number; // Автоматически генерируется
  parameterUuid: string; // Ссылка на IBlockParameterType.uuid
  value: string; // Значение
  orderNumber: number; // Порядковый номер
}

export enum IBlockParameterDataType {
  string = 'string',
  text = 'text',
  checkbox = 'checkbox',
  dropdown = 'dropdown',
  blockReference = 'block-reference',
  blockParamReference = 'block-param-reference',
}

export enum IBlockParameterDataTypeTitle{
  string = 'Строка',
  text = 'Текст',
  checkbox = 'Галочка',
  dropdown = 'Выпадающий список',
  blockReference = 'Ссылка на блок',
  blockParamReference = 'Ссылка на параметр блока',
}


export enum IBlockStructureKind{
  single = 'single',
  multiple = 'multiple',
  tree = 'tree',
}

export enum IBlockStructureKindTitle{
  single = 'Одиночный',
  multiple = 'Множественный',
  tree = 'Дерево',
}

enum IBlockKind{
  ConstructionBlock = 'construction-block',
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
  structureKind: string // Вид структуры
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

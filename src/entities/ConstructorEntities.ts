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

export enum IBlockDisplayKind{
  list = 'list',
  timeLine = 'timeLine'
}

export enum IBlockDisplayKindTitle{
  list = 'Список',
  timeLine = 'Временная линия'
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
  isDraft: number; // Является ли черновиком
}

export interface IBlockTitleForms{
  nominative : string;
  genitive: string;
  dative: string;
  accusative: string;
  instrumental: string;
  prepositional: string;
  plural: string;
}

// Строительный блок
export interface IBlock {
  id?: number
  uuid?: string; // Автогенерация UUID
  title: string;
  configurationVersionUuid: string;
  description: string;
  useTabs: number; // Использовать вкладки
  structureKind: string // Вид структуры
  displayKind: string // Вид отображения
  parentBlockUuid?: string; // Ссылка на родительский блок
  titleForms?: IBlockTitleForms
  sceneLinkAllowed: number; // Разрешено ли создавать связи со сценами
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
  groupUuid: string;
  blockUuid: string;
  description: string;
  dataType: string// Вид данных
  linkedBlockUuid?: string; // Ссылка на другой строительный блок через UUID
  linkedParameterUuid?: string; // Ссылка на параметр строительного блока через UUID
  isDefault?: number; // Добавлять параметр по умолчанию
  displayInCard: number; // Отображать ли параметр в карточке
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


export enum BlockRelationType {
  ONE_TO_ONE = 'one-to-one',
  ONE_TO_MANY = 'one-to-many',
  MANY_TO_ONE = 'many-to-one',
  MANY_TO_MANY = 'many-to-many',
}

export interface IBlockRelation {
  id?: number;
  uuid?: string;
  sourceBlockUuid: string;       // UUID исходного блока
  targetBlockUuid: string;       // UUID целевого блока
  relationType: BlockRelationType; // Тип связи
  configurationVersionUuid: string; // Версия конфигурации
}

export enum IBlockTabKind{
  parameters = 'parameters',
  relation = 'relation',
  childBlock = 'childBlock',
}
export interface IBlockTab{
  id?: number;
  uuid?: string; // Автоматически генерируется
  title: string; // Заголовок вкладки
  orderNumber: number; // Порядковый номер
  blockUuid: string; // Ссылка на строительный блок
  tabKind: string; // Вид вкладки
  relationUuid?: string; // Ссылка на связь
  childBlockUuid?: string; // Ссылка на дочерний блок
  isDefault: number; // Является ли вкладка по умолчанию
}


export interface IGlobalSettings{
  openRouterKey: string
  incLuminApiKey: string
  currentOpenRouterModel: string
}

export interface IOpenRouterModel{
  modelName: string
}

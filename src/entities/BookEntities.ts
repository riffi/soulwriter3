export interface IBook {
  id?: number;
  uuid: string;
  title: string;
  author: string;
  kind: string;
  configurationUuid: string;
  configurationVersionNumber?: number;
}


export interface IScene{
  id?: number;
  title: string;
  body: string;
  order?: number;
  chapterId?: number
}


export interface IChapter {
  id?: number;
  title: string;
  order: number;
}

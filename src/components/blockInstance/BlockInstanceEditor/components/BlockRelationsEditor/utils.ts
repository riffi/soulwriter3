import { IBlockInstance } from '@/entities/BookEntities';

export const mapInstancesToOptions = (instances?: IBlockInstance[]) =>
    instances?.map(({ uuid, title }) => ({ value: uuid, label: title })) || [];

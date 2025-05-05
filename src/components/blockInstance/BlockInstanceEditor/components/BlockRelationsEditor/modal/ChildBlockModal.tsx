import { Stack, Select, Button, Group } from '@mantine/core';
import { mapInstancesToOptions } from '../utils';
import {IBlock} from "@/entities/ConstructorEntities";
import {IBlockInstance} from "@/entities/BookEntities";

interface ChildBlockModalProps {
  relatedParentBlock?: IBlock;
  relatedParentInstances?: IBlockInstance[];
  relatedChildInstances?: IBlockInstance[];
  parentInstanceUuid: string;
  targetInstanceUuid: string;
  relatedBlock: IBlock;
  onParentChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export const ChildBlockModal = ({
                                  relatedParentBlock,
                                  relatedParentInstances,
                                  relatedChildInstances,
                                  parentInstanceUuid,
                                  targetInstanceUuid,
                                  relatedBlock,
                                  onParentChange,
                                  onTargetChange,
                                  onCreate,
                                  isLoading
                                }: ChildBlockModalProps) => (
    <Stack>
      <Select
          label={`${relatedParentBlock?.title}`}
          placeholder={`Выберите ${relatedParentBlock?.titleForms?.accusative}`}
          value={parentInstanceUuid}
          data={mapInstancesToOptions(relatedParentInstances)}
          onChange={(v) => onParentChange(v || '')}
          searchable
          clearable
      />

      {parentInstanceUuid && (
          <Select
              label={`${relatedBlock.title}`}
              placeholder={relatedChildInstances?.length ? `Выберите ${relatedBlock.titleForms?.accusative}` : "Нет доступных"}
              value={targetInstanceUuid}
              data={mapInstancesToOptions(relatedChildInstances)}
              onChange={(v) => onTargetChange(v || '')}
              disabled={!relatedChildInstances?.length}
              description={!relatedChildInstances?.length && "Нет дочерних элементов"}
              searchable
          />
      )}

      <Group justify="flex-end" mt="md">
        <Button
            onClick={onCreate}
            disabled={!targetInstanceUuid}
            loading={isLoading}
        >
          Создать связь
        </Button>
      </Group>
    </Stack>
);

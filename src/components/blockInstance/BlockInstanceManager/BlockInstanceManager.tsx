import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookDb } from "@/entities/bookDb";
import { IBlockInstance } from "@/entities/BookEntities";
import {
  Button,
  Table,
  Text,
  Group,
  Box,
  Modal,
  TextInput, Container, Title, Space,
  MultiSelect, ActionIcon
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
  IconX, IconFilterOff
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { generateUUID } from "@/utils/UUIDUtils";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import classes from "./BlockInstanceManager.module.css";
import {
  useBlockInstanceManager
} from "@/components/blockInstance/BlockInstanceManager/useBlockInstanceManager";
import {
  BlockInstanceTableRow
} from "@/components/blockInstance/BlockInstanceManager/parts/BlockInstanceTableRow";
import {
  BlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/BlockInstanceEditor";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {IconViewer} from "@/components/shared/IconViewer/IconViewer";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {IBlockStructureKind} from "@/entities/ConstructorEntities";

export interface IBlockInstanceManagerProps {
  blockUuid: string;
}

export const BlockInstanceManager = (props: IBlockInstanceManagerProps) => {
  const {
    instances,
    block,
    addBlockInstance,
    instancesWithParams,
    displayedParameters,
    deleteBlockInstance
  } = useBlockInstanceManager(props.blockUuid);

  const [addingInstance, setAddingInstance] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newShortDescription, setNewShortDescription] = useState('');

  const [filtersVisible, { toggle: toggleFilters }] = useDisclosure(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const {isMobile} = useMedia();

  const navigate = useNavigate();
  const { showDialog } = useDialog();
  const { setPageTitle, setTitleElement } = usePageTitle();

  const header =( <Group>
    <IconViewer
        iconName={block?.icon}
        size={isMobile? 20 : 28}
        style={{
          color: 'white',
          boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
          backgroundColor: "var(--mantine-color-blue-5)"
        }}
    />
    <Title
        order={isMobile? 4 : 2}
        style={{
          textTransform: "capitalize",
          color: "var(--mantine-color-blue-5)"
        }}
    >
      {block?.structureKind === IBlockStructureKind.multiple ? block?.titleForms?.plural : block?.title}
    </Title>
  </Group>)

  useEffect(() =>{
    if (block) {
      setTitleElement(header);
    }
  }, [block])

  const handleAddClick = () => {
    setNewInstanceName(`${block?.title}`);
    setNewShortDescription('');
    open();
  };

  const handleCreateInstance = async () => {
    if (!bookDb || !newInstanceName.trim()) return;

    setAddingInstance(true);
    try {
      const uuid = generateUUID();
      const newInstance: IBlockInstance = {
        blockUuid: props.blockUuid,
        uuid,
        title: newInstanceName.trim(),
        shortDescription: newShortDescription.trim() ? newShortDescription.trim() : undefined,
      };
      await addBlockInstance(newInstance);
      setNewShortDescription('');
      close();
      navigate(`/block-instance/card?uuid=${uuid}`);
    } finally {
      setAddingInstance(false);
    }
  };

  const handleEditInstance = (uuid: string) => {
    navigate(`/block-instance/card?uuid=${uuid}`);
  };

  const handleDeleteInstance = async (data: IBlockInstance) => {
    const result = await showDialog("Вы уверены?", `Удалить ${data.title}?`);
    if (result && bookDb) {
      await deleteBlockInstance(data);
    }
  };


// Функция для сбора уникальных значений параметров
  const getUniqueParamValues = (paramUuid: string) => {
    if (!instancesWithParams) return [];
    const values = new Set<string>();

    instancesWithParams.forEach(instance => {
      instance.params.forEach(param => {
        if (param.blockParameterUuid === paramUuid) {
          const displayValue = param.value?.replace(/<[^>]*>/g, '') || '—';
          values.add(displayValue);
        }
      });
    });

    return Array.from(values).map(value => ({
      value,
      label: value
    }));
  };

// Функция фильтрации данных
  const filteredInstances = instancesWithParams?.filter(instance => {
    return Object.entries(filters).every(([paramUuid, values]) => {
      if (values.length === 0) return true;
      const param = instance.params.find(p => p.blockParameterUuid === paramUuid);
      const displayValue = param?.value?.replace(/<[^>]*>/g, '') || '—';
      return values.includes(displayValue);
    });
  }) || [];

// Обработчики фильтров
  const handleFilterChange = (paramUuid: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [paramUuid]: values
    }));
  };



  const clearFilters = () => {
    setFilters({});
  };
  if (block?.structureKind === 'single') {
    if (!instances || instances.length === 0) {
      return
    }
    return (
        <>
          <BlockInstanceEditor blockInstanceUuid={instances?.[0].uuid}/>
        </>)
  }
  return (
      <Container size="xl" p="0" >
      <Box className={classes.container} pos="relative">
        <Box visibleFrom={"sm"}>
          {header}
        </Box>
        <Space h="md"/>

        <Group justify="space-between" mb="md">
          <Button
              onClick={handleAddClick}
              leftSection={<IconPlus size="1rem" />}
              size="sm"
              variant="light"
              className={classes.addButton}
          >
            Добавить
          </Button>

          {displayedParameters?.length > 0 && <Group>
            <ActionIcon
                onClick={toggleFilters}
                variant={filtersVisible? "filled" : "default"}
            >
              <IconFilter size="1rem" />
            </ActionIcon>
            {Object.keys(filters).length > 0 && <ActionIcon
                onClick={clearFilters}
                variant={"default"}
            >
              <IconFilterOff size="1rem" />
            </ActionIcon>}
          </Group>
        }
        </Group>

        {filtersVisible && displayedParameters && (
            <div className={classes.filtersContainer}>
              <Group gap="xs" mb="md">
                {displayedParameters.map(param => (
                    <MultiSelect
                        key={param.uuid}
                        label={param.title}
                        placeholder={filters[param.uuid!]?.length > 0 ? '' : param.title}
                        data={getUniqueParamValues(param.uuid!)}
                        value={filters[param.uuid!] || []}
                        onChange={(values) => handleFilterChange(param.uuid!, values)}
                        clearable
                        className={classes.filterInput}
                    />
                ))}
              </Group>
            </div>
        )}
        <Table highlightOnHover className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <>
          {filteredInstances?.length > 0 ? (
              <Table.Tbody>
                {filteredInstances?.map((instance) => (
                    <BlockInstanceTableRow
                        key={instance.uuid}
                        instance={instance}
                        displayedParameters={displayedParameters}
                        onEdit={handleEditInstance}
                        onDelete={handleDeleteInstance}
                    />
                ))}
              </Table.Tbody>
          ) : (
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td colSpan={2}>
                    <Text c="dimmed" ta="center" py="md" size="sm">
                      Добавьте {block?.titleForms?.accusative}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
          )}
          </>
        </Table>

        <Modal
            opened={opened}
            onClose={close}
            fullScreen={isMobile}
            title={"Создание " + block?.titleForms?.genitive}
            centered
        >
          <TextInput
              label="Название"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.currentTarget.value)}
              placeholder="Введите название"
              mb="md"
          />
          <TextInput
              label="Краткое описание"
              value={newShortDescription}
              onChange={(e) => setNewShortDescription(e.currentTarget.value)}
              placeholder="Введите краткое описание (необязательно)"
              mb="md"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
                onClick={handleCreateInstance}
                loading={addingInstance}
                disabled={!newInstanceName.trim()}
            >
              Создать
            </Button>
          </Group>
        </Modal>
      </Box>
      </Container>
  );
};

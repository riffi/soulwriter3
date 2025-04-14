// BlockEditForm.tsx
import {
  Anchor,
  Breadcrumbs,
  Checkbox,
  Container, Space,
  Tabs, Button, Group, Modal, TextInput, ActionIcon
} from "@mantine/core";
import { useBlockEditForm } from "@/components/configurator/BlockEditForm/useBlockEditForm";
import React, {useEffect, useState} from "react";
import { IBlockParameter } from "@/entities/ConstructorEntities";
import { notifications } from "@mantine/notifications";
import { ParamEditModal } from "@/components/configurator/BlockEditForm/ParamEditModal/ParamEditModal";
import { ParamTable } from "./ParamTable/ParamTable";
import { IconPlus, IconArrowUp, IconArrowDown, IconEdit } from "@tabler/icons-react";

interface IBlockEditFormProps {
  blockUuid: string;
}

export const BlockEditForm = (props: IBlockEditFormProps) => {
  const [currentGroupUuid, setCurrentGroupUuid] = useState<string>();
  const [currentParam, setCurrentParam] = useState<IBlockParameter>();
  const [isParamModalOpened, setIsParamModalOpened] = useState<boolean>(false);
  const [isGroupsModalOpened, setIsGroupsModalOpened] = useState<boolean>(false);
  const [newGroupTitle, setNewGroupTitle] = useState<string>('');
  const {
    saveParamGroup,
    paramGroupList,
    block,
    saveBlock,
    configuration,
    paramList,
    saveParam,
    moveGroupUp,
    moveGroupDown,
  } = useBlockEditForm(props.blockUuid, currentGroupUuid);

  useEffect(() => {
    if (paramGroupList && paramGroupList.length > 0 && !currentGroupUuid) {
      setCurrentGroupUuid(paramGroupList[0].uuid);
    }
  }, [paramGroupList]);

  const getInitialData = (): IBlockParameter => {
    return {
      uuid: "",
      title: "",
      description: "",
      groupUuid: currentGroupUuid,
      dataType: "string",
      orderNumber: paramList?.length,
    };
  };

  const breadCrumbs = [
    { title: "Конфигуратор", href: "/configurator" },
    {
      title: configuration?.title,
      href: "/configuration/edit?uuid=" + configuration?.uuid,
    },
    { title: block?.title, href: "#" },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

  const handleAddParam = () => {
    setIsParamModalOpened(true);
    setCurrentParam(getInitialData());
  };

  const handleEditParam = (param: IBlockParameter) => {
    setCurrentParam({ ...param });
    setIsParamModalOpened(true);
  };

  const handleSaveGroup = () => {
    if (!newGroupTitle.trim()) {
      notifications.show({
        title: "Ошибка",
        message: "Название вкладки не может быть пустым",
        color: "red",
      });
      return;
    }

    saveParamGroup({
      uuid: "",
      blockUuid: props.blockUuid,
      title: newGroupTitle,
      description: "",
      orderNumber: paramGroupList?.length || 0,
    });

    setNewGroupTitle('');
  };

  return (
      <>
        <Container fluid>
          <h1>Блок: {block?.title}</h1>
          <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
            {breadCrumbs}
          </Breadcrumbs>
          <Space h="md" />
          <Checkbox
              checked={block?.useTabs}
              label="Использовать вкладки"
              onChange={(e) => {
                saveBlock({ ...block, useTabs: e.currentTarget.checked });
              }}
          />
          {block?.useTabs ? (
              <>
                <Group position="right" mt="md">
                  <Button
                      onClick={() => setIsGroupsModalOpened(true)}
                      leftSection={<IconEdit size="1rem" />}
                      size="xs"
                      variant="light"
                      compact
                  >
                    Изменить вкладки
                  </Button>
                </Group>
                <Tabs
                    value={currentGroupUuid}
                    onChange={(value) => {
                      setCurrentGroupUuid(value || paramGroupList?.[0]?.uuid);
                    }}
                >
                  <Tabs.List>
                    {paramGroupList?.map((p) => (
                        <Tabs.Tab value={p.uuid} key={p.uuid}>
                          {p.title}
                        </Tabs.Tab>
                    ))}
                  </Tabs.List>
                  {paramGroupList?.map((p) => (
                      <Tabs.Panel value={p.uuid} key={p.uuid}>
                        <ParamTable
                            params={paramList?.filter((param) => param.groupUuid === p.uuid) || []}
                            currentGroupUuid={p.uuid}
                            onAddParam={handleAddParam}
                            onEditParam={handleEditParam}
                        />
                      </Tabs.Panel>
                  ))}
                </Tabs>
              </>
          )  : (
              <ParamTable
                  params={paramList || []}
                  onAddParam={handleAddParam}
                  onEditParam={handleEditParam}
              />
          )}
        </Container>
        {isParamModalOpened && (
            <ParamEditModal
                isOpen={isParamModalOpened}
                onClose={() => setIsParamModalOpened(false)}
                onSave={(c) => {
                  notifications.show({
                    title: "Параметр",
                    message: `Параметр "${c.title}" сохранён`,
                  });
                  saveParam(c);
                }}
                initialData={currentParam}
            />
        )}
        <Modal
            opened={isGroupsModalOpened}
            onClose={() => setIsGroupsModalOpened(false)}
            title="Управление вкладками"
            size="lg"
        >
          <Group mb="md">
            <TextInput
                label="Название новой вкладки"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.currentTarget.value)}
                placeholder="Введите название"
                required
            />
            <Button
                onClick={handleSaveGroup}
                leftSection={<IconPlus size="1rem" />}
                mt={25}
            >
              Добавить вкладку
            </Button>
          </Group>

          {paramGroupList?.map((group, index) => (
              <Group key={group.uuid} mb="xs" grow>
                <TextInput value={group.title} readOnly />
                <Group gap={5}>
                  <ActionIcon
                      variant="light"
                      onClick={() => moveGroupUp(group.uuid)}
                      disabled={index === 0}
                  >
                    <IconArrowUp size="1rem" />
                  </ActionIcon>
                  <ActionIcon
                      variant="light"
                      onClick={() => moveGroupDown(group.uuid)}
                      disabled={index === paramGroupList.length - 1}
                  >
                    <IconArrowDown size="1rem" />
                  </ActionIcon>
                </Group>
              </Group>
          ))}
        </Modal>
      </>
  );
};

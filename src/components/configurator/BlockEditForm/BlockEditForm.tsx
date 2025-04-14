// BlockEditForm.tsx
import {
  Anchor,
  Breadcrumbs,
  Checkbox,
  Container,
  Space,
  Tabs,
  Button,
  Group,
} from "@mantine/core";
import { useBlockEditForm } from "@/components/configurator/BlockEditForm/useBlockEditForm";
import React, { useEffect, useState } from "react";
import { IBlockParameter } from "@/entities/ConstructorEntities";
import { notifications } from "@mantine/notifications";
import { ParamEditModal } from "@/components/configurator/BlockEditForm/ParamEditModal/ParamEditModal";
import { ParamTable } from "./ParamTable/ParamTable";
import { IconEdit } from "@tabler/icons-react";
import {GroupsModal} from "@/components/configurator/BlockEditForm/GroupsModal/GroupsModal";

interface IBlockEditFormProps {
  blockUuid: string;
}

interface IFormState {
  currentGroupUuid?: string;
  currentParam?: IBlockParameter;
  isParamModalOpened: boolean;
  isGroupsModalOpened: boolean;
}

const INITIAL_FORM_STATE: IFormState = {
  currentGroupUuid: undefined,
  currentParam: undefined,
  isParamModalOpened: false,
  isGroupsModalOpened: false,
};

export const BlockEditForm = ({ blockUuid }: IBlockEditFormProps) => {
  const [state, setState] = useState<IFormState>(INITIAL_FORM_STATE);
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
    deleteGroup
  } = useBlockEditForm(blockUuid, state.currentGroupUuid);

  useEffect(() => {
    if (paramGroupList?.length > 0 && !state.currentGroupUuid) {
      setState(prev => ({ ...prev, currentGroupUuid: paramGroupList[0].uuid }));
    }
  }, [paramGroupList, state.currentGroupUuid]);

  const getInitialParamData = (): IBlockParameter => ({
    uuid: "",
    title: "",
    description: "",
    groupUuid: state.currentGroupUuid,
    dataType: "string",
    orderNumber: paramList?.length || 0,
  });

  const breadCrumbs = [
    { title: "Конфигуратор", href: "/configurator" },
    {
      title: configuration?.title,
      href: `/configuration/edit?uuid=${configuration?.uuid}`,
    },
    { title: block?.title, href: "#" },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

  const handleParamModalOpen = (param?: IBlockParameter) => {
    setState(prev => ({
      ...prev,
      currentParam: param || getInitialParamData(),
      isParamModalOpened: true,
    }));
  };

  const handleSaveGroup = (newTitle: string) => {

    saveParamGroup({
      uuid: "",
      blockUuid,
      title: newTitle,
      description: "",
      orderNumber: paramGroupList?.length || 0,
    });

  };

  const renderTabsContent = () => (
      <>
        <Group position="right" mt="md">
          <Button
              onClick={() => setState(prev => ({ ...prev, isGroupsModalOpened: true }))}
              leftSection={<IconEdit size="1rem" />}
              size="xs"
              variant="light"
              compact
          >
            Изменить вкладки
          </Button>
        </Group>
        <Tabs
            value={state.currentGroupUuid}
            onChange={(value) => setState(prev => ({
              ...prev,
              currentGroupUuid: value || paramGroupList?.[0]?.uuid
            }))}
        >
          <Tabs.List>
            {paramGroupList?.map((group) => (
                <Tabs.Tab value={group.uuid} key={group.uuid}>
                  {group.title}
                </Tabs.Tab>
            ))}
          </Tabs.List>
          {paramGroupList?.map((group) => (
              <Tabs.Panel value={group.uuid} key={group.uuid}>
                <ParamTable
                    params={paramList?.filter((param) => param.groupUuid === group.uuid) || []}
                    onAddParam={() => handleParamModalOpen(getInitialParamData())}
                    onEditParam={handleParamModalOpen}
                />
              </Tabs.Panel>
          ))}
        </Tabs>
      </>
  );

  return (
      <Container fluid>
        <h1>Блок: {block?.title}</h1>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {breadCrumbs}
        </Breadcrumbs>

        <Space h="md" />

        <Checkbox
            checked={block?.useTabs}
            label="Использовать вкладки"
            onChange={(e) => saveBlock({ ...block, useTabs: e.currentTarget.checked })}
        />

        {block?.useTabs ? renderTabsContent() : (
            <ParamTable
                params={paramList || []}
                onAddParam={() => handleParamModalOpen(getInitialParamData())}
                onEditParam={handleParamModalOpen}
            />
        )}

        <ParamEditModal
            isOpen={state.isParamModalOpened}
            onClose={() => setState(prev => ({ ...prev, isParamModalOpened: false }))}
            onSave={(param) => {
              notifications.show({
                title: "Параметр",
                message: `Параметр "${param.title}" сохранён`,
              });
              saveParam(param);
            }}
            initialData={state.currentParam}
        />

        <GroupsModal
            opened={state.isGroupsModalOpened}
            onClose={() => setState(prev => ({ ...prev, isGroupsModalOpened: false }))}
            paramGroupList={paramGroupList || []}
            onSaveGroup={handleSaveGroup}
            onMoveGroupUp={moveGroupUp}
            onMoveGroupDown={moveGroupDown}
            onDeleteGroup={deleteGroup}
        />
      </Container>
  );
};

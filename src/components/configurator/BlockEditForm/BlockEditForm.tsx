// BlockEditForm.tsx
import {
  Anchor,
  Breadcrumbs,
  Checkbox,
  Container,
  Space,
  Tabs,
  Button,
  Group, SegmentedControl, ActionIcon
} from "@mantine/core";
import { useBlockEditForm } from "@/components/configurator/BlockEditForm/useBlockEditForm";
import React, { useEffect, useState } from "react";
import {
  IBlockParameter,
  IBlockStructureKind,
  IBlockStructureKindTitle
} from "@/entities/ConstructorEntities";
import { notifications } from "@mantine/notifications";
import { ParamEditModal } from "@/components/configurator/BlockEditForm/ParamEditModal/ParamEditModal";
import { ParamTable } from "./ParamTable/ParamTable";
import {IconEdit, IconSettings} from "@tabler/icons-react";
import {GroupsModal} from "@/components/configurator/BlockEditForm/GroupsModal/GroupsModal";
import classes from "./BlockEditForm.module.css";

interface IBlockEditFormProps {
  blockUuid: string;
  bookUuid?: string;
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

export const BlockEditForm = ({ blockUuid, bookUuid }: IBlockEditFormProps) => {
  const [state, setState] = useState<IFormState>(INITIAL_FORM_STATE);
  const {
    saveParamGroup,
    paramGroupList,
    block,
    saveBlock,
    configuration,
    paramList,
    saveParam,
    deleteParam,
    moveGroupUp,
    moveGroupDown,
    updateGroupTitle,
    deleteGroup
  } = useBlockEditForm(blockUuid, bookUuid, state.currentGroupUuid);

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

  const structureKindOptions = [
    { value: IBlockStructureKind.single, label: IBlockStructureKindTitle.single },
    { value: IBlockStructureKind.multiple, label: IBlockStructureKindTitle.multiple },
    { value: IBlockStructureKind.tree, label: IBlockStructureKindTitle.tree },
  ];

  const renderTabsContent = () => (
      <>
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
            <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setState(prev => ({ ...prev, isGroupsModalOpened: true }))}
                ml="auto"
                mr="sm"
            >
              <IconSettings size="1rem" />
            </ActionIcon>
          </Tabs.List>
          {paramGroupList?.map((group) => (
              <Tabs.Panel value={group.uuid} key={group.uuid}>
                <ParamTable
                    params={paramList?.filter((param) => param.groupUuid === group.uuid) || []}
                    onAddParam={() => handleParamModalOpen(getInitialParamData())}
                    onEditParam={handleParamModalOpen}
                    onDeleteParam={deleteParam}
                />
              </Tabs.Panel>
          ))}
        </Tabs>
      </>
  );

  return (
      <Container size="lg" py="md" className={classes.container}>
        <h1>Блок: {block?.title}</h1>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {breadCrumbs}
        </Breadcrumbs>

        <Space h="md" />

        <Group align="flex-end" spacing="xl" mb="md">
          <Group>
            <SegmentedControl
                value={block?.structureKind || IBlockStructureKind.single}
                onChange={(value) => saveBlock({ ...block, structureKind: value })}
                data={structureKindOptions}
                size="sm"
                radius="xl"
            />
          </Group>


        </Group>
        <Checkbox
            checked={block?.useTabs}
            label="Использовать вкладки для группировки параметров"
            onChange={(e) => saveBlock({ ...block, useTabs: e.currentTarget.checked })}
            mt="md"
            mb="xl"
        />
        <Space h="md" />
        {block?.useTabs ? renderTabsContent() : (
            <ParamTable
                params={paramList || []}
                onAddParam={() => handleParamModalOpen(getInitialParamData())}
                onEditParam={handleParamModalOpen}
                onDeleteParam={deleteParam}
            />
        )}

        {state.isParamModalOpened && <ParamEditModal
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
            blockUuid={blockUuid}
            bookUuid={bookUuid}
        />}

        <GroupsModal
            opened={state.isGroupsModalOpened}
            onClose={() => setState(prev => ({ ...prev, isGroupsModalOpened: false }))}
            paramGroupList={paramGroupList || []}
            onSaveGroup={handleSaveGroup}
            onMoveGroupUp={moveGroupUp}
            onMoveGroupDown={moveGroupDown}
            onDeleteGroup={deleteGroup}
            onUpdateGroupTitle={updateGroupTitle} // Добавить новый проп
        />
      </Container>
  );
};

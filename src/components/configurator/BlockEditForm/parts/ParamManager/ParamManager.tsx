// components/configurator/BlockEditForm/parts/ParamManager/ParamManager.tsx
import { Tabs, ActionIcon } from "@mantine/core";
import React, { useState, useEffect } from "react";
import { ParamTable } from "@/components/configurator/BlockEditForm/parts/ParamManager/ParamTable/ParamTable";
import { GroupsModal } from "@/components/configurator/BlockEditForm/parts/ParamManager/modal/GroupsModal/GroupsModal";
import { ParamEditModal } from "@/components/configurator/BlockEditForm/parts/ParamManager/modal/ParamEditModal/ParamEditModal";
import { useBlockEditForm } from "@/components/configurator/BlockEditForm/useBlockEditForm";
import {IBlock, IBlockParameter, IBlockRelation} from "@/entities/ConstructorEntities";
import { notifications } from "@mantine/notifications";
import {IconSettings} from "@tabler/icons-react";

interface ParamManagerProps {
  blockUuid: string;
  bookUuid?: string;
  useTabs?: number;
  otherBlocks: IBlock[]
}

export const ParamManager = ({
                               blockUuid,
                               bookUuid,
                               useTabs,
                               otherBlocks
                             }: ParamManagerProps) => {
  const [currentGroupUuid, setCurrentGroupUuid] = useState<string>();
  const [isParamModalOpened, setIsParamModalOpened] = useState(false);
  const [isGroupsModalOpened, setIsGroupsModalOpened] = useState(false);
  const [currentParam, setCurrentParam] = useState<IBlockParameter>();

  const {
    paramGroupList,
    paramList,
    saveParamGroup,
    saveParam,
    deleteParam,
    moveGroupUp,
    moveGroupDown,
    updateGroupTitle,
    deleteGroup,
  } = useBlockEditForm(blockUuid, bookUuid, currentGroupUuid);

  useEffect(() => {
    if (paramGroupList?.length > 0 && !currentGroupUuid) {
      setCurrentGroupUuid(paramGroupList?.[0].uuid);
    }
  }, [paramGroupList, currentGroupUuid]);

  const getInitialParamData = (): IBlockParameter => ({
    uuid: "",
    title: "",
    description: "",
    groupUuid: currentGroupUuid,
    dataType: "string",
    orderNumber: paramList?.length || 0,
  });

  const handleParamModalOpen = (param?: IBlockParameter) => {
    setCurrentParam(param || getInitialParamData());
    setIsParamModalOpened(true);
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
      <Tabs
          value={currentGroupUuid}
          onChange={(value) => setCurrentGroupUuid(value || paramGroupList?.[0]?.uuid)}
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
              onClick={() => setIsGroupsModalOpened(true)}
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
                  otherBlocks={otherBlocks}
                  onAddParam={() => handleParamModalOpen(getInitialParamData())}
                  onEditParam={handleParamModalOpen}
                  onDeleteParam={deleteParam}
              />
            </Tabs.Panel>
        ))}
      </Tabs>
  );

  return (
      <>
        {useTabs === 1 ? (
            renderTabsContent()
        ) : (
            <ParamTable
                params={paramList || []}
                onAddParam={() => handleParamModalOpen(getInitialParamData())}
                onEditParam={handleParamModalOpen}
                onDeleteParam={deleteParam}
                otherBlocks={otherBlocks}
            />
        )}

        {isParamModalOpened && <ParamEditModal
            isOpen={isParamModalOpened}
            onClose={() => setIsParamModalOpened(false)}
            onSave={(param) => {
              notifications.show({
                title: "Параметр",
                message: `Параметр "${param.title}" сохранён`,
              });
              saveParam(param);
              setIsParamModalOpened(false);
            }}
            initialData={currentParam}
            blockUuid={blockUuid}
            bookUuid={bookUuid}
            otherBlocks={otherBlocks}
          />
        }

        <GroupsModal
            opened={isGroupsModalOpened}
            onClose={() => setIsGroupsModalOpened(false)}
            paramGroupList={paramGroupList || []}
            onSaveGroup={handleSaveGroup}
            onMoveGroupUp={moveGroupUp}
            onMoveGroupDown={moveGroupDown}
            onDeleteGroup={deleteGroup}
            onUpdateGroupTitle={updateGroupTitle}
        />
      </>
  );
};

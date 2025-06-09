// BlockEditForm.tsx
import {
  Anchor,
  Breadcrumbs,
  Container,
  Space,
  Group, SegmentedControl, ScrollArea
} from "@mantine/core";
import { useBlockEditForm } from "@/components/configurator/BlockEditForm/useBlockEditForm";
import React, {useState, useEffect} from "react";
import classes from "./BlockEditForm.module.css";
import {RelationManager} from "@/components/configurator/BlockEditForm/parts/RelationManager/RelationManager";
import {ChildBlocksManager} from "@/components/configurator/BlockEditForm/parts/ChildBlocksManager/ChildBlocksManager";
import {
  BlockTabsManager
} from "@/components/configurator/BlockEditForm/parts/BlockTabsManager/BlockTabsManager";
import {
  MainTabContent
} from "@/components/configurator/BlockEditForm/parts/MainTabContent/MainTabContent";
import {
  ParamManager
} from "@/components/configurator/BlockEditForm/parts/ParamManager/ParamManager";

interface IBlockEditFormProps {
  blockUuid: string;
  bookUuid?: string;
}

export const BlockEditForm = ({ blockUuid, bookUuid }: IBlockEditFormProps) => {
  const [activeTab, setActiveTab] = useState<'main' | 'parameters' | 'relations' | 'children' | 'tabs'>('main');

  const {
    saveBlock,
    configuration,
    block,
    otherBlocks,
    paramList,
    paramGroupList,
    blockRelations,
  } = useBlockEditForm(blockUuid, bookUuid);


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

  if (!block) {
    return <Container><p>Загрузка данных блока...</p></Container>;
  }

  return (
      <Container size="lg" py="md" className={classes.container}>
        <h1>Блок: {block.title}</h1>
        <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
          {breadCrumbs}
        </Breadcrumbs>

        <Space h="md" />

        <Group mb="md" pos="relative" style={{ overflow: 'visible' }}>
          <ScrollArea
              type="hover"
              offsetScrollbars
              styles={{
                viewport: { scrollBehavior: 'smooth' },
                root: { flex: 1 }
              }}
          >
            <SegmentedControl
                value={activeTab}
                onChange={(value) => setActiveTab(value)}
                data={[
                  { value: 'main', label: 'Основное' },
                  { value: 'parameters', label: 'Параметры' },
                  { value: 'relations', label: 'Связи' },
                  { value: 'children', label: 'Дочерние' },
                  { value: 'tabs', label: 'Вкладки' },
                ]}
                styles={{
                  root: {
                    minWidth: 380,
                  },
                }}
            />
          </ScrollArea>
        </Group>

        {activeTab === 'main' && (
            <MainTabContent
                block={block}
                onSave={saveBlock}
            />
        )}

        {activeTab === 'parameters' && (
            <ParamManager
                blockUuid={blockUuid}
                bookUuid={bookUuid}
                useTabs={block?.useTabs}
                paramList={paramList}
                paramGroupList={paramGroupList}
                otherBlocks={[...otherBlocks, block]}
            />
        )}

        {activeTab === 'relations' && (
            <RelationManager
                otherBlocks={otherBlocks || []}
                block={block}
                bookUuid={bookUuid}
            />
        )}

        {activeTab === 'children' && (
            <ChildBlocksManager
                otherBlocks={otherBlocks || []}
                blockUuid={blockUuid}
                bookUuid={bookUuid}
            />
        )}

        {activeTab === 'tabs' && (
            <BlockTabsManager
                otherRelations={blockRelations || []}
                currentBlockUuid={blockUuid}
                otherBlocks={otherBlocks}
                bookUuid={bookUuid}
            />
        )}
      </Container>
  );
};

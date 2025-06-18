import {Button, Group, Space, Table, Text, ActionIcon, Box, Badge, Menu} from "@mantine/core";
import {
    IBlock,
    IBlockParameter, IBlockParameterDataType,
    IBlockParameterDataTypeTitle,
    IBlockRelation,
    IBlockParameterGroup
} from "@/entities/ConstructorEntities";
import { IconEdit, IconPlus, IconTrash, IconArrowsRightLeft, IconArrowUp, IconArrowDown, IconQuestionMark } from "@tabler/icons-react";
import React, {useState, useEffect} from "react";
import { useDialog } from "@/providers/DialogProvider/DialogProvider";
import {KnowledgeBasePageEditor} from "@/components/knowledgeBase/KnowledgeBasePageEditor";
import {bookDb} from "@/entities/bookDb";
import {configDatabase} from "@/entities/configuratorDb";
import {IKnowledgeBasePage} from "@/entities/KnowledgeBaseEntities";
import classes from "./ParamTable.module.css"; // Создайте этот CSS модуль для кастомизации

interface IParamTableProps {
    params: IBlockParameter[];
    currentGroupUuid?: string;
    onAddParam: () => void;
    onEditParam: (param: IBlockParameter) => void;
    onDeleteParam: (paramId: number) => void;
    onMoveParamUp?: (paramId: number) => void;
    onMoveParamDown?: (paramId: number) => void;
    otherBlocks: IBlock[];
    paramGroupList?: IBlockParameterGroup[];
    onMoveParam?: (paramUuid: string, targetGroupUuid: string) => void;
    showMoveButton?: boolean;
    bookUuid?: string;
    blockUuid: string;
}

export const ParamTable = ({
                               params,
                               currentGroupUuid,
                               onAddParam,
                               onEditParam,
                               onDeleteParam,
                               onMoveParamUp,
                               onMoveParamDown,
                               otherBlocks,
                               paramGroupList,
                               onMoveParam,
                               showMoveButton,
                               bookUuid,
                               blockUuid
                           }: IParamTableProps) => {
    const { showDialog } = useDialog();
    const [kbParam, setKbParam] = useState<IBlockParameter | null>(null);
    const [editorOpened, setEditorOpened] = useState(false);
    const [configurationUuid, setConfigurationUuid] = useState<string>();

    useEffect(() => {
        const db = bookUuid ? bookDb : configDatabase;
        db.blocks.where('uuid').equals(blockUuid).first().then(b => {
            setConfigurationUuid(b?.configurationUuid);
        });
    }, [bookUuid, blockUuid]);

    const handleSavePage = async (page: IKnowledgeBasePage) => {
        const db = bookUuid ? bookDb : configDatabase;
        if (kbParam?.id) {
            await db.blockParameters.update(kbParam.id, { knowledgeBasePageUuid: page.uuid });
        }
    };

    return (
        <Box className={classes.container}>
            <Button
                onClick={onAddParam}
                leftSection={<IconPlus size="1rem" />}
                size="sm"
                variant="light"
                mb="md"
                className={classes.addButton}
            >
                Добавить параметр
            </Button>

            <Table striped highlightOnHover className={classes.table}>
                <Table.Thead style={{ fontSize: '0.7rem' }}>
                    <Table.Tr>
                        <Table.Th>Название</Table.Th>
                        <Table.Th width={80}>Тип</Table.Th>
                        <Table.Th width={150}></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                {params?.length > 0 ? (
                    <Table.Tbody>
                        {params?.map((param, index) => (
                            <Table.Tr key={param.uuid}>
                                <Table.Td>
                                    <Text>
                                        {param.title}
                                    </Text>
                                    {param.dataType === IBlockParameterDataType.blockLink && (
                                        <Text
                                            c="dimmed"
                                            size="xs"
                                        >
                                            Блок: {otherBlocks?.find((b) => b.uuid === param?.relatedBlockUuid)?.title}
                                        </Text>
                                    )}
                                    <Space h={5} />
                                    <Group gap={4}>
                                        {param.displayInCard? <Badge size="xs" color="green" variant="filled">В карточке</Badge> : ''}
                                        {param.isDefault? <Badge size="xs" color="blue" variant="filled">По-умолчанию</Badge> : ''}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">
                                        {IBlockParameterDataTypeTitle[param.dataType]}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4} justify="center" wrap="nowrap">
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            onClick={() => onMoveParamUp?.(param.id!)}
                                            disabled={index === 0}
                                            title="Переместить вверх"
                                        >
                                            <IconArrowUp size="1rem" />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            onClick={() => onMoveParamDown?.(param.id!)}
                                            disabled={index === params.length - 1}
                                            title="Переместить вниз"
                                        >
                                            <IconArrowDown size="1rem" />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="subtle"
                                            color="blue"
                                            onClick={() => onEditParam(param)}
                                        >
                                            <IconEdit size="1rem" />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            onClick={() => {
                                                setKbParam(param);
                                                setEditorOpened(true);
                                            }}
                                            title="Статья"
                                        >
                                            <IconQuestionMark size="1rem" />
                                        </ActionIcon>
                                        {showMoveButton && onMoveParam && paramGroupList && paramGroupList.length > 1 && (
                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray" title="Переместить параметр">
                                                        <IconArrowsRightLeft size="1rem" />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    {paramGroupList.map((group) => {
                                                        if (group.uuid === param.groupUuid) {
                                                            return null;
                                                        }
                                                        return (
                                                            <Menu.Item
                                                                key={group.uuid}
                                                                onClick={() => onMoveParam(param.uuid!, group.uuid)}
                                                            >
                                                                {group.title}
                                                            </Menu.Item>
                                                        );
                                                    })}
                                                </Menu.Dropdown>
                                            </Menu>
                                        )}
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            onClick={async () => {
                                                const result = await showDialog("Вы уверены?", "Вы уверены, что хотите удалить параметр?")
                                                if (result) {
                                                    onDeleteParam(param.id!)
                                                }
                                            }}
                                        >
                                            <IconTrash size="1rem" />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                ) : (
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Td colSpan={4}>
                                <Text c="dimmed" ta="center" py="md" size="sm">
                                    Нет добавленных параметров
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                )}
            </Table>
            {kbParam && (
                <KnowledgeBasePageEditor
                    opened={editorOpened}
                    onClose={() => setEditorOpened(false)}
                    pageUuid={kbParam.knowledgeBasePageUuid}
                    configurationUuid={configurationUuid}
                    bookUuid={bookUuid}
                    onSave={handleSavePage}
                />
            )}
        </Box>
    );
};

import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Button,
  Badge,
  Card,
  Container,
  Group,
  SegmentedControl,
  SimpleGrid,
  Space,
  Text,
  Stack, Title
} from "@mantine/core";
import React, {useEffect, useState} from "react";
import {
  useBookConfigurationEditForm
} from "@/components/configurator/BookConfigurationEditForm/useBookConfigurationEditForm";
import {
  IconCheck,
  IconEdit,
  IconFilePencil,
  IconPlus,
  IconRocket,
  IconTrash, IconWorldUpload
} from "@tabler/icons-react";
import {notifications} from "@mantine/notifications";
import {
  IBlock, IBlockStructureKind, IBlockStructureKindTitle,
  IBookConfiguration,
  IBookConfigurationVersion
} from "@/entities/ConstructorEntities";
import {
  BlockEditModal
} from "@/components/configurator/BookConfigurationEditForm/BlockEditModal/BlockEditModal";
import {useNavigate} from "react-router-dom";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";

export interface IBookConfigurationEditFormProps{
  bookConfigurationUuid: string
  bookUuid?: string
}

export const BookConfigurationEditForm = (props: IBookConfigurationEditFormProps) => {
  const [currentVersion, setCurrentVersion] = useState<IBookConfigurationVersion>()
  const navigate = useNavigate()

  const getBlackBlock = (): IBlock => {
    return {
      configurationVersionUuid: currentVersion?.uuid,
      uuid: '',
      title: '',
      description: '',
      useTabs: false,
      structureKind: IBlockStructureKind.single,
    }
  }

  const [isModalOpened, setIsModalOpened] = useState<boolean>(false)
  const [currentBlock, setCurrentBlock] = useState<IBookConfiguration>(getBlackBlock())
  const { isMobile} = useMedia();
  const { showDialog } = useDialog();
  const {
    configuration,
    versionList,
    publishVersion,
    blockList,
    saveBlock,
    paramGroupList,
    removeBlock
  } = useBookConfigurationEditForm(props.bookConfigurationUuid, props.bookUuid, currentVersion, currentBlock)

  const breadCrumbs = [
    { title: 'Конфигуратор', href: '/configurator' },
    { title: configuration?.title, href: '#' },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

  const handleVersionPublication = async () => {
    const result = await showDialog(
        'Опубликовать версию',
        'Вы действительно хотите опубликовать версию?'
    );
    if (!result) {
      return;
    }
    const newVersion = await publishVersion();
    if (newVersion) {
      setCurrentVersion(newVersion);
    }
  };

  useEffect(() => {
    setCurrentVersion(versionList?.[versionList?.length - 1])
  }, [versionList])


  function handleOpenBlockPage(c: IBlock) {
    let path = `/block/edit?uuid=${c.uuid}`;
    if (props.bookUuid) {
      path += `&bookUuid=${props.bookUuid}`;
    }
    return () => navigate(path);
  }

  return (
      <>
        <Container fluid style={{backgroundColor: 'white', padding: '20px'}}>
          <h1>Конфигурация: {configuration?.title}</h1>
          <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
            {breadCrumbs}
          </Breadcrumbs>
          <Space h={20}/>
          {versionList && versionList.length > 0 && (
              <>
                <SegmentedControl
                    value={currentVersion?.uuid || versionList[0].uuid}
                    orientation={isMobile ? "vertical" : "horizontal"}
                    onChange={(value) => {
                      setCurrentVersion(versionList?.find((v) => v.uuid === value));
                    }}
                    styles={{
                      root: {
                        "--sc-font-size": "12px",
                        "--sc-padding": "0px",
                        backgroundColor: "transparent",
                        gap: "4px",
                      },
                      indicator: {
                        border: "1px solid #dee2e6",
                        backgroundColor: "white",
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                        },
                      },
                      label: {
                        padding: "6px 10px",
                      },
                    }}
                    data={versionList.map(version => ({
                      value: version.uuid,
                      label: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {version.isDraft ? (
                                <IconFilePencil size={24} />
                            ) : (
                                <IconCheck size={24} color="green" />
                            )}
                            <span>
                              Версия {version.versionNumber}
                              {version.isDraft && ' (черновик)'}
                            </span>
                          </div>
                      ),
                    }))}
                />
                <Space h="sm" />
              </>
          )}

          {currentVersion?.isDraft && (
              <>
                <Button
                  variant={"subtle"}
                  onClick={handleVersionPublication}
                  leftSection={<IconWorldUpload  size={16} />}
                >
                  Опубликовать версию
                </Button>
              </>)}
          <Title order={4}>Блоки</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {/* Новая карточка для добавления */}
            {currentVersion?.isDraft && (
                <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      setCurrentBlock(getBlackBlock());
                      setIsModalOpened(true);
                    }}
                >
                  <Stack align="center" gap="xs">
                    <IconPlus size={32} stroke={1.5} />
                    <Text fw={500}>Добавить блок</Text>
                  </Stack>
                </Card>
            )}
            {blockList?.map((c) =>
                <Card key={c.uuid} shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Text fw={500} truncate="end">{c.title}</Text>
                      <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => removeBlock(c)}
                      >
                        <IconTrash size={18}/>
                      </ActionIcon>
                    </Group>

                    <Group gap="xs">
                      <Badge variant="light" color="blue">
                        {IBlockStructureKindTitle[c.structureKind]}
                      </Badge>
                      {c.useTabs && (
                          <Badge variant="light" color="orange">
                            С вкладками
                          </Badge>
                      )}
                    </Group>

                    {c.description && (
                        <Text size="sm" c="dimmed" lineClamp={3}>
                          {c.description}
                        </Text>
                    )}

                    <Group mt="auto" justify="space-between">
                      <Button
                          variant="light"
                          color="blue"
                          size="sm"
                          onClick={handleOpenBlockPage(c)}
                      >
                        Открыть
                      </Button>
                      <Button
                          variant="subtle"
                          color="gray"
                          size="sm"
                          leftSection={<IconEdit size={16}/>}
                          onClick={() => {
                            setCurrentBlock(c)
                            setIsModalOpened(true)
                          }}
                      >
                        Изменить
                      </Button>
                    </Group>
                  </Stack>
                </Card>
            )}
          </SimpleGrid>
        </Container>

        {isModalOpened && <BlockEditModal
            isOpen={isModalOpened}
            configurationUuid={props.bookConfigurationUuid}
            onClose={() => setIsModalOpened(false)}
            onSave={(c) => {
              notifications.show({
                title: 'Блок',
                message: `Блок "${c.title}" сохранён`,
              })
              saveBlock(c)
            }}
            initialData={currentBlock}
        />}
      </>
  )
}

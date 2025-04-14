import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Grid,
  Group, SegmentedControl, SimpleGrid,
  Space,
  Text
} from "@mantine/core";
import React, {useEffect, useState} from "react";
import {
  useBookConfigurationEditForm
} from "@/components/configurator/BookConfigurationEditForm/useBookConfigurationEditForm";
import {IconCheck, IconEdit, IconFilePencil, IconTrash} from "@tabler/icons-react";
import {notifications} from "@mantine/notifications";
import {
  IBlock,
  IBookConfiguration,
  IBookConfigurationVersion
} from "@/entities/ConstructorEntities";
import {
  BlockEditModal
} from "@/components/configurator/BookConfigurationEditForm/BlockEditModal/BlockEditModal";
import {useNavigate} from "react-router-dom";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useDialog} from "@/providers/DialogProvider/DialogProvider";



export const BookConfigurationEditForm = ({bookConfigurationUuid}: {bookConfigurationUuid: string}) => {

  const [currentVersion, setCurrentVersion] = useState<IBookConfigurationVersion>()

  const navigate = useNavigate()
  const getBlackBlock = (): IBlock => {
    return {
      configurationVersionUuid: currentVersion?.uuid,
      uuid: '',
      title: '',
      description: '',
      useTabs: false
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
    paramGroupList
  } = useBookConfigurationEditForm(bookConfigurationUuid, currentVersion, currentBlock)


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

  return (
      <>
        <Container fluid>
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
                    onChange={(value)=>{
                     setCurrentVersion(versionList?.find((v)=>v.uuid === value))
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
                <Space h="md" />
              </>
          )}

          {currentVersion?.isDraft && (
              <>
                <Button onClick={handleVersionPublication}>
                  Опубликовать версию
                </Button>
                <Space h={20}/>
                <Text size="xl">Строительные блоки</Text>
                <Button
                  onClick={() => {
                    setCurrentBlock(getBlackBlock())
                    setIsModalOpened(true)
                  }}
                >
                  Добавить
                </Button>
              </>)}
          <Space h={20}/>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 2, xl: 5 }}>
            {blockList?.map((c) =>
                <Card key={c.uuid}>
                  <Group justify="space-between" mt="md" mb="xs">
                    <Button
                        variant={"subtle"}
                        onClick={() => {navigate(`/block/edit?uuid=${c.uuid}`)}}
                    >
                      {c.title}
                    </Button>
                    <ActionIcon
                        color={"var(--mantine-color-red-9)"}
                        variant={"subtle"}
                        onClick={() => {
                        //  removeConfiguration(c)
                        }}
                    >
                      <IconTrash/>
                    </ActionIcon>
                  </Group>
                  <Text size="sm" c="dimmed">{c.description}</Text>
                  <Group style={{marginTop: '10px'}}>
                    <Button
                        color="blue"
                        radius="md"
                        variant={"outline"}
                        leftSection={<IconEdit/>}
                        onClick={() => {
                          setCurrentBlock(c)
                          setIsModalOpened(true)
                        }}
                    >
                      Переименовать
                    </Button>
                  </Group>
                </Card>
            )}
          </SimpleGrid>

        </Container>

        {isModalOpened && <BlockEditModal
            isOpen={isModalOpened}
            configurationUuid={bookConfigurationUuid}
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

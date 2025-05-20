import {
  useConfigurationManager
} from "./useConfigurationManager";
import {
  Text,
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  Space, SimpleGrid, Anchor, Breadcrumbs, Image
} from "@mantine/core";
import {IconDownload, IconEdit, IconSettings, IconTablePlus, IconTrash} from "@tabler/icons-react";
import {
  ConfigurationEditModal
} from "@/components/configurator/BookConfigurationManager/ConfigurationEditModal/ConfigurationEditModal";
import React, {useEffect, useState} from "react";
import {IBookConfiguration} from "@/entities/ConstructorEntities";
import { notifications } from '@mantine/notifications';
import {useNavigate} from "react-router-dom";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {configDatabase} from "@/entities/configuratorDb";
import {exportConfiguration} from "@/utils/configurationBackupManager";

const getBlackConfiguration = (): IBookConfiguration => {
  return {
    uuid: '',
    title: '',
    description: ''
  }
}

export const BookConfigurationManager = () =>{
  const {
    configurationList,
    saveConfiguration,
    removeConfiguration,
    importConfiguration,
  } = useConfigurationManager()

  const navigate = useNavigate()

  const [isModalOpened, setIsModalOpened] = useState<boolean>(false)
  const [currentBookConfiguration, setCurrentBookConfiguration] = useState<IBookConfiguration>(getBlackConfiguration())
  const {setPageTitle} = usePageTitle()

  const breadCrumbs = [
    { title: 'Конфигуратор', href: '/configurator' },
  ].map((item, index) => (
      <Anchor href={item.href} key={index}>
        {item.title}
      </Anchor>
  ));

  useEffect(() => {
    setPageTitle('Конфигуратор')
  }, [])

  // Обработчик экспорта
  const handleExport = async (configUuid: string) => {
    await exportConfiguration(configDatabase, configUuid);
  };

  // Обработчик импорта
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = await importConfiguration(data);

        if (success) {
          notifications.show({
            title: 'Успех',
            message: 'Конфигурация успешно импортирована',
            color: 'green',
          });
        }
      } catch (error) {
        notifications.show({
          title: 'Ошибка',
          message: 'Неверный формат файла',
          color: 'red',
        });
      }
    };
    reader.readAsText(file);
  };


  return (
      <>
        <Container fluid>
          <h1>Конфигурации книг</h1>
          <Breadcrumbs separator="→" separatorMargin="md" mt="xs">
            {breadCrumbs}
          </Breadcrumbs>
          <Space h={20}/>
          <Group>
            <Button
                leftSection={<IconTablePlus/>}
                onClick={() => {
                  setCurrentBookConfiguration(getBlackConfiguration())
                  setIsModalOpened(true)
                }}
            >
              Добавить
            </Button>
            <Button
                leftSection={<IconDownload/>}
                component="label"
            >
              Импорт
              <input type="file" hidden onChange={handleImport} />
            </Button>
          </Group>
          <Space h={20}/>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 2, xl: 5 }}
          >
              {configurationList?.map((c) =>
                <Card key={c.uuid}>
                  <Card.Section>
                    <Image
                        src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"
                        height={160}
                        alt="Norway"
                    />
                  </Card.Section>
                  <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={500}>{c.title}</Text>
                    <ActionIcon
                        color={"var(--mantine-color-red-9)"}
                        variant={"subtle"}
                        onClick={() => {
                          removeConfiguration(c)
                        }}
                    >
                      <IconTrash/>
                    </ActionIcon>
                  </Group>
                  <Text size="sm" c="dimmed">{c.description}</Text>
                  <Group style={{marginTop: '10px'}}>
                    <Button
                        variant="outline"
                        leftSection={<IconDownload size={16}/>}
                        onClick={() => handleExport(c.uuid!)}
                    >
                      Экспорт
                    </Button>
                    <Button
                      radius="md"
                      leftSection={<IconSettings/>}
                      variant={"outline"}
                      onClick={() => {
                        navigate('/configuration/edit/?uuid=' + c.uuid)
                      }}
                    >
                      Настроить
                    </Button>
                  </Group>
                </Card>
          )}
          </SimpleGrid>
        </Container>
        {isModalOpened && <ConfigurationEditModal
            isOpen={isModalOpened}
            onClose={() => setIsModalOpened(false)}
            onSave={(c) => {
              notifications.show({
                title: 'Конфигурация',
                message: `Конфигурация "${c.title}" сохранена`,
              })
              saveConfiguration(c)
            }}
            initialData={currentBookConfiguration}
        />}
      </>
  )
}

import {useDisclosure} from "@mantine/hooks";
import {AppShell, Burger, Group, Text} from "@mantine/core";
import {NavbarNested} from "@/components/layout/NavbarNested/NavbarNested";
import {Outlet} from "react-router-dom";
import {useBookDbConnection} from "@/components/hooks/useBookDbConnection";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";

export const BaseLayout = () =>  {
  const [opened, { toggle }] = useDisclosure();
  const { pageTitle, titleElement } = usePageTitle();
  // Подключаемся к базе данных выбранной книги
  useBookDbConnection();
  const { isMobile} = useMedia();
  return (
      <>
        <AppShell
            header={
              {
                height: {base: 50, sm: 0, lg: 0},
              }
            }
            navbar={{
              width: 300,
              breakpoint: 'sm',
              collapsed: { mobile: !opened },
            }}
            padding={isMobile ? '0' : 'md'}
            styles={{
              main: {
                backgroundColor: 'rgb(246 251 255)',
              },
            }}
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between" align="center" gap="0">
              <Burger
                  opened={opened}
                  onClick={toggle}
                  hiddenFrom="sm"
                  lineSize={1}
                  size="lg"
              />
              {titleElement || (
                  <Text fw={500} hiddenFrom="sm">
                    {pageTitle}
                  </Text>
              )}
            </Group>
          </AppShell.Header>

          <AppShell.Navbar>
            <NavbarNested toggleNavbar={toggle}/>
          </AppShell.Navbar>

          <AppShell.Main>
            <Outlet/>
          </AppShell.Main>
        </AppShell>
      </>
  );
}

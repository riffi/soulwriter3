// src/components/book/BookDashboard.tsx
import {
  Container,
  Group,
  SimpleGrid,
  Title,
} from "@mantine/core";
import { useLiveQuery } from "dexie-react-hooks";
import { bookDb } from "@/entities/bookDb";
import { BlockRepository } from "@/repository/BlockRepository";
import {DashboardBlockCard} from "@/components/books/BookDashboard/parts/DashboardBlockCard";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";


export const BookDashboard = (bookUuid: string) => {
  const { setPageTitle } = usePageTitle();
  const blocks = useLiveQuery(async () => {
    if (!bookUuid) return [];
    return BlockRepository.getAll(bookDb);
  }, [bookUuid]);
  setPageTitle(`Рабочий стол книги`);
  return (
      <Container fluid p="md">
        <Group justify="space-between" mb="md" visibleFrom="sm">
          <Title order={2}>Рабочий стол книги</Title>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {blocks?.map((block) => (
              <DashboardBlockCard key={block.uuid} block={block} />
          ))}
        </SimpleGrid>
      </Container>
  );
};

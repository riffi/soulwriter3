import {Modal, Button, Stack, TextInput} from '@mantine/core';
import MDEditor from '@uiw/react-md-editor';
import {useEffect, useState} from 'react';
import {IKnowledgeBasePage} from '@/entities/KnowledgeBaseEntities';
import {bookDb} from '@/entities/bookDb';
import {configDatabase} from '@/entities/configuratorDb';
import {KnowledgeBaseRepository} from '@/repository/KnowledgeBaseRepository';
import {generateUUID} from '@/utils/UUIDUtils';

interface KnowledgeBasePageEditorProps {
  opened: boolean;
  onClose: () => void;
  pageUuid?: string;
  configurationUuid?: string;
  bookUuid?: string;
  onSave?: (page: IKnowledgeBasePage) => void;
}

export const KnowledgeBasePageEditor = ({
  opened,
  onClose,
  pageUuid,
  configurationUuid,
  bookUuid,
  onSave,
}: KnowledgeBasePageEditorProps) => {
  const db = bookUuid ? bookDb : configDatabase;
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    if (!opened) return;
    const load = async () => {
      if (pageUuid) {
        const page = await KnowledgeBaseRepository.getByUuid(db, pageUuid);
        if (page) {
          setTitle(page.title);
          setMarkdown(page.markdown);
          return;
        }
      }
      setTitle('');
      setMarkdown('');
    };
    load();
  }, [opened, pageUuid, db]);

  const handleSave = async () => {
    const data: IKnowledgeBasePage = {
      uuid: pageUuid || generateUUID(),
      title,
      markdown,
      configurationUuid: bookUuid ? undefined : configurationUuid,
      bookUuid,
    };
    await KnowledgeBaseRepository.save(db, data);
    onSave?.(data);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Страница базы знаний" size="xl" fullScreen={false}>
      <Stack gap="md">
        <TextInput label="Название" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        <MDEditor value={markdown} onChange={(v) => setMarkdown(v || '')} height={400} />
        <Button onClick={handleSave}>Сохранить</Button>
      </Stack>
    </Modal>
  );
};

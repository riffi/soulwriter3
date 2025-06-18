import React from 'react';
import { IScene } from '@/entities/BookEntities';
import styles from '../BookReader.module.css';
import { IconEdit, IconEye } from '@tabler/icons-react';
import { RichEditor } from '@/components/shared/RichEditor/RichEditor';
import { ActionIcon, Box, Group, Space, Title } from "@mantine/core";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {SceneRepository} from "@/repository/Scene/SceneRepository";
import {bookDb} from "@/entities/bookDb";
import {useLiveQuery} from "dexie-react-hooks";

interface SceneProps {
  scene: IScene;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSceneUpdate: (sceneId: number, newBody: string) => void;
}

export const BookReaderScene: React.FC<SceneProps> = ({
                                                        scene,
                                                        isEditing,
                                                        onEditStart,
                                                        onEditCancel,
                                                        onSceneUpdate
                                                      }) => {
  const handleContentChange = (contentHtml: string) => {
    onSceneUpdate(scene.id!, contentHtml);
  };
  const { isMobile } = useMedia();

  const body = useLiveQuery<string>(() => SceneRepository.getBodyById(bookDb, scene.id!), [scene]);

  return (
      <Box id={`scene-${scene.id}`} data-scene style={{ scrollMarginTop: isMobile ? '50px' : '10px' }}>
        <Group>
          <Title
              order={4}
              style={{
                color: isEditing ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-7)',
              }}

          >{scene.title}</Title>
          {!isEditing ? (
              <ActionIcon
                  onClick={onEditStart}
                  variant="subtle"
              >
                <IconEdit size={16} />
              </ActionIcon>
          ) : (
              <ActionIcon
                  onClick={onEditCancel}
                  variant="subtle"
              >
                <IconEye size={16} />
              </ActionIcon>
          )}
        </Group>
        {isEditing ? (
            <>
              <Space h={10}/>
              <RichEditor
                  initialContent={body}
                  onContentChange={(html) => handleContentChange(html)}
              />
            </>
        ) : (
            <div
                dangerouslySetInnerHTML={{ __html: body }}
                className={styles.contentBody}
            />
        )}
      </Box>
  );
};

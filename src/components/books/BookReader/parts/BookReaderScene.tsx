import React from 'react';
import { IScene } from '@/entities/BookEntities';
import styles from '../BookReader.module.css';
import {IconEdit, IconEye, IconX} from '@tabler/icons-react';
import { RichEditor } from '@/components/shared/RichEditor/RichEditor';
import {ActionIcon, Box, Group, Space, Title} from "@mantine/core";

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


  return (
      <Box id={`scene-${scene.id}`} data-scene>
        <Group>
          <Title order={4}>{scene.title}</Title>
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
                  initialContent={scene.body}
                  onContentChange={(html) => handleContentChange(html)}
              />
            </>
        ) : (
            <div
                dangerouslySetInnerHTML={{ __html: scene.body }}
                className={styles.contentBody}
            />
        )}
      </Box>
  );
};

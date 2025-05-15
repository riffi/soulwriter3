import React, {useMemo, useCallback, useEffect} from 'react';
import { Flex, NavLink, Container, Loader, Text, ScrollArea } from '@mantine/core';
import { useScrollSpy } from '@mantine/hooks';
import styles from './BookReader.module.css';
import {useBookReader} from "@/components/books/BookReader/useBookReader";
import {SceneComponent} from "@/components/books/BookReader/parts/SceneComponent";
import {IconFolder, IconLibrary} from "@tabler/icons-react";


interface TOCItem {
  type: 'chapter' | 'scene';
  id: number;
  order: number;
  title: string;
  children?: TOCItem[];
}
const TOCItemComponent: React.FC<{
  item: TOCItem;
  currentSceneId?: number;
  currentChapterId?: number;
  onNavigate: (id: string) => void;
}> = ({ item, currentSceneId, currentChapterId, onNavigate }) => {
  if (item.type === 'chapter') {
    return (
        <NavLink
            label={item.title}
            leftSection={<IconLibrary/>}
            className={item.id === currentChapterId ? styles.activeItem : ''}
        >
          {item.children?.map(child => (
              <TOCItemComponent
                  key={child.id}
                  item={child}
                  currentSceneId={currentSceneId}
                  onNavigate={onNavigate}
              />
          ))}
        </NavLink>
    );
  }

  return (
      <NavLink
          label={item.title}
          onClick={() => onNavigate(`scene-${item.id}`)}
          size="sm"
          className={item.id === currentSceneId ? styles.activeItem : ''}
      />
  );
};

export const BookReader: React.FC = () => {
  const { scenes, chapters, loading, error } = useBookReader();
  const { active: activeSceneIndex, reinitialize: reinitializeSceneSpy } = useScrollSpy({
    selector: '[data-scene]',
    getDepth: el => Number(el.getAttribute('data-scene')),
    getValue: el => el.getAttribute('data-scene') || '',
    offset: 100,
  });

  const currentScene = scenes[activeSceneIndex];
  const currentChapter = chapters.find(c => c.id === currentScene?.chapterId);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    reinitializeSceneSpy();
  }, [scenes, chapters]);

  const buildTOC = useMemo(() => {
    const chapterItems: TOCItem[] = chapters.map(chapter => ({
      type: 'chapter' as const,
      id: chapter.id!,
      order: chapter.order,
      title: chapter.title,
      children: scenes
      .filter(s => s.chapterId === chapter.id)
      .map(scene => ({
        type: 'scene' as const,
        id: scene.id!,
        order: scene.order,
        title: scene.title,
      })),
    }));

    const standaloneScenes: TOCItem[] = scenes
    .filter(s => !s.chapterId)
    .map(scene => ({
      type: 'scene' as const,
      id: scene.id!,
      order: scene.order,
      title: scene.title,
    }));

    return [...chapterItems, ...standaloneScenes];
  }, [chapters, scenes]);

  if (loading) {
    return (
        <div className={styles.loaderContainer}>
          <Loader size="xl" />
        </div>
    );
  }

  if (error) {
    return (
        <div className={styles.errorContainer}>
          <Text color="red" size="lg">{error}</Text>
        </div>
    );
  }

  return (
      <div className={styles.container}>
        <div className={styles.tocPanel}>
          <ScrollArea>
            {buildTOC.map(item => (
                <TOCItemComponent
                    key={`${item.type}-${item.id}`}
                    item={item}
                    currentSceneId={currentScene?.id}
                    currentChapterId={currentChapter?.id}
                    onNavigate={scrollToSection}
                />
            ))}
          </ScrollArea>
        </div>

        <div className={styles.contentPanel}>
          <Container size="lg">
            {buildTOC.map(item => item.type === 'chapter' ? (
                <div key={item.id}>
                  <h2 className={styles.chapterTitle}>{item.title}</h2>
                  {item.children?.map(child => (
                      <SceneComponent
                          key={child.id}
                          scene={scenes.find(s => s.id === child.id)!}
                      />
                  ))}
                </div>
            ) : (
                <SceneComponent key={item.id} scene={scenes.find(s => s.id === item.id)!} />
            ))}
          </Container>
        </div>
      </div>
  );
};

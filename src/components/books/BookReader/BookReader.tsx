import React, {useMemo, useCallback, useEffect, useState} from 'react';
import {NavLink, Container, Loader, Text, ScrollArea } from '@mantine/core';
import { useScrollSpy } from '@mantine/hooks';
import styles from './BookReader.module.css';
import {useBookReader} from "@/components/books/BookReader/useBookReader";
import {BookReaderScene} from "@/components/books/BookReader/parts/BookReaderScene";
import {IconLibrary} from "@tabler/icons-react";
import {bookDb} from "@/entities/bookDb";


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
            label={`${item.order}. ${item.title}`}
            defaultOpened={true}
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
  const { active: activeSceneOrder, reinitialize: reinitializeSceneSpy } = useScrollSpy({
    selector: '[data-scene]',
    getDepth: el => Number(el.getAttribute('data-scene')),
    getValue: el => el.getAttribute('data-scene') || '',
    offset: 100,
  });
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const currentScene = activeSceneOrder !== undefined ? scenes?.find(s => s.order === activeSceneOrder + 1) : null
  const currentChapter = chapters?.find(c => c.id === currentScene?.chapterId);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    reinitializeSceneSpy();
  }, [scenes, chapters]);

  const buildTOC = useMemo(() => {
    const chapterItems: TOCItem[] = chapters?.map(chapter => ({
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
    })) || [];

    const standaloneScenes: TOCItem[] = scenes?.filter(s => !s.chapterId)
    .map(scene => ({
      type: 'scene' as const,
      id: scene.id!,
      order: scene.order,
      title: scene.title,
    })) || [];

    return [...chapterItems, ...standaloneScenes];
  }, [chapters, scenes]);



  const handleSceneUpdate = useCallback(async (sceneId: number, newBody: string) => {
    try {
      await bookDb.scenes.update(sceneId, { body: newBody });
      // setData(prev => ({
      //   ...prev,
      //   scenes: prev.scenes.map(scene =>
      //       scene.id === sceneId ? { ...scene, body: newBody } : scene
      //   )
      // }));
    } catch (err) {
      console.error('Ошибка сохранения сцены:', err);
    }
  }, []);

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
                      <BookReaderScene
                          key={child.id}
                          scene={scenes.find(s => s.id === child.id)!}
                          isEditing={editingSceneId === child.id}
                          onEditStart={() => setEditingSceneId(child.id)}
                          onEditCancel={() => setEditingSceneId(null)}
                          onSceneUpdate={handleSceneUpdate}
                      />
                  ))}
                </div>
            ) : (
                <BookReaderScene
                    key={item.id}
                    scene={scenes.find(s => s.id === item.id)!}
                    isEditing={editingSceneId === item.id}
                    onEditStart={() => setEditingSceneId(item.id)}
                    onEditCancel={() => setEditingSceneId(null)}
                    onSceneUpdate={handleSceneUpdate}
                />
            ))}
          </Container>
        </div>
      </div>
  );
};

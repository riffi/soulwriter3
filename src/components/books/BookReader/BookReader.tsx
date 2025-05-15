import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { Flex, ScrollArea, NavLink, Container, Loader, Text } from '@mantine/core';
import { IScene, IChapter } from '@/entities/BookEntities';
import {bookDb} from "@/entities/bookDb";

interface TOCItem {
  type: 'chapter' | 'scene';
  id: number;
  title: string;
  children?: TOCItem[];
}

interface BookReaderProps {

}

export const BookReader: React.FC<BookReaderProps> = ({  }) => {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [scenes, setScenes] = useState<IScene[]>([]);
  const [chapters, setChapters] = useState<IChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<{ chapterId?: number; sceneId?: number }>({});




  useEffect(() => {
    const initDB = async () => {
      try {

        // Загрузка данных
        const chaptersData = await bookDb.chapters.orderBy('order').toArray();
        const scenesData = await bookDb.scenes.toArray();

        setChapters(chaptersData);
        setScenes(scenesData);

        // Построение TOC
        const newTocItems: TOCItem[] = [];

        // Главы и их сцены
        for (const chapter of chaptersData) {
          const chapterScenes = scenesData
          .filter(scene => scene.chapterId === chapter.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

          newTocItems.push({
            type: 'chapter',
            id: chapter.id!,
            title: chapter.title,
            children: chapterScenes.map(scene => ({
              type: 'scene' as const,
              id: scene.id!,
              title: scene.title
            }))
          });
        }

        // Сцены без главы
        const standaloneScenes = scenesData
        .filter(scene => !scene.chapterId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

        newTocItems.push(...standaloneScenes.map(scene => ({
          type: 'scene' as const,
          id: scene.id!,
          title: scene.title,
          children: undefined
        })));

        setTocItems(newTocItems);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initDB();

    return () => {
    };
  }, []);

  // Функция прокрутки
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Рендер TOC
// Модифицированный рендер TOC
  const renderTOC = useMemo(() => {
    return (items: TOCItem[]) => {
      return items.map(item => {
        const isActiveChapter = item.type === 'chapter' && item.id === activeSection.chapterId;
        const isActiveScene = item.type === 'scene' && item.id === activeSection.sceneId;

        if (item.type === 'chapter') {
          return (
              <NavLink
                  key={`chapter-${item.id}`}
                  label={item.title}
                  icon={<span style={{ fontSize: '1rem' }}>📚</span>}
                  styles={{
                    root: {
                      backgroundColor: isActiveChapter ? '#e7f5ff' : 'transparent',
                      fontWeight: isActiveChapter ? 600 : 'normal'
                    }
                  }}
              >
                {item.children?.map(child => {
                  const isChildActive = child.id === activeSection.sceneId;
                  return (
                      <NavLink
                          key={`scene-${child.id}`}
                          label={child.title}
                          onClick={() => scrollToSection(`scene-${child.id}`)}
                          size="sm"
                          styles={{
                            root: {
                              backgroundColor: isChildActive ? '#e7f5ff' : 'transparent',
                              fontWeight: isChildActive ? 600 : 'normal'
                            }
                          }}
                      />
                  );
                })}
              </NavLink>
          );
        } else {
          const isActive = item.id === activeSection.sceneId;
          return (
              <NavLink
                  key={`scene-${item.id}`}
                  label={item.title}
                  onClick={() => scrollToSection(`scene-${item.id}`)}
                  styles={{
                    root: {
                      backgroundColor: isActive ? '#e7f5ff' : 'transparent',
                      fontWeight: isActive ? 600 : 'normal'
                    }
                  }}
                  size="sm"
              />
          );
        }
      });
    };
  }, [activeSection]);

  if (loading) {
    return (
        <Flex justify="center" align="center" h="100vh">
          <Loader size="xl" />
        </Flex>
    );
  }

  if (error) {
    return (
        <Flex justify="center" align="center" h="100vh">
          <Text color="red" size="lg">{error}</Text>
        </Flex>
    );
  }

  return (
      <Flex>
        {/* Левая панель TOC (фиксированная) */}
        <div style={{
          width: 300,
          position: 'fixed', // Фиксированное позиционирование
          left:300,
          top: 0,
          bottom: 0,
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          overflowY: 'auto' // Прокрутка только внутри TOC при необходимости
        }}>
          {renderTOC(tocItems)}
        </div>

        {/* Правая панель контента */}
        <div style={{
          flex: 1,
          marginLeft: 300, // Отступ равен ширине TOC
          padding: '1.5rem',
          backgroundColor: 'white',
          minHeight: '100vh', // Для заполнения всей высоты
          maxWidth: '1200px', // Ограничение ширины по ширине экрана минус ширина TOC
          overflowY: 'auto'
        }}>
          <Container size="lg">
            {tocItems.map(item => {
              if (item.type === 'chapter') {
                const chapter = chapters.find(c => c.id === item.id);
                const chapterScenes = item.children
                ?.map(child => scenes.find(s => s.id === child.id))
                .filter(Boolean) as IScene[];

                return (
                    <div
                        key={`chapter-content-${item.id}`}
                        id={`chapter-${item.id}`}
                        data-chapter
                        data-chapter-id={item.id}>
                      <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        borderBottom: '2px solid #e0e0e0',
                        paddingBottom: '0.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        {chapter?.title}
                      </h2>
                      {chapterScenes.map(scene => (
                          <div
                              key={`scene-content-${scene.id}`}
                              id={`scene-${scene.id}`}
                              style={{marginBottom: '2rem'}}
                          >
                            <h3 style={{
                              fontSize: '1.5rem',
                              fontWeight: 600,
                              marginBottom: '0.5rem'
                            }}>
                              {scene.title}
                            </h3>
                            <div
                                dangerouslySetInnerHTML={{__html: scene.body}}
                                style={{
                                  lineHeight: 1.8,
                                  fontFamily: '"Segoe UI", sans-serif',
                                  fontSize: '1rem'
                                }}
                            />
                          </div>
                      ))}
                    </div>
                );
              } else {
                const scene = scenes.find(s => s.id === item.id);
                if (!scene) return null;

                return (
                    <div
                        key={`scene-content-${scene.id}`}
                        id={`scene-${scene.id}`}
                        style={{marginBottom: '2rem'}}
                        data-scene
                        data-scene-id={scene?.id}
                    >
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem'
                      }}>
                        {scene.title}
                      </h3>
                      <div
                          dangerouslySetInnerHTML={{__html: scene.body}}
                          style={{
                            lineHeight: 1.8,
                            fontFamily: '"Segoe UI", sans-serif',
                            fontSize: '1rem'
                          }}
                      />
                    </div>
                );
              }
            })}
          </Container>
        </div>
      </Flex>
  );
};


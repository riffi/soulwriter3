import {useState, useCallback} from 'react';
import {Drawer, Button, LoadingOverlay, ScrollArea, Text} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {OpenRouterApi} from '@/api/openRouterApi';
import { marked } from 'marked';

export const SceneAnalysisDrawer = ({isOpen, onClose, sceneBody}: SceneAnalysisDrawerProps) => {
  const [analysisHtml, setAnalysisHtml] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!sceneBody) {
      notifications.show({ title: 'Ошибка', message: 'Отсутствует текст сцены для анализа.', color: 'orange' });
      return;
    }
    setLoading(true);
    try {
      const markdown = await OpenRouterApi.fetchSceneAnalysis(sceneBody);
      console.log(markdown);
      setAnalysisHtml(marked.parse(markdown));
    } catch (error: any) {
      notifications.show({ title: 'Ошибка', message: error.message || 'Не удалось получить анализ.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [sceneBody]);

  return (
      <Drawer opened={isOpen} onClose={onClose} title="Литературный анализ" padding="md" size="lg" position="right">
        <div style={{ position: 'relative', minHeight: '200px' }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <Button onClick={handleGenerate} disabled={loading}>Сгенерировать анализ</Button>
          <div style={{ overflow: 'scroll' }}>
            {analysisHtml ? (
                <div dangerouslySetInnerHTML={{ __html: analysisHtml }} />
            ) : (
                !loading && <Text c="dimmed" ta="center">Анализ еще не сгенерирован.</Text>
            )}
          </div>
        </div>
      </Drawer>
  );
};

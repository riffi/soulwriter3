import { useState, useCallback } from 'react';
import { Drawer, Button, LoadingOverlay, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { OpenRouterApi } from '@/api/openRouterApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';

interface ISceneAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sceneBody?: string | null;
}

export const SceneAnalysisDrawer = (props: ISceneAnalysisDrawerProps) => {
  const [analysisMarkdown, setAnalysisMarkdown] = useState('');
  const [loading, setLoading] = useState(false);

  const stripWrappers = (raw: string) => {
    let md = raw.trim();

    if (md.startsWith('<code')) {
      md = md.replace(/^<code[^>]*?>/, '').replace(/<\/code>$/, '').trim();
    }

    if (md.startsWith('```')) {
      md = md.replace(/^```[^\n]*\n/, '').replace(/\n```$/, '').trim();
    }

    return md;
  };

  const handleGenerate = useCallback(async () => {
    if (!props.sceneBody) {
      notifications.show({
        title: 'Ошибка',
        message: 'Отсутствует текст сцены для анализа.',
        color: 'orange',
      });
      return;
    }

    setLoading(true);
    try {
      const rawMarkdown = await OpenRouterApi.fetchSceneAnalysis(props.sceneBody);
      setAnalysisMarkdown(stripWrappers(rawMarkdown));
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось провести анализ.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [props.sceneBody]);

  return (
      <Drawer
          opened={props.isOpen}
          onClose={props.onClose}
          title="Литературный анализ"
          padding="md"
          size="lg"
          position="right"
      >
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <Button onClick={handleGenerate} disabled={loading} mb="md">
            Провести анализ
          </Button>

          {analysisMarkdown ? (
              <div
                  style={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                    paddingRight: 10,
                  }}
              >
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisMarkdown}</ReactMarkdown>
                </div>
              </div>
          ) : (
              !loading && (
                  <Text c="dimmed" ta="center">
                    Анализ ещё не проведен.
                  </Text>
              )
          )}
        </div>
      </Drawer>
  );
};

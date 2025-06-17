import { useState, useCallback } from 'react';
import {
  Drawer,
  Button,
  LoadingOverlay,
  Text,
  Tabs,
} from '@mantine/core';
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
  /**
   * Tab state
   */
  const [activeTab, setActiveTab] = useState<string | null>('analysis');

  /**
   * Literary analysis state
   */
  const [analysisMarkdown, setAnalysisMarkdown] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  /**
   * Problems search state
   */
  const [problemsMarkdown, setProblemsMarkdown] = useState('');
  const [loadingProblems, setLoadingProblems] = useState(false);

  /**
   * Utility – strip <code> / ``` wrappers that OpenRouter might return
   */
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

  /**
   * Generate literary analysis (tab #1)
   */
  const handleGenerateAnalysis = useCallback(async () => {
    if (!props.sceneBody) {
      notifications.show({
        title: 'Ошибка',
        message: 'Отсутствует текст сцены для анализа.',
        color: 'orange',
      });
      return;
    }

    setLoadingAnalysis(true);
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
      setLoadingAnalysis(false);
    }
  }, [props.sceneBody]);

  /**
   * Generate problems report (tab #2)
   */
  const handleGenerateProblems = useCallback(async () => {
    if (!props.sceneBody) {
      notifications.show({
        title: 'Ошибка',
        message: 'Отсутствует текст сцены для анализа.',
        color: 'orange',
      });
      return;
    }

    setLoadingProblems(true);
    try {
      // Предполагаем, что в OpenRouterApi есть метод fetchSceneProblems
      const rawMarkdown = await OpenRouterApi.fetchSceneProblems(props.sceneBody);
      setProblemsMarkdown(stripWrappers(rawMarkdown));
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось найти проблемы в тексте.',
        color: 'red',
      });
    } finally {
      setLoadingProblems(false);
    }
  }, [props.sceneBody]);

  /**
   * Re‑usable render function for markdown blocks (scrollable)
   */
  const renderMarkdown = (md: string) => (
      <div
          style={{
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            paddingRight: 10,
          }}
      >
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </div>
      </div>
  );

  return (
      <Drawer
          opened={props.isOpen}
          onClose={props.onClose}
          title="Анализ текста"
          padding="md"
          size="lg"
          position="right"
      >
        <Tabs value={activeTab} onChange={setActiveTab} defaultValue="analysis">
          <Tabs.List mb="md">
            <Tabs.Tab value="analysis">Литературный анализ</Tabs.Tab>
            <Tabs.Tab value="problems">Анализ литературных проблем</Tabs.Tab>
          </Tabs.List>

          {/* Tab 1 – Literary analysis */}
          <Tabs.Panel value="analysis">
            <div style={{ position: 'relative', minHeight: 200 }}>
              <LoadingOverlay visible={loadingAnalysis} overlayProps={{ blur: 2 }} />

              <Button onClick={handleGenerateAnalysis} disabled={loadingAnalysis} mb="md">
                Провести анализ
              </Button>

              {analysisMarkdown ? (
                  renderMarkdown(analysisMarkdown)
              ) : (
                  !loadingAnalysis && (
                      <Text c="dimmed" ta="center">
                        Анализ ещё не проведен.
                      </Text>
                  )
              )}
            </div>
          </Tabs.Panel>

          {/* Tab 2 – Problems search */}
          <Tabs.Panel value="problems">
            <div style={{ position: 'relative', minHeight: 200 }}>
              <LoadingOverlay visible={loadingProblems} overlayProps={{ blur: 2 }} />

              <Button onClick={handleGenerateProblems} disabled={loadingProblems} mb="md">
                Провести анализ
              </Button>

              {problemsMarkdown ? (
                  renderMarkdown(problemsMarkdown)
              ) : (
                  !loadingProblems && (
                      <Text c="dimmed" ta="center">
                        Анализ проблем ещё не выполнен.
                      </Text>
                  )
              )}
            </div>
          </Tabs.Panel>
        </Tabs>
      </Drawer>
  );
};

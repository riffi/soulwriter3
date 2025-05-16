// SceneRichTextEditor.tsx
import {RichTextEditor} from '@mantine/tiptap';
import '@mantine/tiptap/styles.css';

import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import './editor.override.css'
import {EditorToolBar} from "@/components/shared/RichEditor/toolbar/EditorToolBar";
import {LoadingOverlay} from "@/components/shared/overlay/LoadingOverlay";
import {CheckRepeatsButton} from "@/components/shared/RichEditor/toolbar/CheckRepeatsButton";
import {CheckClichesButton} from "@/components/shared/RichEditor/toolbar/CheckClishesButton";
import {
  IWarningGroup,
} from "@/components/shared/RichEditor/types";
import {useWarningGroups} from "@/components/shared/RichEditor/hooks/useWarningGroups";
import {useEditorState} from "@/components/shared/RichEditor/hooks/useEditorState";
import {Button, Drawer} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {CheckSynonymsButton} from "@/components/shared/RichEditor/toolbar/CheckSynonymsButton";
import {CheckParaphraseButton} from "@/components/shared/RichEditor/toolbar/CheckParaphraseButton";
import {IconCheck} from "@tabler/icons-react";
import {CheckSimplifyButton} from "@/components/shared/RichEditor/toolbar/CheckSimplifyButton";
import {CheckSpellingButton} from "@/components/shared/RichEditor/toolbar/CheckSpellingButton";
import {CheckRhymesButton} from "@/components/shared/RichEditor/toolbar/CheckRhymesButton";
import {useState} from "react";


export interface IRichEditorConstraints {
  top: number;
  bottom: number;
}
export interface ISceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (contentHtml: string, contentText: string) => void;
  onWarningsChange?: (warningGroups: IWarningGroup[]) => void;
  selectedGroup?: IWarningGroup;
  onScroll?: (scrollTop: number) => void;
  mobileConstraints?: IRichEditorConstraints
  desktopConstraints?: IRichEditorConstraints
  setSelectedGroup?: (group: IWarningGroup | undefined) => void
}

const TOOLBAR_HEIGHT = 40;
export const RichEditor = (props: ISceneRichTextEditorProps) => {

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ""
  });

  const mobileConstraints = props.mobileConstraints || {top: 50, bottom: 100};
  const desktopConstraints = props.desktopConstraints || {top: 0, bottom: 0};

  const [scrollTop, setScrollTop] = useState(0);

  const [isDrawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] =  useState<'synonyms' | 'paraphrase' | 'simplify' | 'spelling' | 'rhymes'>('synonyms');
  const [selectedText, setSelectedText] = useState('');
  const { isMobile } = useMedia();

  const onSelectionChange = (from: number, to: number) =>{
    setSelectedText(editor.state.doc.textBetween(from, to, " "));
  }

  const { editor } = useEditorState(props.initialContent || '', props.onContentChange, onSelectionChange);
  const warningGroups = useWarningGroups(editor, props.selectedGroup, props.onWarningsChange, props.setSelectedGroup);


  // Обработчик прокрутки
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    props.onScroll?.(event.target.scrollTop)
    setScrollTop(event.target.scrollTop)
  }



  return (
  <>
    <LoadingOverlay
        visible={loadingState.isLoading}
        message={loadingState.message}
    />
    <RichTextEditor
          editor={editor}
          variant="subtle"
          style={isMobile ? {
            position: "fixed",
            zIndex:95,
            top: mobileConstraints.top + TOOLBAR_HEIGHT,
            bottom: mobileConstraints.bottom,
            overflow: "scroll",
            left: 0,
            backgroundColor: "white",
            width: "100%"
          } : {}}
          onScroll={handleScroll}
      >
        <EditorToolBar editor={editor} mobileTop={mobileConstraints?.top} desktopTop={desktopConstraints?.top}>
          <CheckRepeatsButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({
                    isLoading,
                    message: message || ""
                  })
              }
          />
          <CheckClichesButton editor={editor}
                              onLoadingChange={(isLoading, message) =>
                                  setLoadingState({
                                    isLoading,
                                    message: message || ""
                                  })
                              }
          />
          <CheckSynonymsButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({ isLoading, message: message || "" })
              }
              onSynonymsFound={(synonyms) => {
                setSuggestions(synonyms);
                setSuggestionType('synonyms');
                openDrawer();
              }}
          />
          <CheckParaphraseButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({ isLoading, message: message || "" })
              }
              onParaphrasesFound={(paraphrases) => {
                if (!paraphrases || paraphrases.length === 0) return
                setSuggestions(paraphrases);
                setSuggestionType('paraphrase');
                openDrawer();
              }}
          />
          <CheckSimplifyButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({ isLoading, message: message || "" })
              }
              onSimplificationsFound={(simplifications) => {
                if (!simplifications || simplifications.length === 0) return;
                setSuggestions(simplifications);
                setSuggestionType('simplify');
                openDrawer();
              }}
          />
          <CheckSpellingButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({ isLoading, message: message || "" })
              }
              onCorrectionFound={(correction) => {
                if (!correction) return;
                setSuggestions([correction]);
                setSuggestionType('spelling');
                openDrawer();
              }}
              checkKind={'yandex-speller'}
          />
          <CheckRhymesButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({ isLoading, message: message || "" })
              }
              onRhymesFound={(rhymes) => {
                setSuggestions(rhymes);
                setSuggestionType('rhymes');
                openDrawer();
              }}
          />
        </EditorToolBar>
        <RichTextEditor.Content />
      </RichTextEditor>
    <Drawer
        opened={isDrawerOpened}
        onClose={closeDrawer}
        title={suggestionType === 'spelling'
            ? "Исправленный текст"
            : suggestionType === 'synonyms'
                ? "Найденные синонимы"
                : suggestionType === 'paraphrase'
                    ? "Варианты перефразирования"
                    : suggestionType === 'rhymes' // Добавляем условие для рифм
                        ? "Найденные рифмы"
                        : "Упрощенные варианты"}
        position="right"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selectedText && (
            <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color:"gray", marginBottom: 4 }}>
                Оригинальный текст:
              </div>
            <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' }}> {selectedText} </div> </div>
        )}
        {suggestions?.map((suggestion) => (
            <div
                key={suggestion}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8
                }}
            >
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flexGrow: 1,
          fontFamily: 'inherit'
        }}>
          {suggestion}
        </pre>
              <Button
                  variant="subtle"
                  size="xs"
                  p={4}
                  style={{
                    width: 120, // Фиксированная ширина
                    height: 32, // Фиксированная высота
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                  onClick={() => {
                    editor?.chain().insertContent(suggestion).run();
                    closeDrawer();
                  }}
              >
                <IconCheck size={18} />
              </Button>
            </div>
        ))}
      </div>
    </Drawer>
  </>
  );
};

// SceneRichTextEditor.tsx
import { RichTextEditor, Link as TipTapLink } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import {useEffect, useCallback, useState} from "react";
import RepeatedWordsHighlighter2 from "./RepeatedWordsHighlighter2";
import '@mantine/tiptap/styles.css';
import { debounce } from 'lodash';
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import './editor.override.css'
import {EditorToolBar} from "@/components/scenes/SceneEditor/editor/toolbar/EditorToolBar";
import {
  RepeatHighlighterExtension
} from "@/components/scenes/SceneEditor/editor/plugins/RepeatHighlighterExtension";
import {LoadingOverlay} from "@/components/shared/overlay/LoadingOverlay";
import {
  CheckRepeatsButton
} from "@/components/scenes/SceneEditor/editor/toolbar/CheckRepeatsButton";
import SimpleTextChecker
  from "@/components/scenes/SceneEditor/editor/SimpleTextChecker";

interface SceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export const SceneRichTextEditor = ({ initialContent, onContentChange }: SceneRichTextEditorProps) => {

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ""
  });

  const { isMobile} = useMedia();
  const [localContent, setLocalContent] = useState(initialContent || '');

  // Создаем debounce-версию обработчика изменений
  const debouncedContentChange = useCallback(
      debounce((content: string) => {
        if (onContentChange) {
          onContentChange(content);
        }
      }, 600),
      [onContentChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Superscript,
      SubScript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
      //Highlight,
      SimpleTextChecker,
      RepeatHighlighterExtension,
    ],
    content: localContent || '',
    onUpdate: ({ editor }) => {
      // Используем debounce-обработчик вместо прямого вызова
      debouncedContentChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== initialContent) {
        // Сохраняем позицию курсора
        const { from, to } = editor.state.selection;
        editor.commands.setContent(initialContent);
        // Восстанавливаем позицию курсора
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [initialContent]);

  // Очищаем debounce-таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      debouncedContentChange.cancel();
    };
  }, [debouncedContentChange]);




  return (
  <>
    <LoadingOverlay
        visible={loadingState.isLoading}
        message={loadingState.message}
    />
      <RichTextEditor
          editor={editor}
          variant="subtle"

      >
        <EditorToolBar editor={editor}>
          <CheckRepeatsButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({
                    isLoading,
                    message: message || ""
                  })
              }
          />
        </EditorToolBar>
        <RichTextEditor.Content />
      </RichTextEditor>

  </>
  );
};

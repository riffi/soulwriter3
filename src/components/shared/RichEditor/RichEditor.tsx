// SceneRichTextEditor.tsx
import {RichTextEditor} from '@mantine/tiptap';
import {useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import {useCallback, useEffect, useState} from "react";
import '@mantine/tiptap/styles.css';
import {debounce} from 'lodash';
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import './editor.override.css'
import {EditorToolBar} from "@/components/shared/RichEditor/toolbar/EditorToolBar";
import {
  RepeatHighlighterExtension,
  repeatHighlighterKey
} from "@/components/shared/RichEditor/plugins/RepeatHighlighterExtension";
import {LoadingOverlay} from "@/components/shared/overlay/LoadingOverlay";
import {CheckRepeatsButton} from "@/components/shared/RichEditor/toolbar/CheckRepeatsButton";
import SimpleTextChecker from "@/components/shared/RichEditor/plugins/SimpleTextChecker";
import {
  ClicheHighlighterExtension,
  clicheHighlighterKey
} from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";
import {CheckClichesButton} from "@/components/shared/RichEditor/toolbar/CheckClishesButton";
import {
  IWarning,
  IWarningContainer,
  IWarningGroup,
  IWarningKind,
} from "@/components/shared/RichEditor/types";

interface SceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (contentHtml: string, contentText: string) => void;
  onWarningsChange?: (warnings: IWarningsContainer[]) => void;
  selectedWarning?: IWarning;
}

export const RichEditor = ({ initialContent, onContentChange, onWarningsChange, selectedWarning}: SceneRichTextEditorProps) => {

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ""
  });

  const { isMobile} = useMedia();
  const [localContent, setLocalContent] = useState(initialContent || '');

  // Создаем debounce-версию обработчика изменений
  const debouncedContentChange = useCallback(
      debounce((contentHTML: string, contentText: string) => {
        if (onContentChange) {
          onContentChange(contentHTML, contentText);
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
      ClicheHighlighterExtension,
    ],
    content: localContent || '',
    onUpdate: ({ editor }) => {
      // Используем debounce-обработчик вместо прямого вызова
      debouncedContentChange(editor.getHTML(), editor.getText())
    },
  });


  useEffect(() => {
    if (!editor || !onWarningsChange) return;

    const groupWarnings = (warnings: IWarning[], warningKind: IWarningKind): IWarningGroup[] => {
      const groupsMap = warnings.reduce((acc, warning) => {
        const groupIndex = warning.groupIndex;
        if (!acc[groupIndex]) {
          acc[groupIndex] = { groupIndex, warnings: [], warningKind };
        }
        acc[groupIndex].warnings.push(warning);
        return acc;
      }, {} as Record<string, IWarningGroup>);

      return Object.values(groupsMap);
    };

    const updateWarnings = () => {
      const warningContainers: IWarningContainer[] = [];

      // Обработка штампов (CLICHE)
      const clichePluginState = clicheHighlighterKey.getState(editor.state);
      const clicheGroups = groupWarnings(clichePluginState?.warnings || [],
          IWarningKind.CLICHE);
      if (clicheGroups.length > 0) {
        warningContainers.push({
          warningKind: IWarningKind.CLICHE,
          warningGroups: clicheGroups,
        });
      }

      // Обработка повторов (REPEAT)
      const repeatPluginState = repeatHighlighterKey.getState(editor.state);
      const repeatGroups = groupWarnings(repeatPluginState?.warnings || [],
        IWarningKind.REPEAT)
      if (repeatGroups.length > 0) {
        warningContainers.push({
          warningKind: IWarningKind.REPEAT,
          warningGroups: repeatGroups,
        });
      }

      onWarningsChange(warningContainers);
    };

    editor.on('transaction', updateWarnings);
    return () => editor.off('transaction', updateWarnings);
  }, [editor, onWarningsChange]);



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

  useEffect(() => {
    if (selectedWarning){
      console.log(selectedWarning)
      editor?.commands.focus();
      editor.commands.setTextSelection({
        from: selectedWarning.from,
        to: selectedWarning.to
      });
    }
  },[selectedWarning])

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
          <CheckClichesButton editor={editor}
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

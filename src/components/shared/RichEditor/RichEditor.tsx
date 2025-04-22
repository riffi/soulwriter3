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
import {useCallback, useEffect, useRef, useState} from "react";
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
  IWarningGroup,
  IWarningKind,
} from "@/components/shared/RichEditor/types";



interface SceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (contentHtml: string, contentText: string) => void;
  onWarningsChange?: (warningGroups: IWarningGroup[]) => void;
  selectedGroup?: IWarningGroup;
  onScroll?: (scrollTop: number) => void;
}

export const RichEditor = ({ initialContent, onContentChange, onWarningsChange, selectedGroup, onScroll}: SceneRichTextEditorProps) => {

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ""
  });

  const [localContent, setLocalContent] = useState(initialContent || '');
  const [scrollTop, setScrollTop] = useState(0);
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);

  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  const debouncedContentChange = useCallback(
      debounce((contentHTML: string, contentText: string) => {
        onContentChangeRef.current?.(contentHTML, contentText);
      }, 600),
      [] // Зависимости пусты, функция создаётся единожды
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
    onBlur: ({ editor }) => {
      editor.setEditable(false)
    },
    onTransaction: ({ editor, transaction }) => {
      if (transaction.meta?.pointer) {
        editor.setEditable(true)
      }
    }
  });


  useEffect(() => {
    if (!editor || !onWarningsChange) return;

    const updateWarnings = () => {
      const warningGroups: IWarningGroup[] = [];

      // Обработка штампов (CLICHE)
      const clichePluginState = clicheHighlighterKey.getState(editor.state);
      const clicheGroups = clichePluginState?.warningGroups || []
      if (clicheGroups.length > 0) {
        warningGroups.push(...clicheGroups)
      }

      // Обработка повторов (REPEAT)
      const repeatPluginState = repeatHighlighterKey.getState(editor.state);
      const repeatGroups = repeatPluginState?.warningGroups || []
      if (repeatGroups.length > 0) {
        warningGroups.push(...repeatGroups)
      }
      setWarningGroups(warningGroups)
      onWarningsChange(warningGroups);
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
    if (selectedGroup){
      let key = repeatHighlighterKey
      if (selectedGroup.warningKind === IWarningKind.CLICHE){
        key = clicheHighlighterKey
      }

      editor?.commands.focus();
      editor?.view.dispatch(
          editor?.view.state.tr
          .setMeta(key, {
            action: "ACTIVATE_GROUP",
            groupIndex: selectedGroup.groupIndex
          })
      );
      editor.commands.setTextSelection({
        from: selectedGroup.warnings[0].from,
        to: selectedGroup.warnings[0].to
      });
    }
  },[selectedGroup])

  // Очищаем debounce-таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      debouncedContentChange.cancel();
    };
  }, [debouncedContentChange]);


  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(event.target.scrollTop)
    setScrollTop(event.target.scrollTop)
  }

  function getEditorHeight(scrollTop: number, warningGroups: IWarningGroup[]) {
    let baseOffset = 200
    if (scrollTop > 50){
      baseOffset -= 50
    }
    if (warningGroups.length > 0){
      baseOffset += 50
    }
    return `calc(100vh - ${baseOffset}px)`
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
          style={{
            overflow: "scroll",
            maxHeight: getEditorHeight(scrollTop, warningGroups)
          }}
          onScroll={handleScroll}

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

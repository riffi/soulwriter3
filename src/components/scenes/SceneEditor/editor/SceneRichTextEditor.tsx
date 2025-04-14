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
import { useEffect, useCallback } from "react";
import RepeatedWordsHighlighter2 from "./RepeatedWordsHighlighter2";
import '@mantine/tiptap/styles.css';
import { debounce } from 'lodash';
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import './editor.override.css'
interface SceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export const SceneRichTextEditor = ({ initialContent, onContentChange }: SceneRichTextEditorProps) => {

  const { isMobile} = useMedia();

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
      RepeatedWordsHighlighter2
    ],
    content: initialContent || '',
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
      <RichTextEditor
          editor={editor}
          variant="subtle"
          styles={{
            root: {
              border: isMobile ? 'none' : undefined,
              borderRadius: isMobile ? 0 : undefined,
            },
            content: {
              padding: isMobile ? 0 : undefined,
              minHeight: isMobile ? '30vh' : undefined,
              '& .ProseMirror': {
                padding: isMobile ? '0 !important' : undefined,
              }
            },
            toolbar: {
              padding: isMobile ? '0px 0px' : undefined,
              flexWrap: isMobile ? 'wrap' : undefined,
            }
          }}
      >
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.ClearFormatting />
            {!isMobile &&
                <>
                  <RichTextEditor.Strikethrough />
                  <RichTextEditor.Highlight />
                </>
            }
          </RichTextEditor.ControlsGroup>

          {!isMobile &&
          <>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.ColorPicker
                  colors={[
                    '#25262b',
                    '#868e96',
                    '#fa5252',
                    '#e64980',
                    '#be4bdb',
                    '#7950f2',
                    '#4c6ef5',
                    '#228be6',
                    '#15aabf',
                    '#12b886',
                    '#40c057',
                    '#82c91e',
                    '#fab005',
                    '#fd7e14',
                  ]}
              />
              <RichTextEditor.Color color="#F03E3E" />
              <RichTextEditor.Color color="#7048E8" />
              <RichTextEditor.Color color="#1098AD" />
              <RichTextEditor.Color color="#37B24D" />
              <RichTextEditor.Color color="#F59F00" />
            </RichTextEditor.ControlsGroup>
          </>}
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
      </RichTextEditor>
  );
};

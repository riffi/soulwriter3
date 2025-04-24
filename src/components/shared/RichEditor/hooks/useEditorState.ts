import {useCallback, useEffect, useRef, useState} from "react";
import {debounce} from "lodash";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import SimpleTextChecker from "@/components/shared/RichEditor/plugins/SimpleTextChecker";
import {
  RepeatHighlighterExtension
} from "@/components/shared/RichEditor/plugins/RepeatHighlighterExtension";
import {
  ClicheHighlighterExtension
} from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";

// Функция получения расширений для редактора
const getEditorExtensions = () => [
  StarterKit,
  Underline,
  Superscript,
  SubScript,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Color,
  TextStyle,
  SimpleTextChecker,
  RepeatHighlighterExtension,
  ClicheHighlighterExtension,
];

// Функция создания конфигурации редактора
const createEditorConfig = (content: string, onUpdate: (editor: Editor) => void) => ({
  extensions: getEditorExtensions(),
  content,
  onUpdate: ({ editor }) => onUpdate(editor),
  onBlur: ({ editor }) => editor.setEditable(false),
  onTransaction: ({ editor, transaction }) => {
    if (transaction.meta?.pointer) {
      editor.setEditable(true);
      editor.commands.focus();
    }
  }
});

// Хук для управления состоянием редактора
export const useEditorState = (initialContent: string, onContentChange?: (contentHtml: string, contentText: string) => void) => {
  const [localContent, setLocalContent] = useState(initialContent || '');
  const onContentChangeRef = useRef(onContentChange);

  const debouncedContentChange = useCallback(
      debounce((html: string, text: string) => onContentChangeRef.current?.(html, text), 600),
      []
  );

  const editor = useEditor(createEditorConfig(localContent, editor => {
    debouncedContentChange(editor.getHTML(), editor.getText());
  }));

  useEffect(() => () => debouncedContentChange.cancel(), []);

  // Когда изменяется контент, обновляем его в состоянии и обновляем выделение
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

  return { editor, localContent, setLocalContent };
};

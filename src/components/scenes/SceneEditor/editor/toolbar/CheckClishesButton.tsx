// CheckClichesButton.tsx
import { RichTextEditor } from "@mantine/tiptap";
import { useState } from "react";
import { PluginKey } from "prosemirror-state";
import { IconClipboardCheck } from "@tabler/icons-react";
import {
  clicheHighlighterKey
} from "@/components/scenes/SceneEditor/editor/plugins/ClisheGightligherExtension";

interface CheckClichesButtonProps {
  editor: any;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
}

export const CheckClichesButton = ({ editor, onLoadingChange }: CheckClichesButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckCliches = async () => {
    if (isActive) {
      clearHighlights();
      setIsActive(false);
      return;
    }

    onLoadingChange(true, "Поиск фраз-штампов...");
    setIsLoading(true);
    try {
      const text = editor.getText();
      const cliches = await fetchCliches(text);
      updateHighlights(cliches);
      setIsActive(true);
    } catch (error) {
      console.error('Error checking cliches:', error);
    } finally {
      onLoadingChange(false);
      setIsLoading(false);
    }
  };

  const fetchCliches = async (text: string) => {
    const response = await fetch('http://localhost:5000/analyze_cliches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer 4f5d6e7a8b9c0d1e2f3a4b5c6d7e8f9a'
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    return data.data.map(cliche => ({
      from: cliche.start + 1,
      to: cliche.end + 1,
      pattern: cliche.pattern,
      text: cliche.text
    }));
  };

  const updateHighlights = (cliches) => {
    const tr = editor.state.tr;
    tr.setMeta(clicheHighlighterKey, {
      action: "UPDATE_DECORATIONS",
      cliches
    });
    editor.view.dispatch(tr);
  };

  const clearHighlights = () => {
    updateHighlights([]);
  };

  return (
      <RichTextEditor.Control
          onClick={handleCheckCliches}
          icon={<IconClipboardCheck/>}
          title="Проверить штампы"
          aria-pressed={isActive}
          disabled={isLoading}
          style={{
            backgroundColor: isActive ? '#e9ecef' : 'transparent',
            color: isActive ? '#228be6' : 'inherit',
            border: isActive ? '1px solid #ced4da' : '1px solid transparent',
          }}
      >
        {isLoading ? 'Поиск...' : 'Штампы'}
      </RichTextEditor.Control>
  );
};

// CheckClichesButton.tsx
import { RichTextEditor } from "@mantine/tiptap";
import { useState } from "react";
import { PluginKey } from "prosemirror-state";
import { IconClipboardCheck } from "@tabler/icons-react";
import {
  clicheHighlighterKey
} from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";
import {IClicheWarning, IWarningKind} from "@/components/shared/RichEditor/types";

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
      const cliches = await fetchWarnings(text);
      updateHighlights(cliches);
      setIsActive(true);
    } catch (error) {
      console.error('Error checking cliches:', error);
    } finally {
      onLoadingChange(false);
      setIsLoading(false);
    }
  };

  const fetchWarnings = async (text: string):Promise<IClicheWarning[]> => {
    const response = await fetch('http://62.109.2.159:5123/analyze_cliches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer 4f5d6e7a8b9c0d1e2f3a4b5c6d7e8f9a'
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    return data.data.map(warning => ({
      from: warning.start + 1,
      to: warning.end + 1,
      pattern: warning.pattern,
      text: warning.text,
      kind: IWarningKind.CLICHE
    }));
  };

  const updateHighlights = (warnings) => {
    const tr = editor.state.tr;
    tr.setMeta(clicheHighlighterKey, {
      action: "UPDATE_DECORATIONS",
      warnings
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
            padding: '6px 12px'
          }}
      >
        {isLoading ? 'Поиск...' : 'Штампы'}
      </RichTextEditor.Control>
  );
};

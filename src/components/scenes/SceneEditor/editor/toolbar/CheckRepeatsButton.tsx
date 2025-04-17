import { RichTextEditor } from "@mantine/tiptap";
import { useState } from "react";
import { PluginKey } from "prosemirror-state";
import {
  RepeatHighlighterExtension, repeatHighlighterKey
} from "@/components/scenes/SceneEditor/editor/plugins/RepeatHighlighterExtension";

interface CheckRepeatsButtonProps {
  editor: any;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
}

export const CheckRepeatsButton = ({ editor, onLoadingChange }: CheckRepeatsButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckRepeats = async () => {
    if (isActive) {
      clearHighlights();
      setIsActive(false);
      return;
    }

    onLoadingChange(true, "Анализ текста на повторения...");
    setIsLoading(true);
    try {
      const text = editor.getText();
      const repeats = await fetchRepeats(text);
      updateHighlights(repeats);
      setIsActive(true);
    } catch (error) {
      console.error('Error checking repeats:', error);
    } finally {
      onLoadingChange(false);
      setIsLoading(false);
    }
  };

  const fetchRepeats = async (text: string) => {
    const response = await fetch('http://62.109.2.159:5123/find_repeats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer 4f5d6e7a8b9c0d1e2f3a4b5c6d7e8f9a'
      },
      body: JSON.stringify({
        text,
        window_size: 10,
        window_size_tech_words: 1
      })
    });

    const data = await response.json();
    return data.repeatData.flatMap((group, index) =>
        group.repeats.map(repeat => ({
          from: repeat.startPosition + 1,
          to: repeat.endPosition + 2,
          groupIndex: String(index),
          word: repeat.word
        }))
    );
  };

  const updateHighlights = (repeats) => {
    const tr = editor.state.tr;
    tr.setMeta(repeatHighlighterKey, { // Используем pluginKey вместо строки
      action: "UPDATE_DECORATIONS",
      repeats
    });
    editor.view.dispatch(tr);
  };

  const clearHighlights = () => {
    updateHighlights([]);
  };

  return (
      <RichTextEditor.Control
          onClick={handleCheckRepeats}
          title="Проверить повторения"
          aria-pressed={isActive}
          disabled={isLoading}
          style={{
            backgroundColor: isActive ? '#e9ecef' : 'transparent',
            color: isActive ? '#228be6' : 'inherit',
            border: isActive ? '1px solid #ced4da' : '1px solid transparent',
          }}
      >
        {isLoading ? 'Обработка...' : 'Повторения'}
      </RichTextEditor.Control>
  );
};

// CheckClichesButton.tsx
import { RichTextEditor } from "@mantine/tiptap";
import { useState } from "react";
import { PluginKey } from "prosemirror-state";
import {IconClipboardCheck, IconHandStop, IconLayersLinked} from "@tabler/icons-react";
import {
  clicheHighlighterKey
} from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";
import {IClicheWarning, IWarningGroup, IWarningKind} from "@/components/shared/RichEditor/types";
import {generateUUID} from "@/utils/UUIDUtils";
import {ActionIcon} from "@mantine/core";

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

  const fetchWarnings = async (text: string):Promise<IWarningGroup[]> => {
    const response = await fetch('http://62.109.2.159:5123/analyze_cliches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer 4f5d6e7a8b9c0d1e2f3a4b5c6d7e8f9a'
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    const groups: IWarningGroup[] = [];
    data.data.forEach((warning: IClicheWarning, index: number) => {
      const group: IWarningGroup = {
        groupIndex: String(index),
        warningKind: IWarningKind.CLICHE,
        warnings: [{
          id: generateUUID(),
          from: warning.start + 1,
          to: warning.end + 1,
          groupIndex: String(index),
          text: warning.text,
          kind: IWarningKind.CLICHE,
          active: false
        }]
      }
      groups.push(group);
    })
    return groups
  };

  const updateHighlights = (warningGroups: IWarningGroup[]) => {
    const tr = editor.state.tr;
    tr.setMeta(clicheHighlighterKey, {
      action: "UPDATE_DECORATIONS",
      warningGroups
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
      >
          <IconHandStop
              size={20}
              color={"gray"}
          />
      </RichTextEditor.Control>
  );
};

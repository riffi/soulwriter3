// useWarningGroups.ts
import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import {IWarningGroup, IWarningKind} from "@/components/shared/RichEditor/types";
import { clicheHighlighterKey } from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";
import {
  repeatHighlighterKey
} from "@/components/shared/RichEditor/plugins/RepeatHighlighterExtension";

// Хук обновления данных о замечаниях при изменении состояния редактора
export const useWarningGroups = (
    editor: Editor | null,
    selectedGroup?: IWarningGroup,
    onWarningsChange?: (warningGroups: IWarningGroup[]) => void
) => {
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);

useEffect(() => {
  if (!editor || !onWarningsChange) return;

  const updateWarnings = () => {
    const clicheGroups = clicheHighlighterKey.getState(editor.state)?.warningGroups || [];
    const repeatGroups = repeatHighlighterKey.getState(editor.state)?.warningGroups || [];

    const newWarningGroups = [...clicheGroups, ...repeatGroups];
    setWarningGroups(newWarningGroups);
    onWarningsChange(newWarningGroups);
  };

  editor.on("transaction", updateWarnings);
  return () => editor.off("transaction", updateWarnings);
}, [editor, onWarningsChange]);




useEffect(() => {
  if (selectedGroup) {
    const key = selectedGroup.warningKind ===
      IWarningKind.CLICHE ? clicheHighlighterKey : repeatHighlighterKey;

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
    editor.commands.focus();
    editor?.commands.scrollIntoView();
  }
}, [selectedGroup]);

  return warningGroups;
};

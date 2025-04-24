// useWarningGroups.ts
import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import {IWarningGroup, IWarningKind} from "@/components/shared/RichEditor/types";
import { clicheHighlighterKey } from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";
import {
  repeatHighlighterKey
} from "@/components/shared/RichEditor/plugins/RepeatHighlighterExtension";

export const useWarningGroups = (
    editor: Editor | null,
    selectedGroup?: IWarningGroup,
    onWarningsChange?: (warningGroups: IWarningGroup[]) => void
) => {
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);

  useEffect(() => {
    if (!editor || !onWarningsChange) return;

    const updateWarnings = () => {
      const newWarningGroups: IWarningGroup[] = [];

      // Обработка штампов (CLICHE)
      const clichePluginState = clicheHighlighterKey.getState(editor.state);
      const clicheGroups = clichePluginState?.warningGroups || [];
      if (clicheGroups.length > 0) {
        newWarningGroups.push(...clicheGroups);
      }

      // Обработка повторов (REPEAT)
      const repeatPluginState = repeatHighlighterKey.getState(editor.state);
      const repeatGroups = repeatPluginState?.warningGroups || [];
      if (repeatGroups.length > 0) {
        newWarningGroups.push(...repeatGroups);
      }

      setWarningGroups(newWarningGroups);
      onWarningsChange(newWarningGroups);
    };

    editor.on("transaction", updateWarnings);
    return () => editor.off("transaction", updateWarnings);
  }, [editor, onWarningsChange]);

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
      editor.commands.focus();
      editor?.commands.scrollIntoView()
    }
  },[selectedGroup])

  return warningGroups;
};

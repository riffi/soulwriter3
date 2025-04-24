// useWarningGroups.ts
import {useEffect, useRef, useState} from "react";
import { Editor } from "@tiptap/react";
import {IWarningGroup, IWarningKind} from "@/components/shared/RichEditor/types";
import { clicheHighlighterKey } from "@/components/shared/RichEditor/plugins/ClisheHightligherExtension";
import {
  repeatHighlighterKey
} from "@/components/shared/RichEditor/plugins/RepeatHighlighterExtension";
import { Transaction } from "prosemirror-state";

// Хук обновления данных о замечаниях при изменении состояния редактора
export const useWarningGroups = (
    editor: Editor | null,
    selectedGroup?: IWarningGroup,
    onWarningsChange?: (warningGroups: IWarningGroup[]) => void,
    setSelectedGroup?: (group: IWarningGroup | undefined) => void
) => {
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);
  const internalUpdate = useRef(false); // Флаг для отслеживания внутренних изменений

  useEffect(() => {
    if (!editor || !onWarningsChange) return;
    const updateWarnings = ({editor, transaction: tr}) => {
      const clicheMeta = tr.getMeta(clicheHighlighterKey);
      const repeatMeta = tr.getMeta(repeatHighlighterKey);
      const meta = clicheMeta || repeatMeta;
      if (meta?.action === "UPDATE_DECORATIONS"){
        const clicheGroups = clicheHighlighterKey.getState(editor.state)?.warningGroups || [];
        const repeatGroups = repeatHighlighterKey.getState(editor.state)?.warningGroups || [];

        const newWarningGroups = [...clicheGroups, ...repeatGroups];
        setWarningGroups(newWarningGroups);
        onWarningsChange(newWarningGroups);
      }
    };

    editor.on("transaction", updateWarnings);
    return () => editor.off("transaction", updateWarnings);
  }, [editor, onWarningsChange]);

  // Обработчик изменений из плагинов
  useEffect(() => {
    if (!editor || !setSelectedGroup) return;

    const handlePluginUpdate = ({editor, transaction: tr}) => {
      const clicheMeta = tr.getMeta(clicheHighlighterKey);
      const repeatMeta = tr.getMeta(repeatHighlighterKey);
      const meta = clicheMeta || repeatMeta;

      if (meta?.action === 'ACTIVATE_GROUP' && !internalUpdate.current) {
        internalUpdate.current = true; // Блокируем обратную связь

        const groups = [
          ...(clicheHighlighterKey.getState(editor.state)?.warningGroups || []),
          ...(repeatHighlighterKey.getState(editor.state)?.warningGroups || [])
        ];

        const group = groups.find(g =>
            g.groupIndex === meta.groupIndex
        );

        if (group) setSelectedGroup(group);

        setTimeout(() => {
          internalUpdate.current = false; // Снимаем блок через микротаск
        }, 0);
      }
    };

    editor.on('transaction', handlePluginUpdate);
    return () => editor.off('transaction', handlePluginUpdate);
  }, [editor, setSelectedGroup]);



  // Обработчик изменений из панели
  useEffect(() => {
    if (!editor || internalUpdate.current) return;

    if (selectedGroup) {
      internalUpdate.current = true; // Блокируем обратную связь

      const key = selectedGroup.warningKind === IWarningKind.CLICHE
          ? clicheHighlighterKey
          : repeatHighlighterKey;

      editor.view.dispatch(
          editor.state.tr.setMeta(key, {
            action: "ACTIVATE_GROUP",
            groupIndex: selectedGroup.groupIndex
          })
      );
      editor?.setEditable(true);
      editor?.commands.focus();
      editor?.commands.setTextSelection(
          selectedGroup.warnings[0].from,
      );
      editor?.commands.scrollIntoView();
      editor?.setEditable(false);

      setTimeout(() => {
        internalUpdate.current = false; // Снимаем блок
      }, 0);
    }
  }, [selectedGroup]);

  return warningGroups;
};

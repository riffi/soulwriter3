import {ActionIcon, Button, useMantineTheme} from "@mantine/core";
import {IconClipboardCheck, IconEyeTable, IconLayersLinked} from "@tabler/icons-react";
import {useEditor} from "@tiptap/react";
import {useState} from "react";
import {OpenRouterApi} from "@/api/openRouterApi";
import { RichTextEditor } from "@mantine/tiptap";
import {notifications} from "@mantine/notifications";

interface CheckParaphraseButtonProps {
  editor: ReturnType<typeof useEditor>;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
  onParaphrasesFound: (paraphrases: string[]) => void;
}

export const CheckParaphraseButton = ({
                                        editor,
                                        onLoadingChange,
                                        onParaphrasesFound
                                      }: CheckParaphraseButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useMantineTheme();

  const handleClick = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (!selectedText.trim()) {
      notifications.show({
        message: "Выделите текст для перефразирования",
        color: 'orange',
      })
      return;
    }

    try {
      setIsLoading(true);
      onLoadingChange(true, "Генерируем варианты...");
      const paraphrases = await OpenRouterApi.fetchParaphrases(selectedText);
      onParaphrasesFound(paraphrases);
    } catch (error) {
      notifications.show({
        message: error.message,
        color: 'red',
      })
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  return (
      <RichTextEditor.Control
          onClick={handleClick}
          title="Перефразировать текст"
          disabled={isLoading}
      >
        <IconEyeTable
            size={20}
            color={"gray"}
        />
      </RichTextEditor.Control>
  );
};

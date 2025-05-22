import {ActionIcon, Button, useMantineTheme} from "@mantine/core";
import {IconClipboardCheck, IconLayersLinked} from "@tabler/icons-react";
import {useEditor} from "@tiptap/react";
import {useState} from "react";
import {OpenRouterApi} from "@/api/openRouterApi";
import { RichTextEditor } from "@mantine/tiptap";
import {notifications} from "@mantine/notifications";
interface CheckSynonymsButtonProps {
  editor: ReturnType<typeof useEditor>;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
  onSynonymsFound: (synonyms: string[]) => void;
}

export const CheckSynonymsButton = ({
                                      editor,
                                      onLoadingChange,
                                      onSynonymsFound
                                    }: CheckSynonymsButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useMantineTheme();

  const handleClick = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (selectedText.trim().split(/\s+/).length > 1) {
      notifications.show({
        message: "Выделите только одно слово",
        color: 'orange',
      })
      return;
    }

    try {
      setIsLoading(true);
      onLoadingChange(true, "Ищем синонимы...");
      const synonyms = await OpenRouterApi.fetchSynonyms(selectedText);
      onSynonymsFound(synonyms);
    } catch (error) {
      console.error("Error fetching synonyms:", error.message);
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
          title="Поиск синонимов"
          disabled={isLoading}
      >
          <IconLayersLinked
              size={20}
              color={"gray"}
          />
      </RichTextEditor.Control>
  );
};

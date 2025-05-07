import {ActionIcon, Button, useMantineTheme} from "@mantine/core";
import {IconPencil, IconLayersLinked} from "@tabler/icons-react";
import {useEditor} from "@tiptap/react";
import {useState} from "react";
import {OpenRouterApi} from "@/api/openRouterApi";
import { RichTextEditor } from "@mantine/tiptap";

interface CheckRhymesButtonProps {
  editor: ReturnType<typeof useEditor>;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
  onRhymesFound: (rhymes: string[]) => void;
}

export const CheckRhymesButton = ({
                                    editor,
                                    onLoadingChange,
                                    onRhymesFound
                                  }: CheckRhymesButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useMantineTheme();

  const handleClick = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (selectedText.trim().split(/\s+/).length > 1) {
      alert("Выделите только одно слово");
      return;
    }

    try {
      setIsLoading(true);
      onLoadingChange(true, "Ищем рифмы...");
      const rhymes = await OpenRouterApi.fetchRhymes(selectedText);
      onRhymesFound(rhymes);
    } catch (error) {
      console.error("Error fetching rhymes:", error);
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  return (
      <RichTextEditor.Control
          onClick={handleClick}
          title="Поиск рифм"
          disabled={isLoading}
      >
        <IconPencil
            size={20}
            color={"gray"}
        />
      </RichTextEditor.Control>
  );
};

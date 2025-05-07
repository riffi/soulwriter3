import {useEditor} from "@tiptap/react";
import {useState} from "react";
import {OpenRouterApi} from "@/api/openRouterApi";
import {RichTextEditor} from "@mantine/tiptap";
import {IconTextSpellcheck} from "@tabler/icons-react";

interface CheckSpellingButtonProps {
  editor: ReturnType<typeof useEditor>;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
  onCorrectionFound: (correction: string) => void;
}

export const CheckSpellingButton = ({
                                      editor,
                                      onLoadingChange,
                                      onCorrectionFound
                                    }: CheckSpellingButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const {from, to} = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (!selectedText.trim()) {
      alert("Выделите текст для проверки");
      return;
    }

    try {
      setIsLoading(true);
      onLoadingChange(true, "Проверяем орфографию...");
      const correction = await OpenRouterApi.fetchSpellingCorrection(selectedText);
      onCorrectionFound(correction);
    } catch (error) {
      console.error("Error fetching spelling correction:", error);
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  return (
      <RichTextEditor.Control
          onClick={handleClick}
          title="Проверить орфографию"
          disabled={isLoading}
      >
        <IconTextSpellcheck
            size={20}
            color={"gray"}
        />
      </RichTextEditor.Control>
  );
};

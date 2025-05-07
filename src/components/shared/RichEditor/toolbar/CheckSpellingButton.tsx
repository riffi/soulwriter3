import {useEditor} from "@tiptap/react";
import {useState} from "react";
import {OpenRouterApi} from "@/api/openRouterApi";
import {YandexSpellerApi} from "@/api/yandexSpellerApi";
import {RichTextEditor} from "@mantine/tiptap";
import {IconTextSpellcheck} from "@tabler/icons-react";

interface CheckSpellingButtonProps {
  editor: ReturnType<typeof useEditor>;
  onLoadingChange: (isLoading: boolean, message?: string) => void;
  onCorrectionFound: (correction: string) => void;
  checkKind?: 'openrouter' | 'yandex-speller'; // Новый пропс
}

const applyYandexCorrections = (originalText: string, corrections: any[]): string => {
  let text = originalText;
  let offset = 0;

  corrections.forEach((correction) => {
    if (correction.s && correction.s.length > 0) {
      const start = correction.pos + offset;
      const end = start + correction.len;
      const replacement = correction.s[0];

      text = text.slice(0, start) + replacement + text.slice(end);
      offset += replacement.length - correction.len;
    }
  });

  return text;
};

export const CheckSpellingButton = ({
                                      editor,
                                      onLoadingChange,
                                      onCorrectionFound,
                                      checkKind = 'openrouter' // Значение по умолчанию
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

      let correction;
      if (checkKind === 'yandex-speller') {
        const result = await YandexSpellerApi.fetchSpellingCorrection(selectedText);
        correction = applyYandexCorrections(selectedText, result);
      } else {
        correction = await OpenRouterApi.fetchSpellingCorrection(selectedText);
      }

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

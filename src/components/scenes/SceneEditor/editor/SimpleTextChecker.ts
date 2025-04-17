import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

// Все проверки пунктуации с регулярными выражениями и подсказками
const PUNCTUATION_CHECKS = [
  {
    name: "Множественные пробелы",
    regex: / {2,}/g,
    message: "Удалите лишние пробелы"
  },
  {
    name: "Пробел перед знаком препинания",
    regex: / (?=[.,:;?!])/g,
    message: "Уберите пробел перед знаком"
  },
  {
    name: "Пропущен пробел после знака",
    regex: /([.,:;?!])(?=[^\s.,:;?!])(?![»”"'])/g,
    message: "Добавьте пробел после знака"
  },
  {
    name: "Неправильные кавычки",
    regex: /(["'`])(.*?)\1/g,
    message: "Используйте «ёлочки»",
    replace: (match: string) => `«${match.slice(1, -1)}»`
  },
  {
    name: "Тире в начале строки без пробела",
    regex: /^—(?=\S)/g,
    message: "После тире в начале строки должен быть пробел"
  },
  {
    name: "Тире без пробела перед",
    regex: /(?<!\s)(?!^)—/g,
    message: "Перед тире должен быть пробел"
  },
  {
    name: "Тире без пробела после",
    regex: /(?<!^)—(?!\s)/g,
    message: "После тире должен быть пробел"
  },
  {
    name: "Дефис с пробелами вместо тире",
    regex: /(?<=\s)-(?=\s)/g,
    message: "Замените дефис с пробелами на тире: —"
  },
  {
    name: "Двойной дефис вместо тире",
    regex: /(?<=\s)--(?=\s)/g,
    message: "Замените -- на тире (—)"
  },
  {
    name: "Ошибки в скобках",
    regex: /([(\[{])\s+|\s+([)\]}])/g,
    message: "Уберите пробелы у скобок"
  },
  {
    name: "Неправильное многоточие",
    regex: /(\.{4,}|(?<!\.)\.{2}(?!\.))/g,
    message: "Используйте ровно три точки"
  },
  {
    name: "Ошибки в сокращениях",
    regex: /(\b\w{1,2}\.)\s(?=\w)/g,
    message: "Уберите пробел в сокращении"
  },
  {
    name: "Пробелы в числах/датах",
    regex: /(\d)\s+(\d)/g,
    message: "Уберите пробел в числе"
  },
  {
    name: "Лишние знаки препинания",
    regex: /([!?,;:])\1+/g,
    message: "Удалите повторяющиеся знаки"
  },
  // Ошибка: точка/запятая перед кавычкой
  {
    name: "punctuation-inside-quotes",
    regex: /([.,])(?=[»”])(?<=«.*)/g,
    message: "Перенесите точку/запятую после кавычки: «Текст».",
    replace: (match: string) => `»${match}`
  },

  // Ошибка: воскл./вопр. знак после кавычки
  {
    name: "punctuation-outside-quotes",
    regex: /(\s*[»”])(?=[!?])/g,
    message: "Перенесите знак внутрь кавычек: «Текст!»",
  }
];

const SimpleTextChecker = Extension.create({
  name: "repeatWordsHighlighter",

  addOptions() {
    return {
      windowSize: 10,
      minWordLength: 3,
      checks: PUNCTUATION_CHECKS,
      highlightStyle: "border-bottom: 2px dashed #ff0000;",
    };
  },

  addProseMirrorPlugins() {
    const { windowSize, minWordLength, checks, highlightStyle  } = this.options;


    const findPunctuationErrors = (doc: any) => {
      const decorations: Decoration[] = [];

      doc.descendants((node: any, pos: number) => {
        if (!node.isText) return;

        const text = node.text;
        let offset = pos;

        checks.forEach((check) => {
          let match;
          const regex = new RegExp(check.regex);

          while ((match = regex.exec(text)) !== null) {
            const start = offset + match.index;
            const end = start + match[0].length;

            decorations.push(
                Decoration.inline(start, end, {
                  class: "punctuation-error",
                  style: highlightStyle,
                  title: check.name,
                  "data-tooltip": check.message,
                  "data-replace": check.replace?.(match[0])
                })
            );
          }
        });
      });

      return decorations;
    };

    const findRepeatedWords = (doc) => {
      const decorations = [];
      let wordBuffer = [];

      doc.descendants((node, position) => {
        if (node.isText) {
          const text = node.text || '';
          const words = [];

          const wordRegex = /\S+/g;
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            const wordPos = position + match.index;
            words.push({
              word: word,
              clean: word.replace(/[.,!?;:()"'-]/g, "").toLowerCase(),
              from: wordPos,
              to: wordPos + word.length
            });
          }

          words.forEach(({word, clean, from, to}) => {
            if (clean.length >= minWordLength) {
              wordBuffer.push({
                word: clean,
                original: word,
                from: from,
                to: to
              });

              if (wordBuffer.length > windowSize) {
                wordBuffer.shift();
              }

              const similarWords = wordBuffer.filter(
                  (w, i) => w.word === clean && i !== wordBuffer.length - 1
              );

              if (similarWords.length > 0) {
                decorations.push(
                    Decoration.inline(from, to, {
                      style: "background-color: #fff3bf; border-bottom: 1px dashed #ffd43b; padding: 0 1px;",
                      "data-repeated": "true",
                    })
                );

                similarWords.forEach((w) => {
                  decorations.push(
                      Decoration.inline(w.from, w.to, {
                        style: "background-color: #fff3bf; border-bottom: 1px dashed #ffd43b; padding: 0 1px;",
                        "data-repeated": "true",
                      })
                  );
                });
              }
            }
          });
        }
      });

      return decorations
    };

    // Объединение декораций из обеих проверок
    const createMergedDecorations = (doc) => {
      return DecorationSet.create(doc,
        findRepeatedWords(doc).concat(findPunctuationErrors(doc)),
      );
    };

    return [
      new Plugin({
        state: {
          init: (_, { doc }) => createMergedDecorations(doc),
          apply: (tr, oldState) => tr.docChanged
              ? createMergedDecorations(tr.doc)
              : oldState,
        },
        props: {
          decorations(state) {
            return this.getState(state);
          }
        },
      }),
    ];
  }
});

// Вспомогательная функция для создания декораций
const createDecoration = (from, to, title) =>
    Decoration.inline(from, to, {
      class: "punctuation-error",
      style: "border-bottom: 2px dotted #ff0000;",
      "title": title,
      "data-tooltip": title,
    });


export default SimpleTextChecker;

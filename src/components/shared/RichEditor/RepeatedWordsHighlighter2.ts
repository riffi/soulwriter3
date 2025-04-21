import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import * as morph from 'morphjs';


const RepeatWordsHighlighter = Extension.create({
  name: "repeatWordsHighlighter",

  addOptions() {
    return {
      windowSize: 20,
      minWordLength: 3,
      checkSimilarRoots: true,
      highlightStyle: "background-color: #ffebee; border-bottom: 1px dashed #ffcdd2;",
    };
  },

  addProseMirrorPlugins() {
    const { windowSize, minWordLength, checkSimilarRoots, highlightStyle } = this.options;

    const getNormalForm = (word) => {
      try {
        const parsed = morph.parse(word.toLowerCase())[0];
        return parsed ? parsed.normal : word.toLowerCase();
      } catch {
        return word.toLowerCase();
      }
    };

    const findRepeatedWords = (doc) => {
      const decorations = [];
      let wordBuffer = [];

      doc.descendants((node, position) => {
        if (node.isText) {
          const text = node.text || '';
          const words = [];

          const wordRegex = /[\wа-яА-ЯёЁ-]+/g;
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            const wordPos = position + match.index;

            // Пропускаем слова из дефисов или слишком короткие
            if (word.replace(/-/g, '').length < minWordLength) continue;

            const cleanWord = word.replace(/[.,!?;:()"'«»]/g, "").toLowerCase();
            if (cleanWord.length < minWordLength) continue;

            words.push({
              word: word,
              clean: cleanWord,
              normal: checkSimilarRoots ? getNormalForm(cleanWord) : cleanWord,
              from: wordPos,
              to: wordPos + word.length
            });
          }

          words.forEach(({word, clean, normal, from, to}) => {
            wordBuffer.push({
              word: word,
              clean: clean,
              normal: normal,
              from: from,
              to: to
            });

            if (wordBuffer.length > windowSize) {
              wordBuffer.shift();
            }

            // Ищем слова с одинаковыми нормальными формами
            const similarWords = wordBuffer.filter(
                (w, i) => w.normal === normal &&
                    i !== wordBuffer.length - 1 &&
                    w.from !== from // Исключаем текущее слово
            );

            if (similarWords.length > 0) {
              const count = similarWords.length + 1;

              decorations.push(
                  Decoration.inline(from, to, {
                    style: highlightStyle,
                    class: "repeated-root",
                    "data-repeated-root": normal,
                    "title": `Повтор слова: "${normal}" (${count} раза)`
                  })
              );

              similarWords.forEach((w) => {
                if (!decorations.some(d => d.from === w.from && d.to === w.to)) {
                  decorations.push(
                      Decoration.inline(w.from, w.to, {
                        style: highlightStyle,
                        class: "repeated-root",
                        "data-repeated-root": normal,
                        "title": `Повтор слова: "${normal}" (${count} раза)`
                      })
                  );
                }
              });
            }
          });
        }
      });

      return DecorationSet.create(doc, decorations);
    };

    return [
      new Plugin({
        state: {
          init: (_, { doc }) => findRepeatedWords(doc),
          apply: (transaction, oldState) => {
            return transaction.docChanged
                ? findRepeatedWords(transaction.doc)
                : oldState;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  }
});

export default RepeatWordsHighlighter;

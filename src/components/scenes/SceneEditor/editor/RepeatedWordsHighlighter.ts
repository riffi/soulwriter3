import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const RepeatWordsHighlighter = Extension.create({
  name: "repeatWordsHighlighter",

  addOptions() {
    return {
      windowSize: 20,
      minWordLength: 3,
    };
  },

  addProseMirrorPlugins() {
    const { windowSize, minWordLength } = this.options;

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

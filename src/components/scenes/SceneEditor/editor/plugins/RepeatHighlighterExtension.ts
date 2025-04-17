import { Extension } from "@tiptap/core";
import { PluginKey, Plugin, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

interface RepeatDecoration {
  from: number;
  to: number;
  word: string;
  groupIndex: string;
  active: boolean;
}
export const REPEAT_HIGHLIGHTER_NAME = "repeatHighlighter";
export const repeatHighlighterKey = new PluginKey(REPEAT_HIGHLIGHTER_NAME);

export const RepeatHighlighterExtension = Extension.create({
  name: REPEAT_HIGHLIGHTER_NAME,

  addProseMirrorPlugins() {
    const pluginKey = repeatHighlighterKey;

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => ({
            decorations: DecorationSet.empty,
            repeats: [] as RepeatDecoration[],
          }),
          apply: (tr, prev, oldState, newState) => {
            const meta = tr.getMeta(pluginKey);

            // Обработка внешних обновлений
            if (meta?.action === "UPDATE_DECORATIONS") {
              const repeats = meta.repeats as RepeatDecoration[];
              const decorations = repeats.map(d =>
                  Decoration.inline(
                      d.from,
                      d.to,
                      {
                        class: `highlighted-repeat${d.active ? " active" : ""}`,
                        "data-word": d.word,
                        "data-group-index": d.groupIndex
                      }
                  )
              );

              return {
                repeats,
                decorations: DecorationSet.create(newState.doc, decorations)
              };
            }

            // Обновление позиций при изменениях документа
            return {
              repeats: prev.repeats,
              decorations: prev.decorations.map(tr.mapping, tr.doc)
            };
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },

          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            if (!target.classList.contains("highlighted-repeat")) return false;

            const pluginState = pluginKey.getState(view.state);
            if (!pluginState) return false;

            const groupIndex = target.dataset.groupIndex;
            const updatedRepeats = pluginState.repeats.map(repeat => ({
              ...repeat,
              active: repeat.groupIndex === groupIndex
            }));

            view.dispatch(
                view.state.tr
                .setMeta(pluginKey, {
                  action: "UPDATE_DECORATIONS",
                  repeats: updatedRepeats
                })
                .setSelection(TextSelection.create(view.state.doc, pos))
            );
            return true;
          }
        }
      })
    ];
  }
});

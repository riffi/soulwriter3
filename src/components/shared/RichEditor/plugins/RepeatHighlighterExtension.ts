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


// функция фильтрации групп c одним словом
const filterSingleGroups = (repeats: RepeatDecoration[]) => {
  const groupMap = new Map<string, RepeatDecoration[]>();
  for (const repeat of repeats) {
    const group = groupMap.get(repeat.groupIndex) || [];
    group.push(repeat);
    groupMap.set(repeat.groupIndex, group);
  }
  return Array.from(groupMap.values())
  .filter(group => group.length >= 2)
  .flat();
};

// Создание декораций
const createDecorations = (repeats: RepeatDecoration[], doc): DecorationSet => {
  const decorations = repeats.map(d =>
      Decoration.inline(
          d.from,
          d.to,
          {
            class: `highlighted-repeat${d.active ? " active" : ""}`,
            "data-word": d.word,
            "data-group-index": d.groupIndex,
            "title": "Слово дублируется"
          }
      )
  );

  return DecorationSet.create(doc, decorations);
};

// Обновление позиций повторов
const updateRepeatPositions = (tr, repeats, newState) => {
  return repeats
  .map(repeat => {
    const newFrom = tr.mapping.map(repeat.from);
    const newTo = tr.mapping.map(repeat.to);
    return (newFrom <= newTo && newTo <= newState.doc.content.size && newTo > newFrom)
        ? { ...repeat, from: newFrom, to: newTo }
        : null;
  })
  .filter((repeat): repeat is RepeatDecoration => repeat !== null);
};

// Обработчик кликов
const createClickHandler = (pluginKey) => (view, pos, event) => {
  const target = event.target as HTMLElement;
  const pluginState = pluginKey.getState(view.state);
  if (!pluginState) return false;

  let updatedRepeats = pluginState.repeats;
  let shouldUpdate = false;

  if (target.classList.contains("highlighted-repeat")) {
    const groupIndex = target.dataset.groupIndex;
    updatedRepeats = pluginState.repeats.map(repeat => ({
      ...repeat,
      active: repeat.groupIndex === groupIndex
    }));
    shouldUpdate = true;
  } else if (pluginState.repeats.some(r => r.active)) {
    updatedRepeats = pluginState.repeats.map(repeat => ({
      ...repeat,
      active: false
    }));
    shouldUpdate = true;
  }

  if (shouldUpdate) {
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

  return false;
};
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

            if (meta?.action === "UPDATE_DECORATIONS") {
              // Фильтруем входящие данные
              const filteredRepeats = filterSingleGroups(meta.repeats);
              const decorations = createDecorations(filteredRepeats, newState.doc)

              return {
                repeats: filteredRepeats,
                decorations
              };
            }

            // Обновление позиций и фильтрация
            const mappedRepeats = updateRepeatPositions(tr, prev.repeats, newState);
            const finalRepeats = filterSingleGroups(mappedRepeats);

            const decorations = createDecorations(finalRepeats, newState.doc);

            return {
              repeats: finalRepeats,
              decorations
            };
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },

          handleClick: createClickHandler(pluginKey)
        }
      })
    ];
  }
});

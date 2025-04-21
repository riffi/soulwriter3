import { Extension } from "@tiptap/core";
import { PluginKey, Plugin, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {IRepeatWarning} from "@/components/shared/RichEditor/types";


export const REPEAT_HIGHLIGHTER_NAME = "repeatHighlighter";
export const repeatHighlighterKey = new PluginKey(REPEAT_HIGHLIGHTER_NAME);


// функция фильтрации групп c одним словом
const filterSingleGroups = (warnings: IRepeatWarning[]) => {
  const groupMap = new Map<string, IRepeatWarning[]>();
  for (const warning of warnings) {
    const group = groupMap.get(warning.groupIndex) || [];
    group.push(warning);
    groupMap.set(warning.groupIndex, group);
  }
  return Array.from(groupMap.values())
  .filter(group => group.length >= 2)
  .flat();
};

// Создание декораций
const createDecorations = (warnings: IRepeatWarning[], doc): DecorationSet => {
  const decorations = warnings.map(d =>
      Decoration.inline(
          d.from,
          d.to,
          {
            class: `highlighted-repeat${d.active ? " active" : ""}`,
            "data-word": d.text,
            "data-group-index": d.groupIndex,
            "title": "Слово дублируется"
          }
      )
  );

  return DecorationSet.create(doc, decorations);
};

// Обновление позиций повторов
const updateRepeatPositions = (tr, warnings, newState) => {
  return warnings
  .map(repeat => {
    const newFrom = tr.mapping.map(repeat.from);
    const newTo = tr.mapping.map(repeat.to);
    return (newFrom <= newTo && newTo <= newState.doc.content.size && newTo > newFrom)
        ? { ...repeat, from: newFrom, to: newTo }
        : null;
  })
  .filter((repeat): repeat is IRepeatWarning => repeat !== null);
};

// Обработчик кликов
const createClickHandler = (pluginKey) => (view, pos, event) => {
  const target = event.target as HTMLElement;
  const pluginState = pluginKey.getState(view.state);
  if (!pluginState) return false;

  let updatedWarnings = pluginState.warnings;
  let shouldUpdate = false;

  if (target.classList.contains("highlighted-repeat")) {
    const groupIndex = target.dataset.groupIndex;
    updatedWarnings = pluginState.warnings.map(repeat => ({
      ...repeat,
      active: repeat.groupIndex === groupIndex
    }));
    shouldUpdate = true;
  } else if (pluginState.warnings.some(r => r.active)) {
    updatedWarnings = pluginState.repeats.map(repeat => ({
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
          warnings: updatedWarnings
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
            warnings: [] as IRepeatWarning[],
          }),
          apply: (tr, prev, oldState, newState) => {
            const meta = tr.getMeta(pluginKey);

            if (meta?.action === "UPDATE_DECORATIONS") {
              // Фильтруем входящие данные
              const filteredWarnings = filterSingleGroups(meta.warnings);
              const decorations = createDecorations(filteredWarnings, newState.doc)

              return {
                warnings: filteredWarnings,
                decorations
              };
            }

            // Обновление позиций и фильтрация
            const mappedRepeats = updateRepeatPositions(tr, prev.warnings, newState);
            const finalRepeats = filterSingleGroups(mappedRepeats);

            const decorations = createDecorations(finalRepeats, newState.doc);

            return {
              warnings: finalRepeats,
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

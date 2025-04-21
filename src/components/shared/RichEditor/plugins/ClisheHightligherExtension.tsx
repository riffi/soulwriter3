// ClicheHighlighterExtension.ts
import { Extension } from "@tiptap/core";
import { PluginKey, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {IClicheWarning} from "@/components/shared/RichEditor/types";


export const CLICHE_HIGHLIGHTER_NAME = "clicheHighlighter";
export const clicheHighlighterKey = new PluginKey(CLICHE_HIGHLIGHTER_NAME);

const createWarningDecorations = (warnings: IClicheWarning[], doc): DecorationSet => {
  const decorations = warnings.map(d =>
      Decoration.inline(
          d.from,
          d.to,
          {
            class: "highlighted-cliche",
            "data-pattern": d.pattern,
            "data-text": d.text,
            "title": "Фраза-штамп"
          }
      )
  );

  return DecorationSet.create(doc, decorations);
};

const updateClichePositions = (tr, warnings, newState) => {
  return warnings
  .map(cliche => {
    const newFrom = tr.mapping.map(cliche.from);
    const newTo = tr.mapping.map(cliche.to);
    return (newFrom <= newTo && newTo <= newState.doc.content.size && newTo > newFrom)
        ? { ...cliche, from: newFrom, to: newTo }
        : null;
  })
  .filter((cliche): cliche is IClicheWarning => cliche !== null);
};

export const ClicheHighlighterExtension = Extension.create({
  name: CLICHE_HIGHLIGHTER_NAME,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: clicheHighlighterKey,
        state: {
          init: () => ({
            decorations: DecorationSet.empty,
            warnings: [] as IClicheWarning[],
          }),
          apply: (tr, prev, oldState, newState) => {
            const meta = tr.getMeta(clicheHighlighterKey);
            if (meta?.action === "UPDATE_DECORATIONS") {
              return {
                warnings: meta.warnings,
                decorations: createWarningDecorations(meta.warnings, newState.doc)
              };
            }
            const mappedCliches = updateClichePositions(tr, prev.warnings, newState);
            return {
              warnings: mappedCliches,
              decorations: createWarningDecorations(mappedCliches, newState.doc)
            };
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          }
        }
      })
    ];
  }
});

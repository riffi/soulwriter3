// ClicheHighlighterExtension.ts
import { Extension } from "@tiptap/core";
import { PluginKey, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

interface ClicheDecoration {
  from: number;
  to: number;
  text: string;
  pattern: string;
}

export const CLICHE_HIGHLIGHTER_NAME = "clicheHighlighter";
export const clicheHighlighterKey = new PluginKey(CLICHE_HIGHLIGHTER_NAME);

const createClicheDecorations = (cliches: ClicheDecoration[], doc): DecorationSet => {
  const decorations = cliches.map(d =>
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

const updateClichePositions = (tr, cliches, newState) => {
  return cliches
  .map(cliche => {
    const newFrom = tr.mapping.map(cliche.from);
    const newTo = tr.mapping.map(cliche.to);
    return (newFrom <= newTo && newTo <= newState.doc.content.size && newTo > newFrom)
        ? { ...cliche, from: newFrom, to: newTo }
        : null;
  })
  .filter((cliche): cliche is ClicheDecoration => cliche !== null);
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
            cliches: [] as ClicheDecoration[],
          }),
          apply: (tr, prev, oldState, newState) => {
            const meta = tr.getMeta(clicheHighlighterKey);
            if (meta?.action === "UPDATE_DECORATIONS") {
              return {
                cliches: meta.cliches,
                decorations: createClicheDecorations(meta.cliches, newState.doc)
              };
            }
            const mappedCliches = updateClichePositions(tr, prev.cliches, newState);
            return {
              cliches: mappedCliches,
              decorations: createClicheDecorations(mappedCliches, newState.doc)
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

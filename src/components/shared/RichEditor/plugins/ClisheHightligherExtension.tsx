// ClicheHighlighterExtension.ts
import { PluginKey } from "prosemirror-state";
import { BaseHighlighterExtension } from "./base/BaseHighligherExtension";
import { IClicheWarning, IWarningGroup } from "../types";

export const CLICHE_HIGHLIGHTER_NAME = "clicheHighlighter";
export const clicheHighlighterKey = new PluginKey(CLICHE_HIGHLIGHTER_NAME);


export const ClicheHighlighterExtension = BaseHighlighterExtension<IClicheWarning>({
  pluginKey: clicheHighlighterKey,
  pluginName: CLICHE_HIGHLIGHTER_NAME,
  decorationClass: "highlighted-cliche",
  title: "Фраза-штамп",
  createDecorAttrs: (warning) => ({
    "data-pattern": warning.pattern,
    "data-text": warning.text,
    "data-group-index": warning.groupIndex
  })
});

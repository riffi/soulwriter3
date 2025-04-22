// BaseHighlighterExtension.ts
import { Extension } from "@tiptap/core";
import { PluginKey, Plugin, Transaction, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { IWarning, IWarningGroup, IWarningKind } from "@/components/shared/RichEditor/types";
import {
  repeatHighlighterKey
} from "@/components/shared/RichEditor/plugins/RepeatHighlighterExtension";

export type HighlighterConfig<T extends IWarning> = {
  pluginKey: PluginKey;
  pluginName: string;
  decorationClass: string;
  title: string;
  createDecorAttrs: (warning: T) => Record<string, string>;
};

export const BaseHighlighterExtension = <T extends IWarning>(config: HighlighterConfig<T>) =>
    Extension.create({
      name: config.pluginName,

      addProseMirrorPlugins() {
        const pluginKey = config.pluginKey;

        const updatePositions = (tr: Transaction, groups: IWarningGroup[], newState: any) => {
          return groups.map(group => ({
            ...group,
            warnings: group.warnings
            .map(warning => {
              const newFrom = tr.mapping.map(warning.from);
              const newTo = tr.mapping.map(warning.to);
              return (newFrom <= newTo && newTo <= newState.doc.content.size)
                  ? { ...warning, from: newFrom, to: newTo }
                  : null;
            })
            .filter((w): w is T => w !== null)
          })).filter(group => group.warnings.length > 0);
        };

        const createDecorations = (groups: IWarningGroup[], doc: any) => {
          const decorations = groups.flatMap(group =>
              group.warnings.map(warning =>
                  Decoration.inline(
                      warning.from,
                      warning.to,
                      {
                        class: `${config.decorationClass}${group.warnings.some(w => (w as any).active) ? ' active' : ''}`,
                        title: config.title,
                        ...config.createDecorAttrs(warning)
                      }
                  )
              )
          );
          return DecorationSet.create(doc, decorations);
        };

        return [
          new Plugin({
            key: pluginKey,
            state: {
              init: () => ({
                decorations: DecorationSet.empty,
                warningGroups: [] as IWarningGroup[],
              }),
              apply: (tr, prev, oldState, newState) => {
                const meta = tr.getMeta(pluginKey);

                if (meta?.action === "UPDATE_DECORATIONS") {
                  const groups = meta.warningGroups;
                  return {
                    warningGroups: groups,
                    decorations: createDecorations(groups, newState.doc)
                  };
                }

                const updatedGroups = updatePositions(tr, prev.warningGroups, newState);
                return {
                  warningGroups: updatedGroups,
                  decorations: createDecorations(updatedGroups, newState.doc)
                };
              }
            },
            props: {
              decorations(state) {
                return this.getState(state)?.decorations;
              },
              handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                const pluginState = pluginKey.getState(view.state);
                if (!pluginState || !target.classList.contains(config.decorationClass)) return false;

                const groupIndex = target.dataset.groupIndex;
                const group = pluginState.warningGroups.find(g => g.groupIndex === groupIndex);

                const updatedGroups = pluginState.warningGroups.map(g => (
                    { ...g,
                      warnings: g.warnings.map(w => ({ ...w, active: group?.groupIndex === g.groupIndex }))
                    })
                );
                console.log(updatedGroups);
                view.dispatch(
                    view.state.tr
                    .setMeta(repeatHighlighterKey, {
                      action: "UPDATE_DECORATIONS",
                      warningGroups: updatedGroups
                    })
                    .setSelection(TextSelection.create(view.state.doc, view.state.selection.from))
                );
                return true;
              }
            }
          })
        ];
      }
    });

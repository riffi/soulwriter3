// @/components/shared/RichEditor/plugins/FocusModeExtension.ts

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Node } from 'prosemirror-model';

// Вспомогательная функция для поиска родительского узла-параграфа
const findParentParagraph = (doc: Node, pos: number) => {
    if (pos > doc.content.size) return null;
    const $pos = doc.resolve(pos);
    for (let i = $pos.depth; i > 0; i--) {
        const node = $pos.node(i);
        if (node.type.name === 'paragraph') {
            // Возвращаем узел и его начальную позицию в документе
            return { node, pos: $pos.before(i) };
        }
    }
    return null;
};

export const FocusModeExtension = Extension.create<{ focusMode: boolean }>({
    name: 'focusMode',

    // Добавляем опцию `focusMode` в расширение
    addOptions() {
        return {
            focusMode: false,
        };
    },

    // 1. Добавляем атрибут `data-is-active-paragraph` в схему узла 'paragraph'
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    'data-is-active-paragraph': {
                        default: null,
                        renderHTML: attributes => {
                            if (attributes['data-is-active-paragraph']) {
                                return { 'data-is-active-paragraph': 'true' };
                            }
                            return {};
                        },
                    },
                },
            },
        ];
    },

    // 2. Создаем ProseMirror плагин для управления атрибутом
    addProseMirrorPlugins() {
        // Плагин будет активен только если включена опция focusMode
        if (!this.options.focusMode) {
            return [];
        }

        return [
            new Plugin({
                key: new PluginKey('focusModeHandler'),

                // `appendTransaction` позволяет модифицировать транзакцию перед ее применением
                appendTransaction: (transactions, oldState, newState) => {
                    const selectionHasChanged = transactions.some(tr => tr.selectionSet);
                    if (!selectionHasChanged) {
                        return null;
                    }

                    const tr = newState.tr;
                    let hasChanged = false;

                    const oldParagraph = findParentParagraph(oldState.doc, oldState.selection.from);
                    const newParagraph = findParentParagraph(newState.doc, newState.selection.from);

                    // Если курсор покинул параграф, который был активным, убираем с него атрибут
                    if (oldParagraph && oldParagraph.node.attrs['data-is-active-paragraph']) {
                        if (!newParagraph || newParagraph.pos !== oldParagraph.pos) {
                            tr.setNodeAttribute(oldParagraph.pos, 'data-is-active-paragraph', null);
                            hasChanged = true;
                        }
                    }

                    // Если курсор вошел в новый параграф, добавляем ему атрибут
                    if (newParagraph && !newParagraph.node.attrs['data-is-active-paragraph']) {
                        tr.setNodeAttribute(newParagraph.pos, 'data-is-active-paragraph', 'true');
                        hasChanged = true;
                    }

                    // Возвращаем измененную транзакцию, если были изменения
                    return hasChanged ? tr : null;
                },
            }),
        ];
    },
});

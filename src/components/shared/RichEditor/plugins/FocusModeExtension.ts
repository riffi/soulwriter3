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
                    // Нас интересуют только транзакции, где изменилась позиция курсора
                    const selectionHasChanged = transactions.some(tr => tr.selectionSet);
                    if (!selectionHasChanged) {
                        return null;
                    }

                    const tr = newState.tr;
                    let hasChanged = false;

                    // Находим параграф, в котором сейчас находится курсор
                    const newActiveParagraph = findParentParagraph(newState.doc, newState.selection.from);
                    // Получаем его позицию или -1, если курсор не в параграфе
                    const newActiveParagraphPos = newActiveParagraph ? newActiveParagraph.pos : -1;

                    // Проходимся по всем узлам документа
                    newState.doc.descendants((node, pos) => {
                        // Работаем только с параграфами
                        if (node.type.name !== 'paragraph') {
                            return;
                        }

                        const isThisNodeTheActiveOne = pos === newActiveParagraphPos;
                        const hasAttribute = !!node.attrs['data-is-active-paragraph'];

                        // Сценарий 1: Этот параграф должен быть активным, но у него нет атрибута
                        if (isThisNodeTheActiveOne && !hasAttribute) {
                            tr.setNodeAttribute(pos, 'data-is-active-paragraph', 'true');
                            hasChanged = true;
                        }
                        // Сценарий 2: Этот параграф НЕ должен быть активным, но у него есть атрибут
                        else if (!isThisNodeTheActiveOne && hasAttribute) {
                            tr.setNodeAttribute(pos, 'data-is-active-paragraph', null);
                            hasChanged = true;
                        }
                    });

                    // Возвращаем измененную транзакцию, только если были реальные изменения
                    return hasChanged ? tr : null;
                },
            }),
        ];
    },
});

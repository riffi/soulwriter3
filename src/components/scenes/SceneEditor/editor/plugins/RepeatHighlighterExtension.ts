import { Extension } from "@tiptap/core";
import { PluginKey, Plugin, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";


export const RepeatHighlighterExtension = Extension.create({
  name: "repeatHighlighter",

  addStorage() {
    return {
      repeatsCollection: [],
    }
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey(this.name);
    const outerExtension: Extension = this;

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, old, oldState, newState) => {
            console.log("transaction", tr)
            const meta = tr.meta['repeatHighlighter'];
            if (meta && meta?.action === "UPDATE_DECORATIONS") {
              outerExtension.storage.repeatsCollection = meta.repeats;
              // Создаем декорации и обновляем через команду
              const decos = outerExtension.storage.repeatsCollection.map(d =>{
                  let className = 'highlighted-repeat';
                  if( d.active ) {
                    className += ' active'
                  }
                  return  Decoration.inline(d.from, d.to, {
                    class: className,
                    "data-word": d.word,
                    "data-group-index": d.groupIndex
                  })
              }
              );
             // outerExtension.storage.decorations = meta.decorations;
              return DecorationSet.create(newState.doc, decos);
            }

            // Обновление позиций при изменениях документа
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },

          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains("highlighted-repeat")) {
              const clickedWord = target.dataset.word;
              const groupIndex = target.dataset.groupIndex;
              // Получаем состояние плагина через pluginKey
              const repeatsCollection = outerExtension.storage.repeatsCollection ;
              //const activeRepeats = repeatsCollection.filter(d => d.word === clickedWord);
              repeatsCollection.forEach(repeat => {
                repeat.active = repeat.groupIndex === groupIndex;
              })

              // Получаем точную позицию в документе
              const targetPos = view.posAtDOM(target, 0);

              // Создаем транзакцию с обновлением выделения
              const tr = view.state.tr
              .setMeta("repeatHighlighter", {
                action: "UPDATE_DECORATIONS",
                repeats: repeatsCollection
              })
              .setSelection(TextSelection.create(view.state.doc, pos));

              view.dispatch(tr);
              view.focus(); // Убедимся, что редактор в фокусе

              // view.dispatch(
              //     view.state.tr.setMeta("repeatHighlighter", {
              //       action: "UPDATE_DECORATIONS",
              //       repeats: repeatsCollection
              //     })
              // );
              return false;
            }
            return false;
          }
        }
      })
    ];
  },

});

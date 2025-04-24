// SceneRichTextEditor.tsx
import {RichTextEditor} from '@mantine/tiptap';
import {useEffect, useState} from "react";
import '@mantine/tiptap/styles.css';

import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import './editor.override.css'
import {EditorToolBar} from "@/components/shared/RichEditor/toolbar/EditorToolBar";
import {LoadingOverlay} from "@/components/shared/overlay/LoadingOverlay";
import {CheckRepeatsButton} from "@/components/shared/RichEditor/toolbar/CheckRepeatsButton";
import {CheckClichesButton} from "@/components/shared/RichEditor/toolbar/CheckClishesButton";
import {
  IWarningGroup,
} from "@/components/shared/RichEditor/types";
import {useWarningGroups} from "@/components/shared/RichEditor/hooks/useWarningGroups";
import {useEditorState} from "@/components/shared/RichEditor/hooks/useEditorState";



interface ISceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (contentHtml: string, contentText: string) => void;
  onWarningsChange?: (warningGroups: IWarningGroup[]) => void;
  selectedGroup?: IWarningGroup;
  onScroll?: (scrollTop: number) => void;
}

export const RichEditor = ({ initialContent, onContentChange, onWarningsChange, selectedGroup, onScroll}: ISceneRichTextEditorProps) => {

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ""
  });


  const [scrollTop, setScrollTop] = useState(0);
  const { isMobile } = useMedia();

  const { editor } = useEditorState(initialContent || '', onContentChange);
  const warningGroups = useWarningGroups(editor, selectedGroup, onWarningsChange);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(event.target.scrollTop)
    setScrollTop(event.target.scrollTop)
  }

  function getEditorBottom(){
    if (warningGroups.length > 0){
      return 100
    }
    return 50
  }

  function getEditorTop(scrollTop: number){
    // if (scrollTop > 50){
    //   return 50
    // }
    return 90
  }

  return (
  <>
    <LoadingOverlay
        visible={loadingState.isLoading}
        message={loadingState.message}
    />
    <RichTextEditor
          editor={editor}
          variant="subtle"
          style={isMobile ? {
            position: "fixed",
            top: getEditorTop(scrollTop),
            bottom: getEditorBottom(),
            overflow: "scroll",
          } : {}}
          onScroll={handleScroll}

      >
        <EditorToolBar editor={editor}>
          <CheckRepeatsButton
              editor={editor}
              onLoadingChange={(isLoading, message) =>
                  setLoadingState({
                    isLoading,
                    message: message || ""
                  })
              }
          />
          <CheckClichesButton editor={editor}
                              onLoadingChange={(isLoading, message) =>
                                  setLoadingState({
                                    isLoading,
                                    message: message || ""
                                  })
                              }
          />

        </EditorToolBar>
        <RichTextEditor.Content />
      </RichTextEditor>

  </>
  );
};

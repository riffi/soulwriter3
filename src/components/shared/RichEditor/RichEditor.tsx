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



export interface IRichEditorMobileConstraints{
  top: number;
  bottom: number;
}
export interface ISceneRichTextEditorProps {
  initialContent?: string;
  onContentChange?: (contentHtml: string, contentText: string) => void;
  onWarningsChange?: (warningGroups: IWarningGroup[]) => void;
  selectedGroup?: IWarningGroup;
  onScroll?: (scrollTop: number) => void;
  mobileConstraints?: IRichEditorMobileConstraints
}

const TOOLBAR_HEIGHT = 40;
export const RichEditor = (props: ISceneRichTextEditorProps) => {

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: ""
  });

  const mobileConstraints = props.mobileConstraints || {top: 50, bottom: 100};

  const [scrollTop, setScrollTop] = useState(0);
  const { isMobile } = useMedia();

  const { editor } = useEditorState(props.initialContent || '', props.onContentChange);
  const warningGroups = useWarningGroups(editor, props.selectedGroup, props.onWarningsChange);

  // Обработчик прокрутки
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    props.onScroll?.(event.target.scrollTop)
    setScrollTop(event.target.scrollTop)
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
            top: mobileConstraints.top + TOOLBAR_HEIGHT,
            bottom: mobileConstraints.bottom,
            overflow: "scroll",
          } : {}}
          onScroll={handleScroll}

      >
        <EditorToolBar editor={editor} top={mobileConstraints?.top}>
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

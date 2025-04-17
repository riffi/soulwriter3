import {RichTextEditor} from "@mantine/tiptap";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {
  CheckRepeatsButton
} from "@/components/scenes/SceneEditor/editor/toolbar/CheckRepeatsButton";

export const EditorToolBar = (editor) => {

  const { isMobile} = useMedia();

  return (
      <>
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.ClearFormatting />
            <CheckRepeatsButton editor={editor} />
            {!isMobile &&
                <>
                  <RichTextEditor.Strikethrough />
                  <RichTextEditor.Highlight />
                </>
            }
          </RichTextEditor.ControlsGroup>

          {!isMobile &&
              <>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Blockquote />
                  <RichTextEditor.Hr />
                  <RichTextEditor.Subscript />
                  <RichTextEditor.Superscript />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.AlignLeft />
                  <RichTextEditor.AlignCenter />
                  <RichTextEditor.AlignJustify />
                  <RichTextEditor.AlignRight />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.ColorPicker
                      colors={[
                        '#25262b',
                        '#868e96',
                        '#fa5252',
                        '#e64980',
                        '#be4bdb',
                        '#7950f2',
                        '#4c6ef5',
                        '#228be6',
                        '#15aabf',
                        '#12b886',
                        '#40c057',
                        '#82c91e',
                        '#fab005',
                        '#fd7e14',
                      ]}
                  />
                  <RichTextEditor.Color color="#F03E3E" />
                  <RichTextEditor.Color color="#7048E8" />
                  <RichTextEditor.Color color="#1098AD" />
                  <RichTextEditor.Color color="#37B24D" />
                  <RichTextEditor.Color color="#F59F00" />
                </RichTextEditor.ControlsGroup>
              </>}
        </RichTextEditor.Toolbar>
      </>
  )
}

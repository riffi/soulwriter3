import {RichTextEditor} from "@mantine/tiptap";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import React from "react";


import { ActionIcon } from "@mantine/core";
import { IconFocus2 } from "@tabler/icons-react";

interface IEditorToolBarProps {
    editor: any;
    children?: React.ReactNode;
    mobileTop: number;
    desktopTop: number;
    focusMode: boolean;
    toggleFocusMode: () => void;
}
export const EditorToolBar = (props: IEditorToolBarProps) => {

    const { isMobile} = useMedia();

    if (props.focusMode) {
        return null;
    }

    return (
        <>
            <RichTextEditor.Toolbar style={isMobile?{
                position: "fixed",
                top: props.mobileTop,
                width:"100%",
                zIndex:1000,

            }:{
                position: "sticky",
                stickyOffset:"50px",
                top: props.desktopTop,
            }}>
                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.ClearFormatting />
                    {props.children}
                    <ActionIcon
                        onClick={props.toggleFocusMode}
                        variant={props.focusMode ? "filled" : "default"}
                        aria-label="Focus mode"
                    >
                        <IconFocus2 size={16} />
                    </ActionIcon>

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

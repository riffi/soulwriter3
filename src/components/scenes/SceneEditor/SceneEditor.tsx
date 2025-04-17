import { IScene } from "@/entities/BookEntities";
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  Space,
  Text
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import { useSceneEditor } from "@/components/scenes/SceneEditor/useSceneEditor";
import { InlineEdit } from "@/components/shared/InlineEdit/InlineEdit";
import { SceneRichTextEditor } from "./editor/SceneRichTextEditor";
import {useMedia} from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {usePageTitle} from "@/providers/PageTitleProvider/PageTitleProvider";

export interface ISceneEditorProps {
  sceneId?: string;
}

export const SceneEditor = (props: ISceneEditorProps) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [sceneBody, setSceneBody] = useState<string>("");

  const { scene, saveScene } = useSceneEditor(props.sceneId ? Number(props.sceneId) : undefined);
  const { setPageTitle } = usePageTitle();

  const handleSave = async (silent?: boolean) => {
    setIsSaving(true);
    try {
      const sceneId = await saveScene(
          { ...scene, body: sceneBody },
          silent ? true : false
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = useCallback(
      (content: string) => {
        if (scene && scene.id && content !== scene.body) {
          saveScene({ ...scene, body: content }, true);
        }
        setSceneBody(content);
      }, [scene, saveScene]
  );

  useEffect(() => {
    if (scene && scene.body !== sceneBody) {
      setSceneBody(scene.body);
    }
  }, [scene?.id, scene?.body]);

  useEffect(() => {
    if (scene) {
      setPageTitle(`${scene?.order}. ${scene?.title}`);
    }

    return () => {
      setPageTitle(''); // Очищаем при размонтировании
    };
  }, [scene, setPageTitle]);


  const { isMobile} = useMedia();

  if (!scene?.id) {
    return (<>
      </>
    );
  }

  const content = (
      <>
      <Box mb="md" p={"sm"}>
        <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/scenes')}
            mb="sm" p={0}
        >
          Назад к списку
        </Button>
        <InlineEdit
            value={scene?.title}
            onChange={(value) => { saveScene({ ...scene, title: value }) }}
            label="Название сцены"
        />
      </Box>

      <SceneRichTextEditor
          initialContent={sceneBody}
          onContentChange={handleContentChange}
      />

      <Space h="md" />
      </>
  )

  return (
      <Container size="xl" p={"0"}>
        {!isMobile &&
        <Paper withBorder p="lg" radius="md" shadow="sm">
          {content}
        </Paper>
        }
        {isMobile &&
          <>
            {content}
          </>
        }
      </Container>
  );
};

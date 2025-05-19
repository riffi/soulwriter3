// SceneLayout.tsx
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import {useLocation, useNavigate} from "react-router-dom";
import { Box } from "@mantine/core";
import {SceneEditor} from "@/components/scenes/SceneEditor/SceneEditor";
import {SceneManager} from "@/components/scenes/SceneManager/SceneManager";
import {useState} from "react";

export const SceneLayout = () => {
  const { isMobile } = useMedia();
  const navigate = useNavigate();
  const [sceneId, setSceneId] = useState<number | undefined>();

  const openScene = (sceneId: number) => {
    if (isMobile) {
      navigate(`/scene/card?id=${sceneId}`);
    } else {
      setSceneId(sceneId);
    }
  }

  if (isMobile) {
    return sceneId ? <SceneEditor sceneId={sceneId} /> : <SceneManager openScene={openScene}/>;
  }



  return (
      <Box display="flex" style={{
      }}>
        <Box style={{
          width: "500px",
          flexShrink: 0,


        }}>
          <Box style={{
            maxHeight: "calc(100vh - 50px)",
            position: "fixed",
            overflowY: "auto",
          }}>
            <SceneManager
                openScene={openScene}
                selectedSceneId={sceneId}
            />
          </Box>
        </Box>
        <Box style={{ flexGrow: 1 }}>
          {sceneId ? <SceneEditor sceneId={sceneId} /> : <Placeholder />}
        </Box>
      </Box>
  );
};

const Placeholder = () => (
    <Box
        display="flex"
        style={{
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
    >
      Выберите сцену для редактирования
    </Box>
);

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMedia } from "@/providers/MediaQueryProvider/MediaQueryProvider";
import { useSceneEditor } from "@/components/scenes/SceneEditor/hooks/useSceneEditor";
import type { SceneEditorProps } from "./types";
import {IWarningGroup} from "@/components/shared/RichEditor/types";
import {SceneMobileContent} from "@/components/scenes/SceneEditor/parts/SceneMobileContent";
import {SceneDesktopContent} from "@/components/scenes/SceneEditor/parts/SceneDesktopContent";

export const SceneEditor = ({ sceneId }: SceneEditorProps) => {
  const navigate = useNavigate();
  const { isMobile } = useMedia();

  const { scene, saveScene } = useSceneEditor(sceneId ? Number(sceneId) : undefined);

  const [selectedGroup, setSelectedGroup] = useState<IWarningGroup>();
  const [sceneBody, setSceneBody] = useState("");
  const [warningGroups, setWarningGroups] = useState<IWarningGroup[]>([]);


  // Обработчик изменения контента в редакторе
  const handleContentChange = useCallback(
  (contentHTML, contentText) => {
    if (!scene?.id || contentHTML === scene.body) return;

    const updatedScene = {
      ...scene,
      body: contentHTML,
      totalSymbolCountWithSpaces: contentText.length,
      totalSymbolCountWoSpaces: contentText.replace(/\s+/g, '').length
    };

    saveScene(updatedScene, true);
    setSceneBody(contentHTML);
  },
  [scene, saveScene]
);


  // Обновление состояния редактора при изменении текста сцены
  useEffect(() => {
    if (scene?.body && scene.body !== sceneBody) {
      setSceneBody(scene.body);
    }
  }, [scene?.body]);

  if (!scene?.id) return null;


  return (
      <>
        {isMobile ? (
            <SceneMobileContent
                sceneBody={sceneBody}
                handleContentChange={handleContentChange}
                warningGroups={warningGroups}
                setWarningGroups={setWarningGroups}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                scene={scene}
                saveScene={saveScene}
            />
        ) : (
            <SceneDesktopContent
                scene={scene}
                navigate={navigate}
                saveScene={saveScene}
                sceneBody={sceneBody}
                handleContentChange={handleContentChange}
                warningGroups={warningGroups}
                setWarningGroups={setWarningGroups}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
            />
        )}
      </>
  );
};

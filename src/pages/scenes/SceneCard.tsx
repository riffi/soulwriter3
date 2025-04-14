import {useSearchParams} from "react-router-dom";
import {SceneEditor} from "@/components/scenes/SceneEditor/SceneEditor";

export const SceneCard = () => {
  const [searchParams] = useSearchParams();

  const sceneId = searchParams.get('id')
  return (
      <>
        <SceneEditor sceneId={Number(sceneId)}/>
      </>
  )
}

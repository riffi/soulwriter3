import { useEffect } from "react";

export const useSceneTitle = (
    scene: { order?: number; title?: string },
    setPageTitle: (title: string) => void
) => {
  useEffect(() => {
    if (scene?.title) {
      setPageTitle(`${scene.order}. ${scene.title}`);
    }

    return () => setPageTitle('');
  }, [scene?.title, setPageTitle]);
};

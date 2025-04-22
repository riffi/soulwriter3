import { useCallback, useState } from "react";

export const useHeaderVisibility = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleEditorScroll = useCallback((scrollTop: number) => {
    const SCROLL_THRESHOLD = 50;
    setIsHeaderVisible(scrollTop < SCROLL_THRESHOLD);
  }, []);

  return { isHeaderVisible, handleEditorScroll };
};

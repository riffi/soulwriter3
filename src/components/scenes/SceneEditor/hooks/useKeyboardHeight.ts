import { useEffect, useState } from "react";

export const useKeyboardHeight = (isMobile: boolean) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    const handler = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const newKeyboardHeight = window.innerHeight - viewport.height;
      setKeyboardHeight(newKeyboardHeight > 50 ? newKeyboardHeight : 0);
    };

    window.visualViewport?.addEventListener('resize', handler);
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, [isMobile]);

  return keyboardHeight;
};

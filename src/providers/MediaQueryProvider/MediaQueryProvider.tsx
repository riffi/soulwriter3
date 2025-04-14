// src/contexts/MediaQueryContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useMediaQuery } from '@mantine/hooks';

const MediaQueryContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: false,
});

export const MediaQueryProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const isTablet = useMediaQuery('(max-width: 64em)');
  const isDesktop = useMediaQuery('(min-width: 64em)');

  return (
      <MediaQueryContext.Provider value={{ isMobile, isTablet, isDesktop }}>
        {children}
      </MediaQueryContext.Provider>
  );
};

export const useMedia = () => useContext(MediaQueryContext);

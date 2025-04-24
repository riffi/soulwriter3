// src/contexts/PageTitleContext.tsx
import { createContext, useContext, useState } from 'react';
import React from 'react';

interface PageTitleContextType {
  pageTitle: string;
  titleElement: React.ReactNode;
  setPageTitle: (title: string) => void;
  setTitleElement: (element: React.ReactNode) => void;
}

const PageTitleContext = createContext<PageTitleContextType>({
  pageTitle: '',
  titleElement: null,
  setPageTitle: () => {},
  setTitleElement: () => {},
});

export const usePageTitle = () => useContext(PageTitleContext);

export const PageTitleProvider = ({ children }: { children: React.ReactNode }) => {
  const [pageTitle, setPageTitleState] = useState('');
  const [titleElement, setTitleElementState] = useState<React.ReactNode>(null);

  const setPageTitle = (title: string) => {
    setPageTitleState(title);
    setTitleElementState(null);
  };

  const setTitleElement = (element: React.ReactNode) => {
    setTitleElementState(element);
    setPageTitleState('');
  };

  return (
      <PageTitleContext.Provider value={{ pageTitle, titleElement, setPageTitle, setTitleElement }}>
        {children}
      </PageTitleContext.Provider>
  );
};

// src/contexts/PageTitleContext.tsx
import { createContext, useContext, useState } from 'react';

interface PageTitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType>({
  pageTitle: '',
  setPageTitle: () => {},
});

export const usePageTitle = () => useContext(PageTitleContext);

export const PageTitleProvider = ({ children }: { children: React.ReactNode }) => {
  const [title, setTitle] = useState('');

  return (
      <PageTitleContext.Provider value={{ pageTitle: title, setPageTitle: setTitle }}>
        {children}
      </PageTitleContext.Provider>
  );
};

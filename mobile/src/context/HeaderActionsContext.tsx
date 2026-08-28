// ============================================================
// HEADER ACTIONS CONTEXT — acciones contextuales en la topbar
// ============================================================
import React, { createContext, useContext, useState } from 'react';

interface HeaderActionsContextType {
  actions: React.ReactNode;
  setActions: (actions: React.ReactNode) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType>({
  actions: null,
  setActions: () => {},
});

export function HeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<React.ReactNode>(null);
  return (
    <HeaderActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}
// src/providers/EarnPointsProvider.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';

interface EarnPointsContextType {
  isModalVisible: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const EarnPointsContext = createContext<EarnPointsContextType | undefined>(
  undefined
);

export function EarnPointsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  return (
    <EarnPointsContext.Provider
      value={{
        isModalVisible,
        openModal,
        closeModal,
      }}
    >
      {children}
    </EarnPointsContext.Provider>
  );
}

export function useEarnPoints() {
  const context = useContext(EarnPointsContext);
  if (context === undefined) {
    throw new Error('useEarnPoints must be used within an EarnPointsProvider');
  }
  return context;
}

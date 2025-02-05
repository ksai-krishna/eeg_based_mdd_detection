import React, { createContext, useContext, useState } from 'react';

interface UploadContextType {
  files: File[];
  setFiles: (files: File[]) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <UploadContext.Provider value={{ files, setFiles }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadContext must be used within a UploadProvider');
  }
  return context;
};
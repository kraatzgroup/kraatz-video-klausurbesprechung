import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { ToastMessage } from '../components/Toast';
import { setGlobalToastContext, initToastSystem } from '../utils/toastUtils';

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useToast();

  useEffect(() => {
    // Initialize global toast system
    setGlobalToastContext(toast);
    initToastSystem();
  }, [toast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;

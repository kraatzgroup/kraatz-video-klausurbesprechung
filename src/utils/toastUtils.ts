// Utility functions to replace alert() calls with toast notifications

// Global toast functions that can be used anywhere
let globalToastContext: any = null;

export const setGlobalToastContext = (context: any) => {
  globalToastContext = context;
};

export const showSuccessToast = (title: string, message?: string) => {
  if (globalToastContext) {
    globalToastContext.showSuccess(title, message);
  } else {
    console.log(`✅ ${title}${message ? `: ${message}` : ''}`);
  }
};

export const showErrorToast = (title: string, message?: string) => {
  if (globalToastContext) {
    globalToastContext.showError(title, message);
  } else {
    console.error(`❌ ${title}${message ? `: ${message}` : ''}`);
  }
};

export const showWarningToast = (title: string, message?: string) => {
  if (globalToastContext) {
    globalToastContext.showWarning(title, message);
  } else {
    console.warn(`⚠️ ${title}${message ? `: ${message}` : ''}`);
  }
};

export const showInfoToast = (title: string, message?: string) => {
  if (globalToastContext) {
    globalToastContext.showInfo(title, message);
  } else {
    console.info(`ℹ️ ${title}${message ? `: ${message}` : ''}`);
  }
};

// Replace common alert patterns
export const replaceAlert = (message: string) => {
  if (message.includes('erfolgreich') || message.includes('✓')) {
    showSuccessToast(message);
  } else if (message.includes('Fehler') || message.includes('Error')) {
    showErrorToast(message);
  } else if (message.includes('Warnung') || message.includes('Achtung')) {
    showWarningToast(message);
  } else {
    showInfoToast(message);
  }
};

// Override global alert function
export const initToastSystem = () => {
  // Store original alert for fallback
  const originalAlert = window.alert;
  
  // Override alert with toast
  window.alert = (message: string) => {
    replaceAlert(message);
    
    // Fallback to original alert if toast system not available
    if (!globalToastContext) {
      originalAlert(message);
    }
  };
};

export default {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  replaceAlert,
  initToastSystem,
  setGlobalToastContext,
};

'use client';

import { useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, removeToast }: { 
  toasts: Toast[], 
  removeToast: (id: number) => void 
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 transform ${
            toast.type === 'success' ? 'bg-green-500/20 border-green-400/50 text-green-100' :
            toast.type === 'error' ? 'bg-red-500/20 border-red-400/50 text-red-100' :
            'bg-blue-500/20 border-blue-400/50 text-blue-100'
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-center space-x-2 cursor-pointer">
            <span className="text-sm font-medium">{toast.message}</span>
            <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

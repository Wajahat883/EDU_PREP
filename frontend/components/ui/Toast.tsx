import React from "react";
import classNames from "classnames";

interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
  action?: { label: string; onClick: () => void };
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    { id, message, type = "info", duration = 5000, onClose, action, ...props },
    ref,
  ) => {
    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => onClose(id), duration);
        return () => clearTimeout(timer);
      }
    }, [id, duration, onClose]);

    const typeStyles = {
      success:
        "bg-success-50 dark:bg-success-900 border-success-200 dark:border-success-700",
      error:
        "bg-error-50 dark:bg-error-900 border-error-200 dark:border-error-700",
      warning:
        "bg-warning-50 dark:bg-warning-900 border-warning-200 dark:border-warning-700",
      info: "bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700",
    };

    const typeColors = {
      success: "text-success-700 dark:text-success-200",
      error: "text-error-700 dark:text-error-200",
      warning: "text-warning-700 dark:text-warning-200",
      info: "text-primary-700 dark:text-primary-200",
    };

    const icons = {
      success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        className={classNames(
          "flex items-start gap-3 p-4 rounded-lg border",
          "shadow-lg animate-in slide-in-from-right duration-300",
          "transform transition-all",
          typeStyles[type],
        )}
        role="alert"
        {...props}
      >
        <div className={classNames("flex-shrink-0", typeColors[type])}>
          {icons[type]}
        </div>

        <div className="flex-1 min-w-0">
          <p className={classNames("text-sm font-medium", typeColors[type])}>
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className={classNames(
                "text-sm font-medium",
                "px-3 py-1 rounded",
                "transition-colors",
                typeColors[type],
                "hover:bg-black hover:bg-opacity-10",
              )}
            >
              {action.label}
            </button>
          )}

          <button
            onClick={() => onClose(id)}
            className={classNames(
              "flex-shrink-0",
              "text-current opacity-50 hover:opacity-100",
              "transition-opacity",
            )}
            aria-label="Close notification"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

Toast.displayName = "Toast";

// Toast Container
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const ToastContainer = ({
  toasts,
  onClose,
  position = "top-right",
}: ToastContainerProps) => {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={classNames(
        "fixed z-50 pointer-events-none",
        positionClasses[position],
      )}
    >
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = (
    message: string,
    options?: {
      type?: "success" | "error" | "warning" | "info";
      duration?: number;
      action?: { label: string; onClick: () => void };
    },
  ) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type: options?.type || "info",
        duration: options?.duration ?? 5000,
        action: options?.action,
        onClose: () => {},
      },
    ]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const closeAll = () => {
    setToasts([]);
  };

  return { toasts, addToast, removeToast, closeAll };
};

import React from "react";
import classNames from "classnames";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  closeButton?: boolean;
  children: React.ReactNode;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      size = "md",
      closeButton = true,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => {
          document.removeEventListener("keydown", handleEscape);
          document.body.style.overflow = "unset";
        };
      }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
    };

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            ref={ref}
            className={classNames(
              "bg-white dark:bg-neutral-900 rounded-lg shadow-2xl",
              "w-full transform transition-all duration-200",
              "animate-in fade-in zoom-in-95",
              sizeClasses[size],
              className,
            )}
            role="dialog"
            aria-modal="true"
            {...props}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {title}
                </h2>
                {closeButton && (
                  <button
                    onClick={onClose}
                    className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    aria-label="Close modal"
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
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </div>
        </div>
      </>
    );
  },
);

Modal.displayName = "Modal";

// Modal Footer Component
interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "px-6 py-4 border-t border-neutral-200 dark:border-neutral-700",
        "flex items-center justify-end gap-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

ModalFooter.displayName = "ModalFooter";

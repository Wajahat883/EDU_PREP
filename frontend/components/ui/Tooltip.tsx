import React from "react";
import classNames from "classnames";

interface TooltipProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
> {
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: React.ReactNode;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    { content, position = "top", delay = 200, children, className, ...props },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [delayTimer, setDelayTimer] = React.useState<NodeJS.Timeout>();

    const handleMouseEnter = () => {
      const timer = setTimeout(() => setIsVisible(true), delay);
      setDelayTimer(timer);
    };

    const handleMouseLeave = () => {
      if (delayTimer) clearTimeout(delayTimer);
      setIsVisible(false);
    };

    const positionClasses = {
      top: "bottom-full mb-2 -translate-x-1/2 left-1/2",
      bottom: "top-full mt-2 -translate-x-1/2 left-1/2",
      left: "right-full mr-2 top-1/2 -translate-y-1/2",
      right: "left-full ml-2 top-1/2 -translate-y-1/2",
    };

    const arrowClasses = {
      top: "bottom-0 translate-y-full -translate-x-1/2 left-1/2 border-t-current border-t-4 border-l-transparent border-l-4 border-r-transparent border-r-4 border-b-0",
      bottom:
        "top-0 -translate-y-full -translate-x-1/2 left-1/2 border-b-current border-b-4 border-l-transparent border-l-4 border-r-transparent border-r-4 border-t-0",
      left: "right-0 translate-x-full top-1/2 -translate-y-1/2 border-l-current border-l-4 border-t-transparent border-t-4 border-b-transparent border-b-4 border-r-0",
      right:
        "left-0 -translate-x-full top-1/2 -translate-y-1/2 border-r-current border-r-4 border-t-transparent border-t-4 border-b-transparent border-b-4 border-l-0",
    };

    return (
      <div
        ref={ref}
        className={classNames("relative inline-block", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Trigger */}
        <div className="inline-block">{children}</div>

        {/* Tooltip Content */}
        {isVisible && (
          <div
            className={classNames(
              "absolute z-50 px-3 py-2 rounded-md",
              "text-sm font-medium text-white",
              "bg-neutral-900 dark:bg-neutral-800",
              "whitespace-nowrap",
              "pointer-events-none",
              "animate-in fade-in duration-200",
              positionClasses[position],
            )}
            role="tooltip"
          >
            {content}
            {/* Arrow */}
            <div
              className={classNames(
                "absolute w-0 h-0 border-solid",
                "text-neutral-900 dark:text-neutral-800",
                arrowClasses[position],
              )}
            />
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = "Tooltip";

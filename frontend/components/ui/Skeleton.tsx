import React from "react";
import classNames from "classnames";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "text" | "circle" | "rect" | "avatar" | "card";
  width?: string | number;
  height?: string | number;
  count?: number;
  animated?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      type = "rect",
      width,
      height,
      count = 1,
      animated = true,
      className,
      ...props
    },
    ref,
  ) => {
    const baseClasses = "bg-neutral-200 dark:bg-neutral-700 rounded";
    const animationClasses = animated ? "animate-pulse" : "";

    const getTypeClasses = (t: string) => {
      switch (t) {
        case "circle":
          return classNames(baseClasses, "rounded-full", animationClasses);
        case "avatar":
          return classNames(
            baseClasses,
            "rounded-full w-10 h-10",
            animationClasses,
          );
        case "card":
          return classNames(
            baseClasses,
            "rounded-lg p-4 space-y-3",
            animationClasses,
          );
        case "text":
          return classNames(baseClasses, "h-4 rounded", animationClasses);
        default:
          return classNames(baseClasses, animationClasses);
      }
    };

    const dimensions = {
      style: {
        width: width
          ? typeof width === "number"
            ? `${width}px`
            : width
          : undefined,
        height: height
          ? typeof height === "number"
            ? `${height}px`
            : height
          : undefined,
      },
    };

    if (type === "card") {
      return (
        <div
          ref={ref}
          className={classNames(getTypeClasses(type), className)}
          {...props}
        >
          <div className={classNames(baseClasses, "h-32 rounded-md")} />
          <div className="space-y-2">
            <div className={classNames(baseClasses, "h-4 rounded w-3/4")} />
            <div className={classNames(baseClasses, "h-4 rounded w-1/2")} />
          </div>
        </div>
      );
    }

    const elements = Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        ref={i === 0 ? ref : null}
        className={classNames(getTypeClasses(type), className)}
        {...dimensions}
        {...props}
      />
    ));

    if (count > 1) {
      return <div className="space-y-2">{elements}</div>;
    }

    return elements[0];
  },
);

Skeleton.displayName = "Skeleton";

// Skeleton Group for list loading
interface SkeletonListProps {
  count?: number;
  type?: "text" | "card" | "avatar";
  animated?: boolean;
  className?: string;
}

export const SkeletonList = ({
  count = 3,
  type = "text",
  animated = true,
  className,
}: SkeletonListProps) => {
  if (type === "card") {
    return (
      <div className={classNames("space-y-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} type="card" animated={animated} />
        ))}
      </div>
    );
  }

  return (
    <div className={classNames("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton type="text" animated={animated} width="80%" />
          <Skeleton type="text" animated={animated} width="60%" />
        </div>
      ))}
    </div>
  );
};

SkeletonList.displayName = "SkeletonList";

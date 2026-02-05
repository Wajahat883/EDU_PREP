import React from "react";
import classNames from "classnames";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "solid" | "outline" | "gradient";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "neutral";
  status?: "online" | "offline" | "away" | "busy";
  badge?: React.ReactNode;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      initials,
      size = "md",
      variant = "solid",
      color = "primary",
      status,
      badge,
      className,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      xs: "w-6 h-6 text-xs",
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    const statusClasses = {
      online: "bg-success-500",
      offline: "bg-neutral-400",
      away: "bg-warning-500",
      busy: "bg-error-500",
    };

    const variantClasses = {
      solid: {
        primary:
          "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300",
        secondary:
          "bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300",
        success:
          "bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300",
        warning:
          "bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300",
        error:
          "bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300",
        neutral:
          "bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300",
      },
      outline: {
        primary:
          "border-2 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-300",
        secondary:
          "border-2 border-secondary-500 dark:border-secondary-400 text-secondary-600 dark:text-secondary-300",
        success:
          "border-2 border-success-500 dark:border-success-400 text-success-600 dark:text-success-300",
        warning:
          "border-2 border-warning-500 dark:border-warning-400 text-warning-600 dark:text-warning-300",
        error:
          "border-2 border-error-500 dark:border-error-400 text-error-600 dark:text-error-300",
        neutral:
          "border-2 border-neutral-500 dark:border-neutral-400 text-neutral-600 dark:text-neutral-300",
      },
      gradient: {
        primary: "bg-gradient-to-br from-primary-400 to-primary-600 text-white",
        secondary:
          "bg-gradient-to-br from-secondary-400 to-secondary-600 text-white",
        success: "bg-gradient-to-br from-success-400 to-success-600 text-white",
        warning: "bg-gradient-to-br from-warning-400 to-warning-600 text-white",
        error: "bg-gradient-to-br from-error-400 to-error-600 text-white",
        neutral: "bg-gradient-to-br from-neutral-400 to-neutral-600 text-white",
      },
    };

    return (
      <div
        ref={ref}
        className={classNames("relative inline-flex flex-shrink-0", className)}
        {...props}
      >
        {/* Avatar Base */}
        <div
          className={classNames(
            "flex items-center justify-center rounded-full font-semibold overflow-hidden",
            sizeClasses[size],
            variantClasses[variant][color],
            src && "p-0",
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials || "?"}</span>
          )}
        </div>

        {/* Status Indicator */}
        {status && (
          <div
            className={classNames(
              "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-neutral-900",
              "w-2.5 h-2.5",
              size === "xs" && "w-2 h-2",
              size === "sm" && "w-2 h-2",
              size === "lg" && "w-3 h-3",
              size === "xl" && "w-4 h-4",
              statusClasses[status],
            )}
            aria-label={`User is ${status}`}
          />
        )}

        {/* Badge */}
        {badge && <div className="absolute -top-1 -right-1">{badge}</div>}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

// Avatar Group
interface AvatarGroupProps {
  avatars: Array<Omit<AvatarProps, "ref">>;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AvatarGroup = ({
  avatars,
  max = 3,
  size = "md",
  className,
}: AvatarGroupProps) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={classNames("flex -space-x-2", className)} role="group">
      {displayAvatars.map((avatar, idx) => (
        <div key={idx} className="ring-2 ring-white dark:ring-neutral-900">
          <Avatar {...avatar} size={size} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="ring-2 ring-white dark:ring-neutral-900">
          <Avatar
            initials={`+${remainingCount}`}
            size={size}
            variant="solid"
            color="neutral"
          />
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = "AvatarGroup";

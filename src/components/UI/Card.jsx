import { forwardRef } from "react";

const Card = forwardRef(function Card(
  { children, className = "", interactive = false, onClick, ...rest },
  ref
) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={[
        "rounded-2xl border border-border bg-surface shadow-sm",
        interactive &&
          "transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer",
        onClick && !interactive &&
          "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
});

export default Card;

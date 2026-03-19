import { forwardRef } from "react";
import { motion } from "framer-motion";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/50",
  secondary:
    "bg-secondary text-white hover:bg-secondary-dark focus-visible:ring-secondary/50",
  ghost:
    "bg-transparent text-text hover:bg-black/5 focus-visible:ring-primary/50",
  danger:
    "bg-danger text-white hover:bg-red-600 focus-visible:ring-danger/50",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    children,
    className = "",
    disabled = false,
    loading = false,
    onClick,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      whileHover={isDisabled ? {} : { scale: 1.03 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </motion.button>
  );
});

export default Button;

import { forwardRef, useId } from "react";

/* ─── Base text input ─── */
const Input = forwardRef(function Input(
  { label, error, className = "", type = "text", ...rest },
  ref
) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text"
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        type={type}
        className={[
          "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text",
          "placeholder:text-muted",
          "transition-shadow duration-150",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
          error && "border-danger focus:ring-danger/40 focus:border-danger",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />

      {error && (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      )}
    </div>
  );
});

/* ─── Date input ─── */
const DateInput = forwardRef(function DateInput(
  { label, error, className = "", ...rest },
  ref
) {
  return (
    <Input
      ref={ref}
      type="date"
      label={label}
      error={error}
      className={className}
      {...rest}
    />
  );
});

/* ─── Number stepper (+/−) ─── */
function NumberStepper({
  label,
  value = 0,
  min = 0,
  max = Infinity,
  onChange,
  className = "",
}) {
  const id = useId();

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
      )}

      <div className="inline-flex items-center gap-0 rounded-xl border border-border overflow-hidden w-fit">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex items-center justify-center w-10 h-10 bg-surface text-text
                     hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                     cursor-pointer"
          aria-label="Decrease"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <span
          id={id}
          className="flex items-center justify-center w-12 h-10 text-sm font-semibold text-text
                     bg-surface border-x border-border select-none"
        >
          {value}
        </span>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex items-center justify-center w-10 h-10 bg-surface text-text
                     hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                     cursor-pointer"
          aria-label="Increase"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Input;
export { Input, DateInput, NumberStepper };

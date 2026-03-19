export default function StepperInput({ steps = [], currentStep = 0 }) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li
              key={index}
              className="flex flex-1 flex-col items-center relative"
            >
              {/* Connector line (skip for first step) */}
              {index > 0 && (
                <div
                  className="absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2"
                  aria-hidden
                >
                  <div
                    className={`h-full transition-colors duration-300 ${
                      isCompleted ? "bg-success" : "bg-border"
                    }`}
                  />
                </div>
              )}

              {/* Circle */}
              <div
                className={[
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                  "border-2 text-sm font-semibold transition-all duration-300",
                  isCompleted &&
                    "border-success bg-success text-white",
                  isCurrent &&
                    "border-primary bg-primary text-white shadow-md shadow-primary/30",
                  !isCompleted &&
                    !isCurrent &&
                    "border-border bg-surface text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M2.5 7.5L5.5 10.5L11.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              <span
                className={[
                  "mt-2 text-xs text-center leading-tight max-w-[5rem]",
                  isCurrent ? "font-semibold text-text" : "text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

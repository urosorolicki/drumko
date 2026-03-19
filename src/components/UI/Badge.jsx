const variantStyles = {
  fuel: "bg-stone-100 text-stone-600",
  food: "bg-amber-100 text-amber-700",
  cafe: "bg-yellow-100 text-yellow-700",
  attraction: "bg-purple-100 text-purple-700",
  rest: "bg-green-100 text-green-700",
  hotel: "bg-blue-100 text-blue-700",
  default: "bg-orange-100 text-primary",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5",
        styles,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

import { motion } from "framer-motion";

export default function ProgressBar({
  value = 0,
  className = "",
  color = "bg-primary",
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Progress</span>
        <span className="text-xs font-semibold text-text">
          {Math.round(clamped)}%
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/50">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
    </div>
  );
}

import { cn } from "../../lib/utils";

const colors = {
  default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  pk: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  non_pk: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  both: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
};

export default function Badge({ children, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border",
        colors[variant] || colors.default,
        className
      )}
    >
      {children}
    </span>
  );
}

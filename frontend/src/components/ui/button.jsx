import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-accent-500 hover:bg-accent-600 text-white border-accent-500 hover:border-accent-600",
  secondary: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
  ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
  danger: "bg-red-500 hover:bg-red-600 text-white border-red-500",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = forwardRef(({ className, variant = "primary", size = "md", children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center font-medium rounded-md border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {children}
  </button>
));

Button.displayName = "Button";
export default Button;

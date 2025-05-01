import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Travel advisor logo SVG component
export const TravelAdvisorLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-1 text-yellow-500"
  >
    <circle cx="12" cy="12" r="10" fill="#FBBF24" stroke="none" />
    <path
      d="M12 7v2M12 15v2M7 12h2M15 12h2"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    <path
      d="M9 9l1.5 1.5M13.5 13.5L15 15M9 15l1.5-1.5M13.5 10.5L15 9"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
  </svg>
);

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        ai: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100/80 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function CustomBadge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon}
      {children}
    </div>
  );
}

export { CustomBadge, badgeVariants };
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-pantone-orange text-primary-foreground shadow-md hover:bg-pantone-orange/90 hover:shadow-lg active:scale-[0.98]",
        outline:
          "border border-foreground/20 bg-background text-foreground shadow-sm hover:bg-foreground hover:text-background dark:border-foreground/30",
        ghost:
          "border border-transparent text-foreground hover:bg-wheat/50 dark:hover:bg-gunmetal/50",
        destructive:
          "border border-transparent bg-destructive text-white shadow-sm hover:bg-destructive/90",
        subtle:
          "border border-light-silver/50 bg-muted text-foreground shadow-sm hover:bg-muted/80 dark:border-gunmetal/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs font-medium",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

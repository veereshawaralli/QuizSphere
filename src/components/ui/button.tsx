import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-aurora text-background shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.55)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_hsl(var(--primary)/0.75)]",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 hover:-translate-y-0.5",
        outline: "border border-foreground/20 bg-card/40 text-foreground backdrop-blur-md hover:border-primary/60 hover:text-primary",
        secondary: "bg-secondary text-secondary-foreground border border-foreground/10 hover:border-primary/40",
        ghost: "bg-transparent text-foreground hover:bg-foreground/8",
        link: "text-foreground underline underline-offset-4 decoration-primary/40 hover:decoration-primary",
        candy: "bg-gradient-aurora text-background shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.55)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-[0.62rem]",
        lg: "h-14 px-9",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

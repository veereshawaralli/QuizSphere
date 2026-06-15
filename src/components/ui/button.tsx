import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-mono text-[0.72rem] uppercase tracking-[0.18em] ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background border border-foreground hover:bg-background hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground border border-destructive hover:bg-transparent hover:text-destructive",
        outline: "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        secondary: "bg-secondary text-secondary-foreground border border-foreground/15 hover:border-foreground",
        ghost: "bg-transparent text-foreground hover:bg-foreground/5",
        link: "text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground",
        candy: "bg-foreground text-background border border-foreground hover:bg-background hover:text-foreground",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-[0.65rem]",
        lg: "h-14 px-8",
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

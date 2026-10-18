"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SharedActionButtonProps extends ComponentProps<typeof Button> {
  icon?: ReactNode;
}

export function SharedActionButton({
  children,
  className,
  icon,
  ...props
}: SharedActionButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "group relative h-10 gap-2 self-start overflow-hidden rounded-[10px] px-5 py-2.5 sm:self-auto",
        "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground",
        "shadow-md shadow-primary/20 transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 hover:from-primary/95 hover:to-primary/85",
        "active:translate-y-0 active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]"
      >
        <span className="relative h-full w-8 bg-white/20" />
      </span>

      {icon && (
        <span
          aria-hidden="true"
          className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110 [&_svg]:h-full [&_svg]:w-full"
        >
          {icon}
        </span>
      )}

      <span className="relative z-10 font-semibold tracking-wide">{children}</span>
    </Button>
  );
}

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

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
        // Performance status variants (no hover change)
        excellent: "border-blue-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        success: "border-green-200 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        warning: "border-yellow-200 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        critical: "border-red-200 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        // Cofound brand variants
        "cofound-success": "border-cofound-green/30 bg-cofound-green/20 text-cofound-green",
        "cofound-info": "border-cofound-blue-light/30 bg-cofound-blue-light/20 text-cofound-blue-light",
        "cofound-primary": "border-transparent bg-cofound-blue-dark text-cofound-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

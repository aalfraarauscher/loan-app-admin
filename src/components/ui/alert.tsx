import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: 
          "bg-gray-50 border-gray-600 text-gray-600 [&>svg]:text-gray-600 ",
        info: 
          "bg-blue-50 border-blue-600 text-blue-600 [&>svg]:text-blue-600 " ,
        success: 
          "bg-green-50 border-green-600 text-green-600 [&>svg]:text-green-600 " ,       
        warning: 
          "bg-amber-50 border-amber-600 text-amber-600 [&>svg]:text-amber-600 " ,
        destructive: 
          "bg-red-50 border-red-600 text-red-600 [&>svg]:text-red-600 " 
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Map variants to their default icons
const variantIcons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ElementType | null
  hideIcon?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", icon, hideIcon = false, children, ...props }, ref) => {
    // Use custom icon if provided, otherwise use default for variant
    const Icon = icon === null ? null : (icon || variantIcons[variant || "default"])
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {!hideIcon && Icon && <Icon className="h-4 w-4" />}
        {children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, type AlertProps }
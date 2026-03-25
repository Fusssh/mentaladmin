import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg"
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <Loader2
      className={cn("animate-spin text-primary-600", sizeClasses[size], className)}
      {...props}
    />
  )
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-2xl">
      <Spinner />
    </div>
  )
}

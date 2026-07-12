import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  fullPage?: boolean
  label?: string
}

export function Loading({
  className,
  size = "md",
  fullPage = false,
  label = "Loading operations...",
}: LoadingProps) {
  const spinnerSizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  }[size]

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={cn(
          "animate-spin rounded-full border-t-primary border-r-transparent border-b-primary border-l-transparent",
          spinnerSizeClass,
          className
        )}
      />
      {label && (
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          {label}
        </span>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

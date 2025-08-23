import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  message = "Loading...", 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-16 w-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <Loader2 className={`animate-spin text-[#FF5757] ${sizeClasses[size]}`} />
      {message && (
        <p className="text-lg font-medium text-gray-600">{message}</p>
      )}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  message?: string;
}

export function LoadingPage({ 
  title = "Loading...", 
  message = "Please wait while we process your request." 
}: LoadingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffe26d] p-4">
      <div className="neo-card bg-white text-center p-12 -rotate-1 space-y-6">
        <LoadingSpinner size="lg" />
        <div>
          <p className="text-2xl font-bold mb-2">{title}</p>
          <p className="text-lg font-medium max-w-md mx-auto text-gray-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

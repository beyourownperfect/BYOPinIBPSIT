import { Button } from "../components/ui";
import { Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <FileQuestion className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-mono mb-2">404</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Page not found. The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => { window.location.href = "/dashboard"; }}>
          <Home className="w-4 h-4 mr-1.5" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

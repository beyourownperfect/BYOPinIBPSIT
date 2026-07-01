import { Component } from "react";
import { Button } from "./ui";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md p-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {this.props.pageName || "This page"} encountered an error.
            </p>
            <p className="text-xs text-gray-400 font-mono mb-6 bg-gray-100 dark:bg-gray-800 p-2 rounded max-w-full overflow-hidden">
              {this.state.error?.message || "Unknown error"}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => this.setState({ hasError: false, error: null })}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => { window.location.href = "/dashboard"; }}>
                <Home className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

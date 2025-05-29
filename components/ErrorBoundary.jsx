"use client";

import React from "react";
import { ErrorLogger, ErrorCreators, ErrorTypes } from "@/lib/errorHandler";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    const appError = ErrorCreators.internalError(
      `React Error Boundary: ${error.message}`,
      error
    );

    ErrorLogger.log(appError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorId: this.state.errorId,
      props: this.props.context || {},
    });

    this.setState({
      error,
      errorInfo,
    });

    // Report to external service in production
    if (process.env.NODE_ENV === "production" && this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReportIssue = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error details to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert(
          "Error details copied to clipboard. Please paste this information when reporting the issue."
        );
      })
      .catch(() => {
        console.log("Error details:", errorDetails);
        alert(
          "Please check the console for error details to include in your report."
        );
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md mx-auto text-center">
            <div className="text-error mb-6">
              <svg
                className="w-16 h-16 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-base-content mb-4">
              {this.props.title || "Something went wrong"}
            </h2>

            <p className="text-base-content/70 mb-6">
              {this.props.message ||
                "We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists."}
            </p>

            {process.env.NODE_ENV === "development" && (
              <div className="bg-base-200 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-bold text-sm mb-2">
                  Error Details (Development):
                </h3>
                <pre className="text-xs text-error overflow-auto max-h-32">
                  {this.state.error?.message}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="btn btn-outline"
              >
                Refresh Page
              </button>

              {this.props.showReportButton !== false && (
                <button
                  onClick={this.handleReportIssue}
                  className="btn btn-ghost btn-sm"
                >
                  Report Issue
                </button>
              )}
            </div>

            {this.state.errorId && (
              <p className="text-xs text-base-content/50 mt-4">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = (
  WrappedComponent,
  errorBoundaryProps = {}
) => {
  const ComponentWithErrorBoundary = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ComponentWithErrorBoundary;
};

// Specialized error boundaries for different contexts
export const PageErrorBoundary = ({ children, pageName }) => (
  <ErrorBoundary
    title="Page Error"
    message={`There was an error loading the ${pageName || "page"}. Please try refreshing or navigate to a different page.`}
    context={{ page: pageName }}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, componentName }) => (
  <ErrorBoundary
    title="Component Error"
    message="This component encountered an error. The rest of the page should still work normally."
    context={{ component: componentName }}
    showReportButton={false}
  >
    {children}
  </ErrorBoundary>
);

export const AsyncErrorBoundary = ({ children }) => (
  <ErrorBoundary
    title="Loading Error"
    message="There was an error loading this content. Please try again."
    fallback={(error, retry) => (
      <div className="text-center p-8">
        <div className="text-error mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-base-content/70 mb-4">Failed to load content</p>
        <button onClick={retry} className="btn btn-primary btn-sm">
          Retry
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;

"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  contextName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ContextErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Context Error Boundary (${this.props.contextName}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">{this.props.contextName} Error</h3>
          <p className="text-red-600 mb-2">
            Something went wrong with the {this.props.contextName.toLowerCase()} context.
          </p>
          {this.state.error && (
            <details className="text-sm text-red-500">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for multiple contexts with error boundaries
interface ContextWrapperProps {
  children: ReactNode;
  contexts: Array<{
    name: string;
    provider: React.ComponentType<{ children: ReactNode }>;
  }>;
}

export function ContextWrapper({ children, contexts }: ContextWrapperProps) {
  return contexts.reduceRight((wrapped, context) => {
    const Provider = context.provider;
    return (
      <ContextErrorBoundary key={context.name} contextName={context.name}>
        <Provider>{wrapped}</Provider>
      </ContextErrorBoundary>
    );
  }, children);
}

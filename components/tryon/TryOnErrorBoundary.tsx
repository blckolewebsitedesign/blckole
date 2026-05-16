"use client";

import styles from "components/tryon/tryon.module.css";
import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
};

type State = {
  hasError: boolean;
  message: string | null;
};

export class TryOnErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Something went wrong in the try-on scene.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[try-on] Scene error", error, info.componentStack);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className={styles.sceneErrorOverlay} role="alert">
        <div className={styles.sceneErrorCard}>
          <h2>Try-on unavailable</h2>
          <p>
            {this.state.message ??
              "Something went wrong while loading the 3D scene."}
          </p>
          <button
            type="button"
            className={styles.sceneErrorButton}
            onClick={this.handleRetry}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}

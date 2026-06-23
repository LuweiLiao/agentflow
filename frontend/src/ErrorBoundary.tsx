/* AgentFlow — ErrorBoundary (P1-fix)
 *
 * Top-level React error boundary. Catches render/lifecycle errors from any
 * descendant so the user sees a recoverable error screen instead of a blank
 * white page.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { radius } from "./theme";  // #2: token-driven borderRadius
import { IconClose, IconReset } from "./icons";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#0f1117",
            color: "#e8edf5",
            fontFamily: "system-ui, sans-serif",
            gap: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ color: "#f87171" }}><IconClose size={48} /></div>
          <h1 style={{ margin: 0, fontSize: 18 }}>应用遇到错误</h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#a8b3c8",
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            {this.state.error?.message || "未知错误"}
          </p>
          <button
            onClick={this.handleReset}
            className="af-error-retry-btn"
            style={{
              padding: "8px 20px",
              border: "1px solid #374151",
              borderRadius: radius.md,  // #2: was hardcoded 6 — now uses token
              background: "#232838",
              color: "#e8edf5",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <IconReset size={16} /> 重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

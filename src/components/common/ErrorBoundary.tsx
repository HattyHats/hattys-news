import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Hatty's News Terminal Exception:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030303] text-[#f0f0f0] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md p-6 rounded-2xl border border-red-500/40 bg-[#0c0c0f] shadow-2xl space-y-4">
            <div className="inline-flex p-3 rounded-full bg-red-500/15 border border-red-500/30 text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl tracking-wide text-red-500">
              TERMINAL INTERRUPT DETECTED
            </h1>
            <p className="font-mono text-xs text-gray-400 leading-relaxed">
              An unexpected render anomaly occurred. Your cached stories and preferences are preserved.
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[10px] text-red-400 overflow-x-auto text-left">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RESTART TERMINAL</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

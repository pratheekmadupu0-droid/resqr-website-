import React, { Component } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export class GlobalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorId: null };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorId: Date.now().toString(36)
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log cleanly to console for engineering diagnosis without exposing to UI
        console.error('[RESQR Global Error Boundary]: Component render failure caught.', {
            message: error?.message,
            stack: error?.stack,
            componentStack: errorInfo?.componentStack
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, errorId: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#040812] flex items-center justify-center p-6 text-white font-sans selection:bg-primary/30">
                    <div className="relative max-w-lg w-full bg-[#0b1329]/90 border border-white/10 p-8 sm:p-10 rounded-[32px] text-center space-y-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
                        {/* Background ambient glow */}
                        <div className="pointer-events-none absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />

                        {/* Branding Icon */}
                        <div className="relative w-20 h-20 bg-primary/10 border border-primary/20 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-inner shadow-primary/20">
                            <ShieldAlert size={44} className="animate-pulse" />
                        </div>

                        {/* Title and message */}
                        <div className="space-y-3 relative z-10">
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.25em]">
                                SYSTEM RECOVERY
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight font-poppins text-white">
                                Something went wrong.
                            </h1>
                            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                                Something went wrong. Please refresh the page.
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                                Incident Ref: {this.state.errorId || 'ERR_RECOVERABLE'}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3 pt-2 relative z-10">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black italic uppercase tracking-wider text-xs shadow-xl shadow-primary/25 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
                            >
                                <RefreshCw size={16} /> Reload RESQR
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl font-black italic uppercase tracking-wider text-xs border border-white/10 flex items-center justify-center gap-2 transition-all duration-200"
                            >
                                <Home size={15} /> Return to Homepage
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;

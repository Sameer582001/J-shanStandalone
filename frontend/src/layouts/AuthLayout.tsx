import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>

            <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl relative z-10 border-white/5 shadow-2xl shadow-sky-900/20">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;

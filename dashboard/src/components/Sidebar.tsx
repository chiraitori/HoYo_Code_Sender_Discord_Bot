'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Extract serverId from path if available
    const serverIdMatch = pathname?.match(/\/server\/(\d+)/);
    const serverId = serverIdMatch ? serverIdMatch[1] : null;

    const menuItems = [
        { name: 'Overview', icon: '📊', path: serverId ? `/dashboard/server/${serverId}` : '/servers' },
        { name: 'Configuration', icon: '⚙️', path: serverId ? `/dashboard/server/${serverId}/config` : '#' }, // Placeholder for now
        { name: 'Bot Settings', icon: '🤖', path: serverId ? `/dashboard/server/${serverId}/settings` : '#' },
        // Logging and Premium removed as requested
    ];

    const commonClasses = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium";
    const activeClasses = "bg-violet-600 text-white shadow-lg shadow-violet-600/20";
    const inactiveClasses = "text-violet-200/60 hover:text-white hover:bg-white/5";

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 glass-button p-2 rounded-lg"
            >
                <span className="text-2xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-white/5 bg-black/40 backdrop-blur-xl transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-6">

                    {/* Logo / Brand */}
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-accent-cyan flex items-center justify-center shadow-lg">
                            <span className="text-xl">⚡</span>
                        </div>
                        <div>
                            <h1 className="font-black text-white leading-tight tracking-tight">HoYo<span className="text-accent-cyan">Codes</span></h1>
                            <p className="text-xs text-violet-300/50 font-medium tracking-wide">DASHBOARD</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`${commonClasses} ${isActive ? activeClasses : inactiveClasses}`}
                                >
                                    <span className="text-xl opacity-80">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User / Footer */}
                    <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                        {/* Back to Servers */}
                        <Link
                            href="/servers"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-300/60 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                        >
                            <span>🔙</span>
                            <span>Switch Server</span>
                        </Link>

                        {/* Exit */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-300/40 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            <span>🚪</span>
                            <span>Exit Dashboard</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}

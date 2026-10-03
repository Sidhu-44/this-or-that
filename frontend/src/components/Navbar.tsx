import React from 'react';
import { Calendar, Archive, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: 'today' | 'archive' | 'admin';
  onSelectTab: (tab: 'today' | 'archive' | 'admin') => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isAdminLoggedIn }) => {
  return (
    <header className="sticky top-0 z-40 bg-warm-100/85 backdrop-blur-md border-b border-warm-300/80 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('today')}
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl p-1"
          aria-label="Go to Today's Poll"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent to-orange-400 flex items-center justify-center shadow-sm shadow-accent/30 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-white text-base tracking-tighter">TT</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-ink-900 text-lg leading-tight tracking-tight">
              This<span className="text-accent">Or</span>That
            </span>
            <span className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider flex items-center gap-1">
              Daily Vote <Sparkles className="w-2.5 h-2.5 text-accent inline" />
            </span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('today')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              currentTab === 'today'
                ? 'bg-ink-900 text-white shadow-sm'
                : 'text-ink-600 hover:text-ink-900 hover:bg-warm-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Today</span>
          </button>

          <button
            onClick={() => onSelectTab('archive')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              currentTab === 'archive'
                ? 'bg-ink-900 text-white shadow-sm'
                : 'text-ink-600 hover:text-ink-900 hover:bg-warm-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Archive</span>
          </button>

          {/* Admin Access Button */}
          <button
            onClick={() => onSelectTab('admin')}
            title={isAdminLoggedIn ? "Admin Dashboard (Logged In)" : "Admin Access"}
            className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              currentTab === 'admin'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-600 hover:text-ink-900 hover:bg-warm-200'
            }`}
            aria-label="Admin Management"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            {isAdminLoggedIn && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-warm-100" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { TrendingUp, User as UserIcon, LogIn, ShieldAlert } from 'lucide-react';
import { Home } from './components/Home';
import { About } from './components/About';
import { Leaderboard } from './components/Leaderboard';
import { RecordingDetail } from './components/RecordingDetail';
import { Methodology, ApiDocs, Privacy } from './components/StaticPages';
import { Analyzer } from './components/Analyzer';
import { VoiceDebate } from './components/VoiceDebate';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DiscourseProvider } from './context/DiscourseContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Navbar() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-[#141414] p-6 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="relative flex items-center justify-center">

        {/* Logo - absolute left */}
        <Link to="/" className="absolute left-0 flex items-center gap-3 hover:opacity-70 transition-opacity">
          <div className="w-10 h-10 bg-[#141414] flex items-center justify-center rounded-sm">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">Logos</h1>
            <p className="text-[10px] font-mono uppercase opacity-50 tracking-widest">Reasoning Analyzer</p>
          </div>
        </Link>

        {/* Nav - truly centered */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono uppercase tracking-widest">
          <Link to="/" className={cn("hover:opacity-100 transition-opacity", isActive('/') ? "opacity-100 font-bold" : "opacity-50")}>Home</Link>
          <Link to="/analyze" className={cn("hover:opacity-100 transition-opacity", isActive('/analyze') ? "opacity-100 font-bold" : "opacity-50")}>Analyze</Link>
          <Link to="/voice" className={cn("hover:opacity-100 transition-opacity", isActive('/voice') ? "opacity-100 font-bold" : "opacity-50")}>Voice</Link>
          <Link to="/leaderboard" className={cn("hover:opacity-100 transition-opacity", isActive('/leaderboard') ? "opacity-100 font-bold" : "opacity-50")}>Leaderboard</Link>
          <Link to="/about" className={cn("hover:opacity-100 transition-opacity", isActive('/about') ? "opacity-100 font-bold" : "opacity-50")}>About</Link>
        </nav>

        {/* Login - absolute right */}
        <div className="absolute right-0 flex items-center gap-6">
          {!loading && (
            user ? (
              <div className="flex items-center gap-6">
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-[11px] font-mono uppercase tracking-widest text-rose-600 hover:opacity-70 transition-opacity flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest hover:opacity-70 transition-opacity">
                  <UserIcon className="w-4 h-4" />
                  <span>{user.username}</span>
                </Link>
              </div>
            ) : (
              <Link to="/auth" className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest bg-[#141414] text-white px-4 py-2 rounded-sm hover:bg-[#333] transition-colors">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )
          )}
        </div>

      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DiscourseProvider>
        <Router>
          <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
            <Navbar />
            
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analyze" element={<Analyzer />} />
              <Route path="/voice" element={<VoiceDebate />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/leaderboard/:id" element={<Leaderboard />} />
              <Route path="/recordings/:id" element={<RecordingDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>

            <footer className="max-w-7xl mx-auto p-6 mt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-[10px] font-mono uppercase opacity-40">
                © 2026 Logos Argument Analysis Systems
              </div>
              <div className="flex gap-6 text-[10px] font-mono uppercase opacity-40">
                <Link to="/methodology" className="hover:opacity-100 transition-opacity">Methodology</Link>
                <Link to="/api-docs" className="hover:opacity-100 transition-opacity">API Docs</Link>
                <Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
              </div>
            </footer>
          </div>
        </Router>
      </DiscourseProvider>
    </AuthProvider>
  );
}

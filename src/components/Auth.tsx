import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const email = `${username}@discourse.app`;
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, username);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      <h2 className="text-2xl font-serif italic mb-6 text-center">
        {isLogin ? 'Welcome Back' : 'Join the Discourse'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase opacity-50">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-[#f5f5f5] border border-black/10 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase opacity-50">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input
              type="password"
              className="w-full pl-10 pr-4 py-2 bg-[#f5f5f5] border border-black/10 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-rose-600 text-[10px] font-mono uppercase">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#141414] text-white py-3 font-mono uppercase text-xs tracking-widest hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

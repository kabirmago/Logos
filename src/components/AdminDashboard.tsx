import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, MessageSquare, TrendingUp, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Stats {
  totalUsers: number;
  totalDebates: number;
  avgScore: number;
  avgConstructiveness: number;
  recentActivity: {
    title: string;
    username: string;
    timestamp: any;
  }[];
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const debatesSnap = await getDocs(collection(db, 'leaderboard'));
      
      const debates = debatesSnap.docs.map(doc => doc.data());
      const totalDebates = debates.length;
      const avgScore = totalDebates > 0 
        ? debates.reduce((acc, d) => acc + (d.score || 0), 0) / totalDebates 
        : 0;
      const avgConstructiveness = totalDebates > 0 
        ? debates.reduce((acc, d) => acc + (d.constructiveness || 0), 0) / totalDebates 
        : 0;

      const recentQuery = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'), limit(5));
      const recentSnap = await getDocs(recentQuery);
      const recentActivity = recentSnap.docs.map(doc => ({
        title: doc.data().title,
        username: doc.data().author,
        timestamp: doc.data().timestamp
      }));

      setStats({
        totalUsers: usersSnap.size,
        totalDebates,
        avgScore: Math.round(avgScore),
        avgConstructiveness: Math.round(avgConstructiveness),
        recentActivity
      });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif italic flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-600" /> Admin Control Panel
          </h1>
          <p className="text-[10px] font-mono uppercase opacity-50 mt-1 tracking-widest">System Insights & Analytics</p>
        </div>
        <button 
          onClick={fetchStats}
          className="text-[10px] font-mono uppercase bg-[#141414] text-white px-4 py-2 hover:bg-[#333] transition-colors"
        >
          Refresh Data
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-600' },
          { label: 'Total Debates', value: stats?.totalDebates, icon: MessageSquare, color: 'text-indigo-600' },
          { label: 'Avg Persuasion', value: `${stats?.avgScore}%`, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Avg Constructive', value: `${stats?.avgConstructiveness}%`, icon: Activity, color: 'text-amber-600' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <span className="text-[10px] font-mono uppercase opacity-50">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-8">
          <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xl font-serif italic mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recent Activity
            </h2>
            <div className="space-y-4">
              {stats?.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#f5f5f5] border border-black/5">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-[10px] font-mono uppercase opacity-50 mt-1">
                      By <span className="text-black">{activity.username}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono opacity-40">
                    {activity.timestamp?.toDate ? activity.timestamp.toDate().toLocaleDateString() : new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {stats?.recentActivity.length === 0 && (
                <div className="text-center py-12 opacity-30 font-mono uppercase text-xs">
                  No activity recorded yet
                </div>
              )}
            </div>
          </section>
        </div>

        {/* System Health */}
        <div className="lg:col-span-4">
          <section className="bg-[#141414] text-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)]">
            <h2 className="text-xl font-serif italic mb-6 text-white">System Status</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
                  <span>Database Load</span>
                  <span>Normal</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[15%]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
                  <span>API Latency</span>
                  <span>24ms</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[8%]"></div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-mono uppercase tracking-widest">All Systems Operational</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Helper for tailwind classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, MessageSquare, TrendingUp, Activity, ShieldAlert, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserRecord {
  id: string;
  username: string;
  bio: string;
  role: string;
  createdAt: string;
  debates?: DebateRecord[];
}

interface DebateRecord {
  id: string;
  title: string;
  score: number;
  constructiveness: number;
  timestamp: any;
  userId?: string;
}

interface Stats {
  totalUsers: number;
  totalDebates: number;
  avgScore: number;
  avgConstructiveness: number;
  recentActivity: { title: string; username: string; timestamp: any }[];
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [view, setView] = useState<'dashboard' | 'users' | 'userDetail'>('dashboard');
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

      const debates = debatesSnap.docs.map(d => d.data());
      const totalDebates = debates.length;
      const avgScore = totalDebates > 0
        ? debates.reduce((acc, d) => acc + (d.score || 0), 0) / totalDebates : 0;
      const avgConstructiveness = totalDebates > 0
        ? debates.reduce((acc, d) => acc + (d.constructiveness || 0), 0) / totalDebates : 0;

      const recentQ = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'), limit(5));
      const recentSnap = await getDocs(recentQ);
      const recentActivity = recentSnap.docs.map(d => ({
        title: d.data().title || 'Untitled',
        username: d.data().author || d.data().username || 'Unknown',
        timestamp: d.data().timestamp
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const userList: UserRecord[] = snap.docs.map(d => ({
        id: d.id,
        username: d.data().username || 'Unknown',
        bio: d.data().bio || '',
        role: d.data().role || 'user',
        createdAt: d.data().createdAt || ''
      }));
      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (u: UserRecord) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'leaderboard'), where('userId', '==', u.id));
      const snap = await getDocs(q);
      const debates: DebateRecord[] = snap.docs.map(d => ({
        id: d.id,
        title: d.data().title || 'Untitled',
        score: d.data().score || 0,
        constructiveness: d.data().constructiveness || 0,
        timestamp: d.data().timestamp,
        userId: d.data().userId
      }));
      setSelectedUser({ ...u, debates });
      setView('userDetail');
    } catch (err) {
      console.error('Failed to fetch user detail', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDebate = async (id: string) => {
    if (!confirm('Delete this debate from the leaderboard?')) return;
    await deleteDoc(doc(db, 'leaderboard', id));
    if (selectedUser) {
      setSelectedUser({
        ...selectedUser,
        debates: selectedUser.debates?.filter(d => d.id !== id)
      });
    }
    fetchStats();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
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

  if (view === 'userDetail' && selectedUser) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <button onClick={() => setView('users')}
          className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-3 h-3" /> Back to Users
        </button>
        <header>
          <h1 className="text-3xl font-serif italic">{selectedUser.username}</h1>
          <p className="text-[10px] font-mono uppercase opacity-50 mt-1 tracking-widest">
            {selectedUser.role} · Joined {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
          </p>
          {selectedUser.bio && <p className="mt-2 text-sm opacity-70">{selectedUser.bio}</p>}
        </header>
        <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="text-xl font-serif italic mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Leaderboard Debates ({selectedUser.debates?.length || 0})
          </h2>
          <div className="space-y-3">
            {selectedUser.debates && selectedUser.debates.length > 0 ? selectedUser.debates.map(debate => (
              <motion.div key={debate.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-[#f5f5f5] border border-black/5">
                <div>
                  <p className="text-sm font-medium">{debate.title}</p>
                  <p className="text-[10px] font-mono uppercase opacity-50 mt-1">
                    Score: {Math.round(debate.score)}% · Constructiveness: {Math.round(debate.constructiveness)}% · {formatDate(debate.timestamp)}
                  </p>
                </div>
                <button onClick={() => deleteDebate(debate.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 transition-colors rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            )) : (
              <div className="text-center py-12 opacity-30 font-mono uppercase text-xs">No leaderboard entries</div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (view === 'users') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <button onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <header>
          <h1 className="text-3xl font-serif italic flex items-center gap-3"><Users className="w-8 h-8" /> All Users</h1>
          <p className="text-[10px] font-mono uppercase opacity-50 mt-1 tracking-widest">{users.length} registered users</p>
        </header>
        <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="space-y-2">
            {users.map(u => (
              <motion.button key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => fetchUserDetail(u)}
                className="w-full flex items-center justify-between p-4 bg-[#f5f5f5] border border-black/5 hover:bg-[#ececec] transition-colors text-left">
                <div>
                  <p className="text-sm font-medium">{u.username}</p>
                  <p className="text-[10px] font-mono uppercase opacity-50 mt-1">
                    {u.role} · Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase opacity-30">View →</span>
              </motion.button>
            ))}
          </div>
        </section>
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
        <button onClick={fetchStats} className="text-[10px] font-mono uppercase bg-[#141414] text-white px-4 py-2 hover:bg-[#333] transition-colors">
          Refresh Data
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-600' },
          { label: 'Total Debates', value: stats?.totalDebates, icon: MessageSquare, color: 'text-indigo-600' },
          { label: 'Avg Persuasion', value: `${stats?.avgScore}%`, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Avg Constructive', value: `${stats?.avgConstructiveness}%`, icon: Activity, color: 'text-amber-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-[10px] font-mono uppercase opacity-50">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xl font-serif italic mb-6 flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</h2>
            <div className="space-y-4">
              {stats?.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#f5f5f5] border border-black/5">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-[10px] font-mono uppercase opacity-50 mt-1">By <span className="text-black">{activity.username}</span></p>
                  </div>
                  <span className="text-[10px] font-mono opacity-40">{formatDate(activity.timestamp)}</span>
                </div>
              ))}
              {stats?.recentActivity.length === 0 && (
                <div className="text-center py-12 opacity-30 font-mono uppercase text-xs">No activity recorded yet</div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <button onClick={() => { fetchUsers(); setView('users'); }}
            className="w-full bg-[#141414] text-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)] text-left hover:bg-[#333] transition-colors">
            <Users className="w-6 h-6 mb-3" />
            <h2 className="text-xl font-serif italic">Manage Users</h2>
            <p className="text-[10px] font-mono uppercase opacity-50 mt-1">View all accounts & debates</p>
          </button>
          <section className="bg-[#141414] text-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)]">
            <h2 className="text-xl font-serif italic mb-4">System Status</h2>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-mono uppercase tracking-widest">All Systems Operational</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

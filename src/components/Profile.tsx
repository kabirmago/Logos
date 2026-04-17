import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit3, Trash2, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePostHog } from '@posthog/react';

export const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const posthog = usePostHog();
  const [bio, setBio] = useState(user?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [debates, setDebates] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const recordingsQuery = query(
        collection(db, 'recordings'),
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc')
      );
      const recordingsSnap = await getDocs(recordingsQuery);
      setRecordings(recordingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const debatesQuery = query(
        collection(db, 'leaderboard'),
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc')
      );
      const debatesSnap = await getDocs(debatesQuery);
      setDebates(debatesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBio = async () => {
    await updateProfile(bio);
    setIsEditing(false);
    posthog?.capture('profile_bio_updated', { bio_length: bio.length });
  };

  const handleDeleteDebate = async (id: string) => {
    if (!confirm('Are you sure you want to remove this from the leaderboard?')) return;
    try {
      await deleteDoc(doc(db, 'leaderboard', id));
      setDebates(prev => prev.filter(d => d.id !== id));
      posthog?.capture('leaderboard_debate_deleted');
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;
    try {
      await deleteDoc(doc(db, 'recordings', id));
      setRecordings(prev => prev.filter(r => r.id !== id));
      posthog?.capture('recording_deleted');
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Profile Sidebar */}
      <div className="md:col-span-4 space-y-6">
        <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] text-center">
          <div className="w-20 h-20 bg-[#141414] text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-serif italic">{user.username}</h2>
          <p className="text-[10px] font-mono uppercase opacity-50 mt-1">Member since {new Date().getFullYear()}</p>
          
          <div className="mt-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono uppercase opacity-50">Bio</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="text-xs opacity-50 hover:opacity-100 transition-opacity">
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full p-3 bg-[#f5f5f5] border border-black/10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#141414] resize-none h-24"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <button
                  onClick={handleUpdateBio}
                  className="w-full bg-[#141414] text-white py-2 font-mono uppercase text-[10px] tracking-widest hover:bg-[#333] transition-colors"
                >
                  Save Bio
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic leading-relaxed">
                {user.bio || "No bio yet. Add one to introduce yourself to the discourse."}
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="mt-12 w-full border border-rose-200 text-rose-600 py-2 font-mono uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-colors"
          >
            Logout
          </button>
        </section>
      </div>

      {/* Content Area */}
      <div className="md:col-span-8 space-y-8">
        {/* Private Recordings */}
        <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="text-xl font-serif italic mb-8 flex items-center gap-2">
            <User className="w-5 h-5" /> Your Private Archive
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin opacity-20" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12 opacity-30">
              <p className="text-sm font-mono uppercase">No private recordings yet</p>
              <p className="text-[10px] mt-2">Perform an analysis while logged in to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recordings.map((rec) => (
                <div key={rec.id} className="group p-4 bg-[#f5f5f5] border border-black/5 hover:border-black/20 transition-all flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[#141414] text-white rounded-sm">
                        {rec.type}
                      </span>
                      <h3 className="font-bold text-sm">{rec.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono opacity-50">
                      <span>Score: {Math.round(rec.score)}</span>
                      <span>{rec.timestamp?.toDate ? rec.timestamp.toDate().toLocaleDateString() : new Date(rec.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/recordings/${rec.id}`}
                      className="p-2 hover:bg-white rounded-full transition-colors"
                      title="View Analysis"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteRecording(rec.id)}
                      className="p-2 hover:bg-rose-50 text-rose-600 rounded-full transition-colors"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Published Debates */}
        <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="text-xl font-serif italic mb-8 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Public Contributions
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin opacity-20" />
            </div>
          ) : debates.length === 0 ? (
            <div className="text-center py-12 opacity-30">
              <p className="text-sm font-mono uppercase">No debates published yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {debates.map((debate) => (
                <div key={debate.id} className="group p-4 bg-[#f5f5f5] border border-black/5 hover:border-black/20 transition-all flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{debate.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-[10px] font-mono opacity-50">
                      <span>Score: {Math.round(debate.score)}</span>
                      <span>{debate.timestamp?.toDate ? debate.timestamp.toDate().toLocaleDateString() : new Date(debate.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/leaderboard/${debate.id}`}
                      className="p-2 hover:bg-white rounded-full transition-colors"
                      title="View Analysis"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteDebate(debate.id)}
                      className="p-2 hover:bg-rose-50 text-rose-600 rounded-full transition-colors"
                      title="Remove from Leaderboard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

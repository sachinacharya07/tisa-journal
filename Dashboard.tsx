import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Quote, 
  TrendingUp, 
  Calendar, 
  Clock,
  ArrowRight,
  PenLine
} from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface DashboardProps {
  profile: any;
  onWrite: () => void;
}

const QUOTES = [
  { q: "Fill your paper with the breathings of your heart.", a: "William Wordsworth" },
  { q: "A writer only begins a book. A reader finishes it.", a: "Samuel Johnson" },
  { q: "There is no greater agony than bearing an untold story inside you.", a: "Maya Angelou" },
  { q: "Writing is the painting of the voice.", a: "Voltaire" },
  { q: "We read to know we are not alone.", a: "C.S. Lewis" },
  { q: "I write because I don't know what I think until I read what I say.", a: "Flannery O'Connor" }
];

export default function Dashboard({ profile, onWrite }: DashboardProps) {
  const [stats, setStats] = useState({ total: 0, streak: 0, thisWeek: 0 });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    // Fetch total entries
    const q = query(collection(db, 'entries'), where('userId', '==', auth.currentUser.uid), where('isDeleted', '==', false));
    const snap = await getDocs(q);
    setStats(prev => ({ ...prev, total: snap.size }));

    // Fetch recent
    const recentQ = query(
      collection(db, 'entries'), 
      where('userId', '==', auth.currentUser.uid), 
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const recentSnap = await getDocs(recentQ);
    setRecentEntries(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sage-dark font-bold uppercase tracking-[0.2em] text-[10px]"
          >
            {format(new Date(), 'EEEE, MMMM do')}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold tracking-tight"
          >
            {getTimeGreeting()}, {profile?.displayName?.split(' ')[0] || 'Friend'} 🌿
          </motion.h1>
          <p className="text-ink/40 text-sm max-w-md">
            Welcome back to your quiet space. What's on your mind today?
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onWrite}
          className="px-8 py-4 bg-sage-dark text-white rounded-2xl font-bold shadow-xl shadow-sage-dark/20 flex items-center gap-3 group"
        >
          <PenLine className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Write Today's Entry
        </motion.button>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: stats.total, icon: Calendar, color: 'bg-sage/10 text-sage-dark' },
          { label: 'Day Streak', value: profile?.streak || 0, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
          { label: 'This Week', value: stats.thisWeek, icon: Clock, color: 'bg-blue-100 text-blue-600' },
          { label: 'Growth', value: '12%', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-paper p-6 rounded-3xl border border-ink/5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">{stat.label}</p>
            <p className="text-2xl font-serif font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Daily Quote */}
        <section className="md:col-span-1">
          <div className="bg-sage-dark text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
            <Quote className="w-12 h-12 text-white/10 absolute -top-2 -left-2" />
            <div className="relative z-10">
              <p className="text-xl font-serif italic leading-relaxed">"{quote.q}"</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/60">— {quote.a}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Daily Inspiration</p>
            </div>
          </div>
        </section>

        {/* Recent Entries */}
        <section className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold">Recent Reflections</h2>
            <button className="text-xs font-bold text-sage-dark flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentEntries.length > 0 ? recentEntries.map((entry, i) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-paper p-5 rounded-2xl border border-ink/5 flex items-center gap-4 hover:border-sage/30 transition-colors cursor-pointer group"
              >
                <div className="text-2xl">{entry.mood || '📝'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold truncate group-hover:text-sage-dark transition-colors">
                    {entry.title || 'Untitled Entry'}
                  </h3>
                  <p className="text-xs text-ink/40 mt-0.5">
                    {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {entry.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-sand-dark rounded text-[9px] text-ink/40 uppercase font-bold">
                      {tag.replace('#', '')}
                    </span>
                  ))}
                </div>
              </motion.div>
            )) : (
              <div className="bg-sand-dark/30 border-2 border-dashed border-ink/5 rounded-2xl p-12 text-center">
                <p className="text-ink/30 text-sm italic">No entries yet. Start your journey today.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

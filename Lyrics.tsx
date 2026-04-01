import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Search, 
  Plus, 
  Mic2,
  Play,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

interface LyricsProps {
  onEdit: (entry: any) => void;
}

export default function Lyrics({ onEdit }: LyricsProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'entries'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'lyrics'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      setLoading(false);
    }, (err) => {
      const qFallback = query(
        collection(db, 'entries'),
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', 'lyrics'),
        where('isDeleted', '==', false)
      );
      onSnapshot(qFallback, (snap) => {
        setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a, b) => {
          const da = a.createdAt?.toDate?.()?.getTime() || 0;
          const db = b.createdAt?.toDate?.()?.getTime() || 0;
          return db - da;
        }));
      });
    });

    return unsub;
  }, []);

  const filteredEntries = entries.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Music className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Songbook</h1>
            <p className="text-ink/40 text-sm mt-1">Verses, choruses, and melodies in progress.</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-paper border border-ink/5 rounded-2xl text-sm outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry, i) => (
            <motion.div 
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onEdit(entry)}
              className="bg-paper p-6 rounded-[2rem] border border-ink/5 hover:border-blue-200 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-ink/30 uppercase tracking-widest font-bold">
                    {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}
                  </p>
                  <h3 className="text-xl font-serif font-bold group-hover:text-blue-600 transition-colors">
                    {entry.title || 'Untitled Song'}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Mic2 className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              <div className="flex-1 min-h-[120px] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-paper z-10" />
                <p className="text-ink/60 text-sm leading-relaxed font-serif italic whitespace-pre-line">
                  {entry.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-ink/5">
                <div className="flex gap-2">
                  {entry.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="text-[9px] text-blue-600/50 font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="p-2 text-ink/10 hover:text-blue-600 transition-colors">
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && !loading && (
          <div className="md:col-span-2 py-32 text-center space-y-4 bg-blue-50/30 rounded-[3rem] border-2 border-dashed border-blue-100">
            <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Music className="w-8 h-8 text-blue-200" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-blue-900/40">No songs yet</h2>
              <p className="text-blue-900/30 text-sm italic max-w-xs mx-auto">Capture your melodies and verses here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

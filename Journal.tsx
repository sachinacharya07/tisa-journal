import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Pin, 
  Star, 
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

interface JournalProps {
  onEdit: (entry: any) => void;
}

export default function Journal({ onEdit }: JournalProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'entries'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'journal'),
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
        where('type', '==', 'journal'),
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
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-ink">Personal Journal</h1>
          <p className="text-ink/40 text-sm mt-1">Your private sanctuary for thoughts and reflections.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-sage-dark transition-colors" />
          <input 
            type="text"
            placeholder="Search journal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-paper border border-ink/5 rounded-2xl text-sm outline-none focus:border-sage/30 focus:ring-4 focus:ring-sage/5 transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry, i) => (
            <motion.div 
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onEdit(entry)}
              className="bg-paper p-8 rounded-[2.5rem] border border-ink/5 hover:border-sage/30 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden"
            >
              {entry.isPinned && (
                <div className="absolute top-6 right-6">
                  <Pin className="w-4 h-4 text-sage-dark fill-sage-dark" />
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl">{entry.mood || '📝'}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-ink/20" />
                    <p className="text-[10px] text-ink/30 uppercase tracking-[0.2em] font-bold">
                      {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'EEEE, MMMM do') : 'Just now'}
                    </p>
                  </div>
                  <h3 className="text-2xl font-serif font-bold mt-1 group-hover:text-sage-dark transition-colors">
                    {entry.title || 'Untitled Reflection'}
                  </h3>
                </div>
              </div>

              <p className="text-ink/60 text-lg leading-relaxed line-clamp-4 font-serif italic">
                "{entry.content}"
              </p>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink/5">
                <div className="flex gap-2">
                  {entry.tags?.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-sand-dark rounded-full text-[10px] text-ink/40 font-bold uppercase tracking-wider">
                      {tag.replace('#', '')}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {entry.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  <button className="p-2 text-ink/10 hover:text-ink transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && !loading && (
          <div className="py-32 text-center space-y-4 bg-sand-dark/20 rounded-[3rem] border-2 border-dashed border-ink/5">
            <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Plus className="w-8 h-8 text-ink/10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-ink/40">Your journal is empty</h2>
              <p className="text-ink/30 text-sm italic max-w-xs mx-auto">Every journey begins with a single word. Write yours today.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

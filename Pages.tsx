import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Plus, 
  History,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

interface PagesProps {
  onEdit: (entry: any) => void;
}

export default function Pages({ onEdit }: PagesProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'entries'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'page'),
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
        where('type', '==', 'page'),
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
            <FileText className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Vintage Pages</h1>
            <p className="text-ink/40 text-sm mt-1 font-vintage">Aged paper for timeless thoughts.</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-amber-700 transition-colors" />
          <input 
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-[#fdfaf3] border border-amber-100 rounded-2xl text-sm outline-none focus:border-amber-200 focus:ring-4 focus:ring-amber-50 transition-all w-full md:w-64 font-vintage"
          />
        </div>
      </div>

      <div className="grid gap-8">
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
              className="bg-[#fdfaf3] p-10 rounded-sm shadow-md hover:shadow-xl transition-all cursor-pointer group border border-amber-100 relative overflow-hidden"
            >
              {/* Aged paper effect */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100/20 rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-100/10 rounded-tr-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8 border-b-2 border-amber-100/50 pb-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-vintage font-bold group-hover:text-amber-900 transition-colors">
                    {entry.title || 'Untitled Page'}
                  </h3>
                  <p className="text-[10px] text-amber-900/40 uppercase tracking-[0.3em] font-bold font-vintage">
                    {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'MMMM do, yyyy') : 'Just now'}
                  </p>
                </div>
                <History className="w-5 h-5 text-amber-900/20" />
              </div>

              <p className="text-amber-900/70 text-lg leading-loose font-vintage whitespace-pre-line">
                {entry.content}
              </p>

              <div className="mt-12 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-4">
                  {entry.tags?.map((tag: string) => (
                    <span key={tag} className="text-[10px] font-vintage uppercase tracking-widest text-amber-900/50">{tag}</span>
                  ))}
                </div>
                <div className="font-signature text-2xl text-amber-900/40">
                  {auth.currentUser?.displayName}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && !loading && (
          <div className="py-32 text-center space-y-4 bg-[#fdfaf3]/50 rounded-sm border-2 border-dashed border-amber-100">
            <div className="w-20 h-20 bg-[#fdfaf3] rounded-full flex items-center justify-center mx-auto shadow-sm border border-amber-100">
              <FileText className="w-8 h-8 text-amber-200" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-vintage font-bold text-amber-900/40">No pages yet</h2>
              <p className="text-amber-900/30 text-sm italic max-w-xs mx-auto font-vintage">Begin your timeless collection here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

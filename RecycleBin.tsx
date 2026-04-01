import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCcw, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function RecycleBin() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'entries'),
      where('userId', '==', auth.currentUser.uid),
      where('isDeleted', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, []);

  const handleRestore = async (id: string) => {
    try {
      await updateDoc(doc(db, 'entries', id), {
        isDeleted: false,
        deletedAt: null
      });
    } catch (error) {
      console.error("Error restoring entry:", error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("This will permanently erase this entry. This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'entries', id));
    } catch (error) {
      console.error("Error permanently deleting entry:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Recycle Bin</h1>
          <p className="text-ink/40 text-sm mt-1">Deleted entries are kept here for a short time.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100">
          <AlertCircle className="w-4 h-4" />
          Soft Delete Active
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {entries.length > 0 ? entries.map((entry) => (
            <motion.div 
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-paper p-6 rounded-3xl border border-ink/5 flex items-center justify-between group hover:border-sage/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl opacity-50">{entry.mood || '📝'}</div>
                <div>
                  <h3 className="font-serif font-bold text-ink/60 line-through decoration-ink/20">
                    {entry.title || 'Untitled Entry'}
                  </h3>
                  <p className="text-[10px] text-ink/30 uppercase tracking-widest font-bold mt-1">
                    Deleted {entry.deletedAt?.toDate ? format(entry.deletedAt.toDate(), 'MMM d, h:mm a') : 'Recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRestore(entry.id)}
                  className="p-3 bg-sage/10 text-sage-dark rounded-2xl hover:bg-sage/20 transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Restore
                </button>
                <button 
                  onClick={() => handlePermanentDelete(entry.id)}
                  className="p-3 text-ink/20 hover:text-red-500 transition-colors rounded-2xl"
                  title="Permanently Delete"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )) : !loading && (
            <div className="py-24 text-center space-y-4 bg-sand-dark/20 rounded-[2.5rem] border-2 border-dashed border-ink/5">
              <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="w-8 h-8 text-ink/10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-serif font-bold text-ink/40">Your bin is empty</h2>
                <p className="text-ink/30 text-sm italic max-w-xs mx-auto">No deleted entries found. Your journal is tidy.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

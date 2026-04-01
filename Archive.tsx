import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  Pin, 
  Trash2, 
  FileText, 
  Download,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';

interface ArchiveProps {
  filter?: 'favorites' | 'all';
  onEdit: (entry: any) => void;
}

export default function Archive({ filter = 'all', onEdit }: ArchiveProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    let q = query(
      collection(db, 'entries'),
      where('userId', '==', auth.currentUser.uid),
      where('isDeleted', '==', false)
    );

    if (filter === 'favorites') {
      q = query(q, where('isFavorite', '==', true));
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(data);
      setLoading(false);
    });

    return unsub;
  }, [filter]);

  const filteredEntries = entries
    .filter(e => 
      e.title?.toLowerCase().includes(search.toLowerCase()) || 
      e.content?.toLowerCase().includes(search.toLowerCase()) ||
      e.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'date') {
        valA = a.createdAt?.toDate?.()?.getTime() || 0;
        valB = b.createdAt?.toDate?.()?.getTime() || 0;
      } else if (sortBy === 'title') {
        valA = a.title?.toLowerCase() || '';
        valB = b.title?.toLowerCase() || '';
      } else {
        valA = a.type || '';
        valB = b.type || '';
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: 'date' | 'title' | 'type') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      await updateDoc(doc(db, 'entries', id), {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const toggleFavorite = async (e: any) => {
    try {
      await updateDoc(doc(db, 'entries', e.id), {
        isFavorite: !e.isFavorite
      });
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const exportToTxt = (entry: any) => {
    const content = `${entry.title || 'Untitled'}\n${format(entry.createdAt.toDate(), 'PPPP')}\n\n${entry.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title || 'entry'}.txt`;
    a.click();
  };

  const exportToPdf = (entry: any) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: 'Cormorant Garamond', serif; color: #1A1714; background: #FEFCF8;">
        <h1 style="font-size: 32px; margin-bottom: 8px;">${entry.title || 'Untitled Reflection'}</h1>
        <p style="font-size: 12px; color: #7A7060; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px;">
          ${format(entry.createdAt.toDate(), 'PPPP')}
        </p>
        <div style="font-size: 18px; line-height: 1.8; white-space: pre-wrap; font-style: italic;">
          ${entry.content}
        </div>
        <div style="margin-top: 60px; text-align: right;">
          <p style="font-family: 'Great Vibes', cursive; font-size: 32px; color: #4E6E4E; margin: 0;">
            ${auth.currentUser?.displayName || ''}
          </p>
          <p style="font-size: 10px; color: #B0A898; text-transform: uppercase; letter-spacing: 1px;">Digital Signature</p>
        </div>
      </div>
    `;
    
    const opt = {
      margin: 1,
      filename: `${entry.title || 'entry'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            {filter === 'favorites' ? 'Your Favorites' : 'The Archive'}
          </h1>
          <p className="text-ink/40 text-sm mt-1">
            {filter === 'favorites' ? 'Moments you hold close.' : 'Every word you\'ve ever written, kept safe.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-sage-dark transition-colors" />
            <input 
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-paper border border-ink/5 rounded-2xl text-sm outline-none focus:border-sage/30 focus:ring-4 focus:ring-sage/5 transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-paper rounded-[2rem] border border-ink/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/5">
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
                    Title {sortBy === 'title' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('type')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
                    Section {sortBy === 'type' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('date')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
                    Date {sortBy === 'date' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-ink/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry) => (
                  <motion.tr 
                    key={entry.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-sand-dark/30 transition-colors cursor-pointer"
                    onClick={() => onEdit(entry)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{entry.mood || '📝'}</div>
                        <div className="min-w-0">
                          <p className="font-serif font-bold truncate group-hover:text-sage-dark transition-colors">
                            {entry.title || 'Untitled Entry'}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {entry.tags?.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="text-[9px] text-ink/30 font-medium">{tag}</span>
                            ))}
                          </div>
                        </div>
                        {entry.isPinned && <Pin className="w-3 h-3 text-sage-dark fill-sage-dark shrink-0" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        entry.type === 'lyrics' ? "bg-blue-50 text-blue-600" : 
                        entry.type === 'page' ? "bg-amber-50 text-amber-600" : 
                        "bg-sage/10 text-sage-dark"
                      )}>
                        {entry.type || 'journal'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-ink/40">
                        {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => toggleFavorite(entry)}
                          className={cn("p-2 rounded-xl transition-colors", entry.isFavorite ? "text-amber-500" : "text-ink/20 hover:text-amber-500")}
                        >
                          <Star className={cn("w-4 h-4", entry.isFavorite && "fill-amber-500")} />
                        </button>
                        <button 
                          onClick={() => exportToTxt(entry)}
                          className="p-2 text-ink/20 hover:text-sage-dark transition-colors rounded-xl"
                          title="Export as TXT"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => exportToPdf(entry)}
                          className="p-2 text-ink/20 hover:text-sage-dark transition-colors rounded-xl"
                          title="Export as PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSoftDelete(entry.id)}
                          className="p-2 text-ink/20 hover:text-red-500 transition-colors rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredEntries.length === 0 && !loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 bg-sand-dark rounded-full flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-ink/20" />
            </div>
            <p className="text-ink/40 text-sm italic">No entries found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

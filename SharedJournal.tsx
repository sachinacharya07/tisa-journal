import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Copy, 
  Check, 
  UserPlus, 
  MoreHorizontal,
  Shield,
  LogOut,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  orderBy
} from 'firebase/firestore';
import { format } from 'date-fns';

interface SharedJournalProps {
  profile: any;
  onEdit: (entry: any) => void;
}

export default function SharedJournal({ profile, onEdit }: SharedJournalProps) {
  const [journals, setJournals] = useState<any[]>([]);
  const [activeJournal, setActiveJournal] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'sharedJournals'),
      where('memberIds', 'array-contains', auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJournals(data);
      if (data.length > 0 && !activeJournal) {
        setActiveJournal(data[0]);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!activeJournal) {
      setEntries([]);
      return;
    }

    const q = query(
      collection(db, 'entries'),
      where('journalId', '==', activeJournal.id),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (err) => {
      // Fallback if index not ready
      const qFallback = query(
        collection(db, 'entries'),
        where('journalId', '==', activeJournal.id),
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
  }, [activeJournal]);

  const createJournal = async () => {
    if (!auth.currentUser) return;
    setIsCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newJournal = {
        name: `${profile?.displayName || 'My'} Shared Space`,
        inviteCode: code,
        creatorId: auth.currentUser.uid,
        memberIds: [auth.currentUser.uid],
        memberNames: { [auth.currentUser.uid]: profile?.displayName || 'User' },
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'sharedJournals'), newJournal);
      setActiveJournal({ id: docRef.id, ...newJournal });
    } catch (error) {
      console.error("Error creating journal:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinJournal = async () => {
    if (!auth.currentUser || !inviteCode.trim()) return;
    try {
      const q = query(collection(db, 'sharedJournals'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Invalid invite code.");
        return;
      }
      const journalDoc = snap.docs[0];
      const journalData = journalDoc.data();
      
      await updateDoc(journalDoc.ref, {
        memberIds: arrayUnion(auth.currentUser.uid),
        [`memberNames.${auth.currentUser.uid}`]: profile?.displayName || 'User'
      });
      
      setInviteCode('');
      setActiveJournal({ id: journalDoc.id, ...journalData });
    } catch (error) {
      console.error("Error joining journal:", error);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!activeJournal || !auth.currentUser || activeJournal.creatorId !== auth.currentUser.uid) return;
    if (memberId === auth.currentUser.uid) return;
    
    if (!window.confirm("Remove this member from the shared space?")) return;

    try {
      await updateDoc(doc(db, 'sharedJournals', activeJournal.id), {
        memberIds: arrayRemove(memberId),
        [`memberNames.${memberId}`]: null
      });
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const copyCode = () => {
    if (!activeJournal) return;
    navigator.clipboard.writeText(activeJournal.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  if (journals.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="w-24 h-24 bg-sage/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
          <Users className="w-10 h-10 text-sage-dark" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold tracking-tight">Shared Journals</h1>
          <p className="text-ink/40 max-w-md mx-auto leading-relaxed">
            Connect with friends, partners, or family. Write together, read together, and grow together in a private shared space.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto pt-8">
          <button 
            onClick={createJournal}
            disabled={isCreating}
            className="p-8 bg-paper border border-ink/5 rounded-3xl hover:border-sage/30 transition-all group text-left space-y-4"
          >
            <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-sage-dark" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Create Space</h3>
              <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1">Start a new journal</p>
            </div>
          </button>

          <div className="p-8 bg-paper border border-ink/5 rounded-3xl space-y-4 text-left">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-sm">Join Space</h3>
                <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1 font-medium">Enter invite code</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="CODE"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-sand-dark/50 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:bg-sand-dark transition-colors"
                />
                <button 
                  onClick={joinJournal}
                  className="p-2 bg-sage-dark text-white rounded-xl hover:bg-sage-dark/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-sage/10 rounded-3xl flex items-center justify-center shadow-sm">
            <Users className="w-8 h-8 text-sage-dark" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">{activeJournal?.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-ink/40 text-xs font-medium">
                {activeJournal?.memberIds?.length} Members
              </p>
              <button 
                onClick={copyCode}
                className="flex items-center gap-1.5 text-sage-dark text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : `Invite Code: ${activeJournal?.inviteCode}`}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {activeJournal?.memberIds?.map((id: string) => (
              <div 
                key={id} 
                className="w-10 h-10 rounded-full border-2 border-paper bg-sand-dark flex items-center justify-center text-xs font-bold text-ink/40 overflow-hidden group relative"
                title={activeJournal.memberNames?.[id] || 'Member'}
              >
                {activeJournal.memberNames?.[id]?.charAt(0).toUpperCase() || 'M'}
                {activeJournal.creatorId === id && (
                  <Shield className="absolute bottom-0 right-0 w-3 h-3 text-sage-dark fill-white" />
                )}
              </div>
            ))}
          </div>
          <button className="w-10 h-10 rounded-full border-2 border-dashed border-ink/10 flex items-center justify-center text-ink/20 hover:text-sage-dark hover:border-sage-dark transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </section>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar: Members Management */}
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-paper p-6 rounded-3xl border border-ink/5 space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Manage Members</h3>
            <div className="space-y-4">
              {activeJournal?.memberIds?.map((id: string) => (
                <div key={id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sand-dark flex items-center justify-center text-[10px] font-bold">
                      {activeJournal.memberNames?.[id]?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{activeJournal.memberNames?.[id] || 'Member'}</p>
                      <p className="text-[9px] text-ink/30 uppercase tracking-widest">
                        {activeJournal.creatorId === id ? 'Creator' : 'Member'}
                      </p>
                    </div>
                  </div>
                  {activeJournal.creatorId === auth.currentUser?.uid && id !== auth.currentUser?.uid && (
                    <button 
                      onClick={() => removeMember(id)}
                      className="p-1.5 text-ink/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sand-dark/30 p-6 rounded-3xl space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Shared Activity</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sage-dark mt-1.5 shrink-0" />
                <p className="text-[11px] text-ink/60 leading-relaxed">
                  <span className="font-bold">New Entry</span> by {activeJournal.memberNames?.[entries[0]?.userId] || 'someone'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main: Shared Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold">Shared Feed</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-paper border border-ink/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
                All Entries
              </button>
              <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
                Unread
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {entries.length > 0 ? entries.map((entry, i) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onEdit(entry)}
                className="bg-paper p-6 rounded-[2rem] border border-ink/5 hover:border-sage/30 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sand-dark flex items-center justify-center text-xs font-bold">
                      {activeJournal.memberNames?.[entry.userId]?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{activeJournal.memberNames?.[entry.userId] || 'Member'}</p>
                      <p className="text-[10px] text-ink/30 uppercase tracking-widest font-medium">
                        {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl">{entry.mood || '📝'}</div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-serif font-bold group-hover:text-sage-dark transition-colors">
                    {entry.title || 'Untitled Entry'}
                  </h3>
                  <p className="text-ink/60 text-sm leading-relaxed line-clamp-3 italic font-serif">
                    "{entry.content}"
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink/5">
                  <div className="flex gap-2">
                    {entry.tags?.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-sand-dark rounded-lg text-[9px] text-ink/40 font-bold uppercase tracking-wider">
                        {tag.replace('#', '')}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {Object.keys(entry.reactions || {}).slice(0, 3).map(r => (
                        <div key={r} className="w-6 h-6 rounded-full bg-paper border border-ink/5 flex items-center justify-center text-[10px] shadow-sm">
                          {r}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest">
                      {entry.comments?.length || 0} Reflections
                    </span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="py-32 text-center space-y-4 bg-sand-dark/20 rounded-[3rem] border-2 border-dashed border-ink/5">
                <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Plus className="w-8 h-8 text-ink/10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-serif font-bold text-ink/40">The feed is quiet</h2>
                  <p className="text-ink/30 text-sm italic max-w-xs mx-auto">Start the conversation. Write the first shared entry.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

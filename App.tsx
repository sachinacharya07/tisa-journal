import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Lyrics from './components/Lyrics';
import Pages from './components/Pages';
import Archive from './components/Archive';
import SharedJournal from './components/SharedJournal';
import Settings from './components/Settings';
import RecycleBin from './components/RecycleBin';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import { AnimatePresence, motion } from 'motion/react';

export type View = 'dashboard' | 'personal' | 'lyrics' | 'pages' | 'archive' | 'favorites' | 'shared' | 'settings' | 'recycle-bin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', u.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data());
          } else {
            // Create profile if it doesn't exist
            setDoc(userRef, {
              uid: u.uid,
              displayName: u.displayName || u.email?.split('@')[0],
              email: u.email,
              photoURL: u.photoURL,
              createdAt: serverTimestamp(),
              streak: 0,
              settings: {
                fontSize: 16,
                theme: 'light',
                writingFont: 'cormorant',
                silentMode: false
              }
            });
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-sand">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sage border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sand text-ink">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} profile={profile} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto"
          >
            {currentView === 'dashboard' && <Dashboard profile={profile} onWrite={() => setIsEditorOpen(true)} />}
            {currentView === 'personal' && <Journal onEdit={(e) => { setEditingEntry(e); setIsEditorOpen(true); }} />}
            {currentView === 'lyrics' && <Lyrics onEdit={(e) => { setEditingEntry(e); setIsEditorOpen(true); }} />}
            {currentView === 'pages' && <Pages onEdit={(e) => { setEditingEntry(e); setIsEditorOpen(true); }} />}
            {currentView === 'archive' && <Archive onEdit={(e) => { setEditingEntry(e); setIsEditorOpen(true); }} />}
            {currentView === 'favorites' && <Archive filter="favorites" onEdit={(e) => { setEditingEntry(e); setIsEditorOpen(true); }} />}
            {currentView === 'shared' && <SharedJournal profile={profile} onEdit={(e) => { setEditingEntry(e); setIsEditorOpen(true); }} />}
            {currentView === 'settings' && <Settings profile={profile} />}
            {currentView === 'recycle-bin' && <RecycleBin />}
          </motion.div>
        </AnimatePresence>

        <Editor 
          isOpen={isEditorOpen} 
          onClose={() => { setIsEditorOpen(false); setEditingEntry(null); }} 
          entry={editingEntry}
          defaultType={currentView === 'lyrics' ? 'lyrics' : currentView === 'pages' ? 'page' : 'journal'}
        />
      </main>
    </div>
  );
}

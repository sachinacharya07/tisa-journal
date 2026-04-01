import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Music, 
  FileText, 
  Archive, 
  Star, 
  Users, 
  Settings as SettingsIcon, 
  Trash2,
  LogOut,
  PenLine
} from 'lucide-react';
import { cn } from '../lib/utils';
import { View } from '../App';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  profile: any;
}

export default function Sidebar({ currentView, onViewChange, profile }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal', label: 'Journal', icon: BookOpen },
    { id: 'lyrics', label: 'Lyrics', icon: Music },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'shared', label: 'Shared', icon: Users },
    { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-paper border-r border-ink/5 flex flex-col h-full z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center shadow-lg shadow-sage/20">
          <PenLine className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold leading-none tracking-tight">TISA</h1>
          <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1 font-medium">Journal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group",
              currentView === item.id 
                ? "bg-sage/10 text-sage-dark font-semibold" 
                : "text-ink/60 hover:bg-sand-dark hover:text-ink"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-transform group-hover:scale-110",
              currentView === item.id ? "text-sage-dark" : "text-ink/40"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-ink/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-sand-dark/50">
          <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-xs font-bold text-sage-dark overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.displayName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{profile?.displayName || 'User'}</p>
            <p className="text-[10px] text-ink/40 truncate">{profile?.email}</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-1.5 text-ink/40 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

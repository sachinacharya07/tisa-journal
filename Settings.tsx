import React, { useState } from 'react';
import { 
  Type, 
  Moon, 
  Sun, 
  VolumeX, 
  Shield, 
  Download,
  Trash2,
  Check,
  Palette
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SettingsProps {
  profile: any;
}

const THEMES = [
  { id: 'light', name: 'Ivory', color: 'bg-[#F7F3ED]' },
  { id: 'dark', name: 'Onyx', color: 'bg-[#1A1714]' },
  { id: 'nude', name: 'Nude', color: 'bg-[#F5EEE8]' },
  { id: 'oled', name: 'OLED', color: 'bg-black' },
  { id: 'sage', name: 'Sage', color: 'bg-[#EAF1EA]' },
];

export default function Settings({ profile }: SettingsProps) {
  const [fontSize, setFontSize] = useState(profile?.settings?.fontSize || 16);
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = async (newSettings: any) => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        settings: {
          ...profile?.settings,
          ...newSettings
        }
      });
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Settings</h1>
        <p className="text-ink/40 text-sm mt-1">Tailor your sanctuary to your liking.</p>
      </div>

      <div className="space-y-8">
        {/* Typography */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
            <Type className="w-3 h-3" />
            Typography
          </div>
          <div className="bg-paper p-8 rounded-[2rem] border border-ink/5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">Font Size</label>
                <span className="text-xs font-mono text-sage-dark font-bold">{fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={fontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFontSize(val);
                  updateSettings({ fontSize: val });
                }}
                className="w-full h-1.5 bg-sand-dark rounded-lg appearance-none cursor-pointer accent-sage-dark"
              />
              <div className="p-4 bg-sand-dark/30 rounded-xl">
                <p style={{ fontSize: `${fontSize}px` }} className="text-ink/60 leading-relaxed font-serif italic">
                  "The scariest moment is always just before you start." — Stephen King
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
            <Palette className="w-3 h-3" />
            Appearance
          </div>
          <div className="bg-paper p-8 rounded-[2rem] border border-ink/5 space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl border-2 transition-all group-hover:scale-110",
                    t.color,
                    profile?.settings?.theme === t.id ? "border-sage-dark ring-4 ring-sage/10" : "border-ink/5"
                  )}>
                    {profile?.settings?.theme === t.id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Check className={cn("w-5 h-5", t.id === 'dark' || t.id === 'oled' ? "text-white" : "text-sage-dark")} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
            <Shield className="w-3 h-3" />
            Experience
          </div>
          <div className="bg-paper rounded-[2rem] border border-ink/5 divide-y divide-ink/5">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sand-dark rounded-xl flex items-center justify-center">
                  <VolumeX className="w-5 h-5 text-ink/40" />
                </div>
                <div>
                  <p className="text-sm font-bold">Silent Mode</p>
                  <p className="text-xs text-ink/40">Hide all social interactions (reactions, comments).</p>
                </div>
              </div>
              <button 
                onClick={() => updateSettings({ silentMode: !profile?.settings?.silentMode })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  profile?.settings?.silentMode ? "bg-sage-dark" : "bg-sand-dark"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  profile?.settings?.silentMode ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/40">
            <Trash2 className="w-3 h-3" />
            Danger Zone
          </div>
          <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-900">Delete Account</p>
                <p className="text-xs text-red-900/40">Permanently erase all your data and entries.</p>
              </div>
              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors">
                Delete Everything
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

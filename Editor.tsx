import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Hash, 
  Smile, 
  Type, 
  ChevronUp, 
  Save,
  Pin,
  Star,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface EditorProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: any;
  defaultType?: 'journal' | 'lyrics' | 'page';
}

const MOODS = [
  { e: '🌸', l: 'Peaceful' }, { e: '✨', l: 'Inspired' }, { e: '🌿', l: 'Grounded' },
  { e: '☁️', l: 'Cloudy' }, { e: '🌧️', l: 'Heavy' }, { e: '🔥', l: 'Energized' },
  { e: '🍵', l: 'Calm' }, { e: '🌙', l: 'Reflective' }, { e: '💪', l: 'Strong' },
  { e: '😔', l: 'Low' }, { e: '🎯', l: 'Focused' }, { e: '🥰', l: 'Grateful' }
];

export default function Editor({ isOpen, onClose, entry, defaultType = 'journal' }: EditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood || '');
      setTags(entry.tags || []);
      setIsPinned(entry.isPinned || false);
      setIsFavorite(entry.isFavorite || false);
    } else {
      setTitle('');
      setContent('');
      setMood('');
      setTags([]);
      setIsPinned(false);
      setIsFavorite(false);
    }
  }, [entry, isOpen]);

  const handleSave = async () => {
    if (!auth.currentUser || !content.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        title,
        content,
        mood,
        tags,
        isPinned,
        isFavorite,
        type: entry?.type || defaultType,
        userId: auth.currentUser.uid,
        journalId: entry?.journalId || `personal-${auth.currentUser.uid}`,
        updatedAt: serverTimestamp(),
        isDeleted: false
      };

      if (entry?.id) {
        await updateDoc(doc(db, 'entries', entry.id), data);
      } else {
        await addDoc(collection(db, 'entries'), {
          ...data,
          createdAt: serverTimestamp(),
          reactions: {},
          comments: []
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-sand/80 backdrop-blur-sm",
        isFullScreen && "p-0"
      )}
    >
      <motion.div 
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        className={cn(
          "w-full max-w-4xl h-full max-h-[90vh] bg-paper shadow-2xl rounded-3xl flex flex-col overflow-hidden border border-ink/5 relative",
          isFullScreen && "max-w-none max-h-none h-screen rounded-none border-none",
          defaultType === 'page' && "font-vintage bg-[#f4f1ea] border-double border-4 border-[#dcd7c9]"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-ink/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ink/30">
              {entry ? 'Edit Entry' : `New ${defaultType.charAt(0).toUpperCase() + defaultType.slice(1)}`}
            </span>
            {isPinned && <Pin className="w-3 h-3 text-sage-dark fill-sage-dark" />}
            {isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-ink/40 hover:text-ink transition-colors rounded-full hover:bg-sand-dark"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-ink/40 hover:text-ink transition-colors rounded-full hover:bg-sand-dark"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Writing Canvas */}
        <div className="flex-1 overflow-y-auto px-8 md:px-16 py-12 flex flex-col gap-6 scroll-smooth">
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of this moment..."
            className={cn(
              "text-3xl md:text-4xl font-serif font-bold bg-transparent border-none outline-none placeholder:text-ink/10 w-full",
              defaultType === 'page' && "font-vintage"
            )}
          />
          
          <textarea 
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely... this is your space."
            className={cn(
              "flex-1 text-lg md:text-xl leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-ink/10 w-full min-h-[400px]",
              defaultType === 'page' && "font-vintage",
              defaultType === 'lyrics' && "font-serif italic"
            )}
          />

          {/* Signature (Requested Feature) */}
          <div className="mt-12 pt-8 border-t border-ink/5 flex flex-col items-end opacity-40 hover:opacity-100 transition-opacity">
            <p className="font-signature text-3xl text-sage-dark">
              {auth.currentUser?.displayName || 'Your Name'}
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-1">Digital Signature</p>
          </div>
        </div>

        {/* Floating Action Menu (Requested Feature) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-4">
            <AnimatePresence>
              {isOptionsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="glass p-6 rounded-3xl shadow-xl w-[320px] md:w-[480px] flex flex-col gap-6"
                >
                  {/* Mood Selection */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-3 block">How are you feeling?</label>
                    <div className="grid grid-cols-6 gap-2">
                      {MOODS.map((m) => (
                        <button
                          key={m.l}
                          onClick={() => setMood(m.e === mood ? '' : m.e)}
                          className={cn(
                            "p-2 rounded-xl text-xl transition-all hover:scale-110",
                            mood === m.e ? "bg-sage/20 scale-110" : "hover:bg-sand-dark"
                          )}
                          title={m.l}
                        >
                          {m.e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-3 block">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-sage/10 text-sage-dark text-xs rounded-lg flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-ink/30" />
                      <input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={addTag}
                        placeholder="Add tags (press Enter)"
                        className="w-full pl-8 pr-4 py-2 bg-sand-dark/50 rounded-xl text-xs outline-none focus:bg-sand-dark transition-colors"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          isPinned ? "bg-sage/20 text-sage-dark" : "text-ink/40 hover:bg-sand-dark"
                        )}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          isFavorite ? "bg-amber-100 text-amber-500" : "text-ink/40 hover:bg-sand-dark"
                        )}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving || !content.trim()}
                      className="px-6 py-2 bg-sage-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-sage-dark/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Entry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className={cn(
                "px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 group",
                isOptionsOpen ? "bg-sage-dark text-white scale-90" : "glass hover:scale-105"
              )}
            >
              <Sparkles className={cn("w-4 h-4", isOptionsOpen ? "text-white" : "text-sage-dark")} />
              <span className="text-sm font-bold tracking-wide">
                {isOptionsOpen ? "Close Options" : "✨ Options"}
              </span>
              <ChevronUp className={cn("w-4 h-4 transition-transform duration-300", isOptionsOpen && "rotate-180")} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

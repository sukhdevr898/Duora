import { motion } from 'framer-motion';
import { CalendarDays, Heart, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Sheet, useToast } from '../components/Overlay';
import { RichText } from '../components/RichText';
import { Sticker } from '../components/Sticker';
import { notes as seed, type Note } from '../data/mock';
import { useRouter } from '../nav/router';

const noteImages = ['/img/note-1.jpg', '/img/note-2.jpg', '/img/note-3.jpg', '/img/note-4.jpg'];
const moods = ['heart-pink', 'heart-violet', 'heart-lilac', 'heart-peach', 'heart-mint'];

export function Notes() {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const [notes, setNotes] = useState<Note[]>(seed);
  const [active, setActive] = useState<Note | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState(moods[0]);

  const save = () => {
    if (!title.trim()) {
      toast('Give your memory a title');
      return;
    }
    const note: Note = {
      id: `n-${Date.now()}`,
      title: title.trim(),
      lines: body
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      image: noteImages[Math.floor(Math.random() * noteImages.length)],
    };
    setNotes((prev) => [note, ...prev]);
    setTitle('');
    setBody('');
    setAdding(false);
    toast('Memory saved');
  };

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 10 }}>
          <span className="appbar__title">Notes</span>
          <span className="appbar__spacer" />
          <button
            type="button"
            className="fab-add"
            onClick={() => setAdding(true)}
            aria-label="New note"
          >
            <Plus size={21} strokeWidth={2.6} />
          </button>
        </div>

        <div className="screen-scroll">
          <div style={{ padding: '0 18px 24px' }} className="stack gap-10">
            {notes.map((note, i) => (
              <motion.button
                key={note.id}
                type="button"
                className="note-card"
                onClick={() => setActive(note)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.045, 0.3), duration: 0.34 }}
              >
                <span className="note-card__thumb">
                  <img src={note.image} alt="" loading="lazy" />
                </span>
                <span className="note-card__body">
                  <span className="note-card__title">
                    <RichText text={note.title} size={14} />
                  </span>
                  <span className="note-card__lines">
                    {note.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                  <span className="note-card__date">{note.date}</span>
                </span>
              </motion.button>
            ))}

            <button
              type="button"
              className="press"
              onClick={() => navigate({ name: 'conversation' })}
              style={{
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 48,
                borderRadius: 18,
                border: '1.5px dashed rgba(109, 75, 246, 0.28)',
                color: 'var(--primary)',
                fontSize: 12.5,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.5)',
              }}
            >
              <Sparkles size={15} strokeWidth={2.2} />
              Write one together
            </button>
          </div>
        </div>
      </div>
      <BottomNav active="notes" />

      {/* note detail */}
      <Sheet
        open={!!active}
        onClose={() => setActive(null)}
        titleNode={active ? <RichText text={active.title} size={17} /> : null}
        subtitle={active ? `${active.date} · saved in our space` : undefined}
      >
        {active && (
          <div>
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 14,
              }}
            >
              <img
                src={active.image}
                alt=""
                style={{ width: '100%', height: 180, objectFit: 'cover' }}
              />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {active.lines.map((line) => (
                <div
                  key={line}
                  className="row"
                  style={{ fontSize: 14, fontWeight: 600, color: '#3a3157', gap: 9 }}
                >
                  <Heart size={13} strokeWidth={2.6} color="#a78bfa" fill="#c4b0ff" />
                  {line}
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 16, gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary grow"
                onClick={() => {
                  setActive(null);
                  toast('Added to our memories');
                }}
              >
                <Sparkles size={16} strokeWidth={2.2} />
                Save to memories
              </button>
              <button
                type="button"
                className="icon-btn press"
                style={{ width: 52, height: 52, color: '#e5484d' }}
                onClick={() => {
                  setNotes((prev) => prev.filter((n) => n.id !== active.id));
                  setActive(null);
                  toast('Note deleted');
                }}
                aria-label="Delete note"
              >
                <Trash2 size={19} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* add note */}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="New memory"
        subtitle="A little page of your story, kept just for the two of you."
      >
        <div className="stack" style={{ gap: 12 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title, like “Our first call”"
            style={{
              height: 50,
              borderRadius: 16,
              border: '1px solid var(--line-strong)',
              padding: '0 16px',
              fontSize: 14,
              fontWeight: 600,
              outline: 'none',
              background: '#faf8ff',
            }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'One thought per line...\nYour voice\nYour laugh\nYour care'}
            rows={4}
            style={{
              borderRadius: 16,
              border: '1px solid var(--line-strong)',
              padding: '14px 16px',
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.6,
              outline: 'none',
              background: '#faf8ff',
              resize: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div className="row" style={{ gap: 8 }}>
            <span className="t-caption" style={{ marginRight: 2 }}>
              Mood
            </span>
            {moods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                aria-label={`Mood ${m}`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  display: 'grid',
                  placeItems: 'center',
                  background: mood === m ? 'var(--primary-soft)' : '#f8f6fd',
                  boxShadow: mood === m ? '0 0 0 1.5px var(--primary)' : 'none',
                  transition: 'all .18s ease',
                }}
              >
                <Sticker id={m} size={26} />
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={save}>
            <CalendarDays size={17} strokeWidth={2.2} />
            Save memory
          </button>
        </div>
      </Sheet>
    </div>
  );
}

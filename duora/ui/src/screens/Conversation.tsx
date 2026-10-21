import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Send,
  Smile,
  Sticker as StickerIcon,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Sheet, useToast } from '../components/Overlay';
import { RichText } from '../components/RichText';
import { Sticker, stickers } from '../components/Sticker';
import { messages as seed, partner, quickReplies, type Message } from '../data/mock';
import { useRouter } from '../nav/router';

const now = () =>
  new Date()
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
    .replace(/\s/g, ' ')
    .replace(/^0/, '');

const replies = [
  'I miss you more 💜',
  'Call me when you are free 💖',
  'You always make me smile 🥰',
  'Texting you is my favourite part of the day ✨',
  'Can’t wait to see you 🌙',
];

export function Conversation() {
  const { back, navigate } = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<Message[]>(seed);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToEnd = (smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToEnd();
  }, []);

  useEffect(() => {
    if (typing) scrollToEnd(true);
  }, [typing]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    const id = `me-${Date.now()}`;
    setItems((prev) => [...prev, { id, from: 'me', text: value, time: now(), status: 'sent' }]);
    setDraft('');
    setEmojiOpen(false);
    requestAnimationFrame(() => scrollToEnd(true));

    window.setTimeout(() => {
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'delivered' as const } : m)),
      );
    }, 700);
    window.setTimeout(() => {
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' as const } : m)));
      setTyping(true);
    }, 1500);

    window.setTimeout(
      () => {
        setTyping(false);
        setItems((prev) => [
          ...prev,
          {
            id: `her-${Date.now()}`,
            from: 'her',
            text: replies[Math.floor(Math.random() * replies.length)],
            time: now(),
          },
        ]);
        requestAnimationFrame(() => scrollToEnd(true));
      },
      1500 + 2100,
    );
  };

  const sendSticker = (stickerId: string) => {
    const id = `me-${Date.now()}`;
    setItems((prev) => [...prev, { id, from: 'me', sticker: stickerId, time: now(), status: 'sent' }]);
    setEmojiOpen(false);
    requestAnimationFrame(() => scrollToEnd(true));
    window.setTimeout(() => {
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' as const } : m)));
      setTyping(true);
    }, 1400);
    window.setTimeout(
      () => {
        setTyping(false);
        setItems((prev) => [
          ...prev,
          {
            id: `her-${Date.now()}`,
            from: 'her',
            text: replies[Math.floor(Math.random() * replies.length)],
            time: now(),
          },
        ]);
        requestAnimationFrame(() => scrollToEnd(true));
      },
      3400,
    );
  };

  const react = (id: string) => {
    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const has = m.reactions?.includes('❤️');
        return {
          ...m,
          reactions: has ? (m.reactions ?? []).filter((r) => r !== '❤️') : [...(m.reactions ?? []), '❤️'],
        };
      }),
    );
  };

  return (
    <div className="screen" style={{ background: '#fbf9ff' }}>
      <div className="convo">
        <div className="convo__head">
          <button type="button" className="icon-btn ghost press" onClick={back} aria-label="Back">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </button>
          <span onClick={() => toast('Ruhi is online')}>
            <Avatar src={partner.photo} size={36} online alt={partner.fullName} />
          </span>
          <div className="convo__who">
            <span className="convo__name" style={{ display: 'block' }}>
              {partner.name}
            </span>
            <span
              className="convo__status"
              style={typing ? { color: 'var(--primary-2)' } : undefined}
            >
              {typing ? 'typing…' : 'Online'}
            </span>
          </div>
          <div className="convo__actions">
            <button
              type="button"
              className="icon-btn soft press"
              style={{ width: 36, height: 36 }}
              onClick={() => navigate({ name: 'audio-call' })}
              aria-label="Voice call"
            >
              <Phone size={16} strokeWidth={2.3} />
            </button>
            <button
              type="button"
              className="icon-btn soft press"
              style={{ width: 36, height: 36 }}
              onClick={() => navigate({ name: 'video-call' })}
              aria-label="Video call"
            >
              <Video size={17} strokeWidth={2.3} />
            </button>
            <button
              type="button"
              className="icon-btn ghost press"
              style={{ width: 32, height: 36 }}
              onClick={() => setAttachOpen(true)}
              aria-label="More options"
            >
              <MoreVertical size={18} strokeWidth={2.3} />
            </button>
          </div>
        </div>

        <div className="convo__scroll" ref={scrollRef}>
          <div className="day-chip">Today</div>

          {items.map((m) => (
            <div key={m.id} className={`msg-row ${m.from === 'me' ? 'out' : 'in'}`}>
              <div
                className="bubble-wrap"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.from === 'me' ? 'flex-end' : 'flex-start',
                }}
              >
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`bubble ${m.from === 'me' ? 'out' : 'in'}`}
                  onClick={() => react(m.id)}
                >
                  {m.sticker ? (
                    <span className="bubble__sticker">
                      <Sticker id={m.sticker} size={62} />
                    </span>
                  ) : m.emoji ? (
                    <span className="emoji-only heart-emoji">{m.emoji}</span>
                  ) : (
                    <RichText text={m.text ?? ''} size={14} sparkleColor="#E4D6FF" />
                  )}
                  <span className="bubble__meta">
                    {m.time}
                    {m.from === 'me' &&
                      (m.status === 'sent' ? (
                        <Check size={11} strokeWidth={3} />
                      ) : (
                        <CheckCheck
                          size={12}
                          strokeWidth={2.6}
                          style={{ opacity: m.status === 'read' ? 1 : 0.65 }}
                        />
                      ))}
                  </span>
                </motion.button>
                {m.reactions && m.reactions.length > 0 && (
                  <div
                    className="bubble__reactions"
                    style={{
                      paddingInline: 8,
                      justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {m.reactions.map((r) => (
                      <button key={r} type="button" className="reaction" onClick={() => react(m.id)}>
                        <RichText text={r} size={13} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <AnimatePresence>
            {typing && (
              <motion.div
                className="msg-row in"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
              >
                <div className="typing-bubble" aria-label="Ruhi is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div style={{ height: 6 }} />
        </div>

        <div className="quick-row">
          {quickReplies.map((q) => (
            <button key={q} type="button" className="quick-chip" onClick={() => send(q)}>
              <RichText text={q} size={12.5} />
            </button>
          ))}
        </div>

        <div className="composer">
          <button
            type="button"
            className="composer__plus press"
            onClick={() => setAttachOpen(true)}
            aria-label="Add attachment"
          >
            <Plus size={21} strokeWidth={2.4} />
          </button>

          <div className="composer__field">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(draft);
              }}
              placeholder={`Message ${partner.name}...`}
              aria-label="Message"
              enterKeyHint="send"
            />
            <button
              type="button"
              className="composer__tool"
              onClick={() => setEmojiOpen(true)}
              aria-label="Stickers"
            >
              <Smile size={19} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="composer__tool"
              onClick={() => toast('Attachments coming soon')}
              aria-label="Attach file"
            >
              <Paperclip size={18} strokeWidth={2} />
            </button>
          </div>

          <motion.button
            type="button"
            className="composer__send"
            whileTap={{ scale: 0.9 }}
            disabled={!draft.trim()}
            onClick={() => send(draft)}
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={2.4} style={{ marginLeft: 2 }} />
          </motion.button>
        </div>
      </div>

      <Sheet
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        title="Stickers"
        subtitle="Little ways to say it — handmade for your two hearts."
      >
        <div className="sticker-grid">
          {stickers.map((s) => (
            <button
              key={s.id}
              type="button"
              className="sticker-btn"
              onClick={() => sendSticker(s.id)}
              aria-label={`Send sticker ${s.id}`}
            >
              <Sticker id={s.id} size={54} />
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Share something"
        subtitle="Photos, voice notes and memories stay between the two of you."
      >
        <div className="attach-grid">
          {[
            { icon: ImageIcon, label: 'Photos' },
            { icon: Camera, label: 'Camera' },
            { icon: Mic, label: 'Voice note' },
            { icon: StickerIcon, label: 'Sticker' },
            { icon: Phone, label: 'Call' },
            { icon: Video, label: 'Video call' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="attach-tile"
              onClick={() => {
                setAttachOpen(false);
                if (label === 'Call') navigate({ name: 'audio-call' });
                else if (label === 'Video call') navigate({ name: 'video-call' });
                else toast(`${label} coming soon`);
              }}
            >
              <Icon size={20} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

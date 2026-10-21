import { motion } from 'framer-motion';
import { CheckCheck, Image as ImageIcon, Link2, Lock, Search, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { HeartOrb, LogoHearts, Sparkle } from '../components/Brand';
import { ConnectionPill } from '../components/ConnectionPill';
import { RichText } from '../components/RichText';
import { partner } from '../data/mock';
import { useRouter } from '../nav/router';
import { useApp } from '../state/app';

export function Chats() {
  const { navigate } = useRouter();
  const { pairing } = useApp();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const linked = pairing.phase === 'matched';
  const chats = useMemo(
    () =>
      linked
        ? [
            {
              id: 'c-ruhi',
              name: partner.name,
              photo: partner.photo,
              preview: 'Call me 💖',
              time: '10:28 am',
              unread: 2,
              online: true,
            },
            {
              id: 'c-notes',
              name: 'Shared memories',
              photo: '',
              preview: 'Our First Call · 12 Oct',
              time: 'yesterday',
              unread: 0,
              online: false,
              special: true,
            },
            {
              id: 'c-vault',
              name: 'Secret corner',
              photo: '',
              preview: 'A note only you two can read',
              time: '9 Oct',
              unread: 0,
              online: false,
              special: true,
            },
          ]
        : [],
    [linked],
  );

  const filtered = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.preview.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ justifyContent: 'space-between', paddingTop: 10 }}>
          <div className="brand">
            <LogoHearts size={26} />
            <span className="brand__word">Duora</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <ConnectionPill compact />
            <button
              type="button"
              className={`icon-btn ${searching ? 'soft' : 'ghost'} press`}
              aria-label={searching ? 'Close search' : 'Search chats'}
              onClick={() => {
                setSearching((v) => !v);
                setQuery('');
              }}
            >
              {searching ? <X size={18} strokeWidth={2.2} /> : <Search size={18} strokeWidth={2.2} />}
            </button>
            <button
              type="button"
              className="icon-btn soft press"
              aria-label="Pairing"
              onClick={() => navigate({ name: 'pairing' })}
            >
              <Link2 size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
          {searching && (
            <div style={{ padding: '2px 20px 12px' }}>
              <div className="searchbar">
                <Search size={16} strokeWidth={2.2} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your chat…"
                  aria-label="Search chats"
                />
              </div>
            </div>
          )}

          {filtered.length > 0 ? (
            <div style={{ padding: '0 18px 20px' }} className="stack gap-10">
              <div className="section-head" style={{ padding: '0 2px 4px' }}>
                <span className="section-head__title" style={{ fontSize: 13 }}>
                  Your private space
                </span>
                <span className="t-caption">{chats.length} chats</span>
              </div>

              {filtered.map((c) => (
                <motion.button
                  key={c.id}
                  type="button"
                  className="chat-row"
                  onClick={() => navigate({ name: 'conversation' })}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {c.special ? (
                    <span className="chat-row__glyph">
                      {c.id === 'c-notes' ? (
                        <ImageIcon size={19} strokeWidth={2.1} />
                      ) : (
                        <Lock size={19} strokeWidth={2.1} />
                      )}
                    </span>
                  ) : (
                    <Avatar src={c.photo} size={50} ring online={c.online} alt={c.name} />
                  )}
                  <span className="chat-row__body">
                    <span className="chat-row__top">
                      <span className="chat-row__name">{c.name}</span>
                      <span className="chat-row__time">{c.time}</span>
                    </span>
                    <span className="chat-row__msg">
                      {c.special ? (
                        <Sparkles size={13} strokeWidth={2.6} />
                      ) : (
                        <CheckCheck size={13} strokeWidth={2.6} />
                      )}
                      <RichText text={c.preview} size={12.5} />
                    </span>
                  </span>
                  {c.unread > 0 && <span className="unread-dot">{c.unread}</span>}
                </motion.button>
              ))}

              <div className="quote-card" style={{ margin: '6px 0 0' }}>
                <div className="quote-card__balloon">
                  <HeartOrb size={38} tone="violet" />
                </div>
                <div className="quote-card__text" style={{ fontSize: 12.5 }}>
                  <b>Tip:</b> long-press a message to react, reply or save it as a memory.
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'center', marginTop: 8, gap: 6 }}>
                <span
                  className="row"
                  style={{ gap: 6, color: 'var(--text-3)', fontSize: 10.5, fontWeight: 600 }}
                >
                  <Lock size={11} strokeWidth={2.2} /> End-to-end private · just you two
                </span>
              </div>
            </div>
          ) : linked ? (
            <div className="empty">
              <div className="empty__art">
                <Search size={52} strokeWidth={1.4} color="#c9bee6" />
              </div>
              <h2 className="empty__title" style={{ fontSize: 18 }}>
                No chats found
              </h2>
              <p className="empty__sub">Try a different name or word.</p>
            </div>
          ) : (
            <div className="empty">
              <div className="empty__art">
                <HeartOrb size={140} tone="violet" />
                <Sparkle className="sparkle" style={{ width: 15, height: 15, top: 16, right: 6 }} />
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity }}
                >
                  <Sparkle style={{ width: 11, height: 11, position: 'absolute', top: 26, right: 30 }} />
                </motion.div>
                <Sparkle style={{ width: 9, height: 9, position: 'absolute', bottom: 26, left: 4 }} />
                <Sparkle style={{ width: 13, height: 13, position: 'absolute', bottom: 12, right: 16 }} />
              </div>

              <h2 className="empty__title">No Chats Yet</h2>
              <p className="empty__sub">
                Start a conversation with your special one <RichText text="💖" size={13} />
              </p>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                className="btn btn-primary"
                onClick={() => navigate({ name: 'pairing' })}
              >
                <Sparkles size={15} strokeWidth={2.4} />
                Pair with your person
              </motion.button>

              <div
                className="row"
                style={{ marginTop: 22, color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}
              >
                <Lock size={12} strokeWidth={2.2} />
                End-to-end private · just you two
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav active="chat" />
    </div>
  );
}

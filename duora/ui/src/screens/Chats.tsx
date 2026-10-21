import { motion } from 'framer-motion';
import { Lock, Search } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { HeartOrb, LogoHearts, Sparkle } from '../components/Brand';
import { partner } from '../data/mock';
import { useRouter } from '../nav/router';

export function Chats() {
  const { navigate } = useRouter();

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ justifyContent: 'space-between', paddingTop: 10 }}>
          <div className="brand">
            <LogoHearts size={26} />
            <span className="brand__word">Duora</span>
          </div>
          <button type="button" className="icon-btn soft press" aria-label="Search chats">
            <Search size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="empty">
            <div className="empty__art">
              <HeartOrb size={140} tone="violet" />
              <Sparkle className="sparkle" style={{ width: 15, height: 15, top: 16, right: 6 }} />
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.6, repeat: Infinity }}>
                <Sparkle style={{ width: 11, height: 11, position: 'absolute', top: 26, right: 30 }} />
              </motion.div>
              <Sparkle style={{ width: 9, height: 9, position: 'absolute', bottom: 26, left: 4 }} />
              <Sparkle style={{ width: 13, height: 13, position: 'absolute', bottom: 12, right: 16 }} />
            </div>

            <h2 className="empty__title">No Chats Yet</h2>
            <p className="empty__sub">
              Start a conversation with your special one{' '}
              <span className="heart-emoji">💖</span>
            </p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              className="btn btn-primary"
              onClick={() => navigate({ name: 'conversation' })}
            >
              Say hello to {partner.name}
            </motion.button>

            <div
              className="row"
              style={{ marginTop: 22, color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}
            >
              <Lock size={12} strokeWidth={2.2} />
              End-to-end private · just you two
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="chat" />
    </div>
  );
}

import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { HeartOrb, LogoHearts, WelcomeWaves } from '../components/Brand';
import { useRouter } from '../nav/router';

export function Welcome() {
  const { switchTab } = useRouter();

  return (
    <div className="welcome">
      <div
        className="welcome__cloud"
        style={{ width: 190, height: 130, top: '13%', left: -54, opacity: 0.75 }}
      />
      <div
        className="welcome__cloud"
        style={{ width: 150, height: 100, top: '21%', right: -40, opacity: 0.6 }}
      />
      <div
        className="welcome__cloud"
        style={{ width: 230, height: 150, top: '6%', right: 40, opacity: 0.35 }}
      />

      <div className="welcome__content">
        <motion.div
          className="logo-lockup"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.1 }}
          >
            <LogoHearts size={92} />
          </motion.div>
          <span className="wordmark">Duora</span>
          <span className="tagline">Just You &amp; Me</span>
        </motion.div>
      </div>

      <motion.div
        style={{ position: 'absolute', zIndex: 2, right: '16%', top: '30%', pointerEvents: 'none' }}
        animate={{ y: [0, -9, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <HeartOrb size={54} tone="pink" />
      </motion.div>
      <motion.div
        style={{ position: 'absolute', zIndex: 2, left: '13%', top: '47%', pointerEvents: 'none' }}
        animate={{ y: [0, 8, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <HeartOrb size={34} tone="violet" />
      </motion.div>

      <WelcomeWaves />

      <div className="welcome__bottom">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          style={{ textAlign: 'center' }}
        >
          <div className="welcome__script script">
            Closer
            <br />
            Every Day
            <span className="heart">
              <Heart size={13} fill="currentColor" strokeWidth={0} />
            </span>
          </div>
        </motion.div>

        <motion.div
          className="welcome__actions"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <button
            type="button"
            className="btn welcome__cta btn-block"
            onClick={() => switchTab('home')}
          >
            Enter my space
            <ArrowRight size={18} strokeWidth={2.6} />
          </button>
          <div className="welcome__ghost">Private · just the two of you</div>
        </motion.div>
      </div>
    </div>
  );
}

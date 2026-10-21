import { motion } from 'framer-motion';
import { Home, MessageCircle, Phone, StickyNote, Settings } from 'lucide-react';
import { useRouter, type Route } from '../nav/router';

const items: { key: Route['name']; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'chat', label: 'Chat', icon: MessageCircle },
  { key: 'calls', label: 'Calls', icon: Phone },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav({ active }: { active: Route['name'] }) {
  const { switchTab } = useRouter();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => !isActive && switchTab(key as 'home')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="nav-item__icon">
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="nav-item__pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
            </span>
            <span className="nav-item__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

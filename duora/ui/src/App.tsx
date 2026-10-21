import { AnimatePresence, motion } from 'framer-motion';
import { StatusBar } from './components/StatusBar';
import { ToastProvider } from './components/Overlay';
import { RouterProvider, useRouter, type Route } from './nav/router';
import { Appearance } from './screens/Appearance';
import { AudioCall } from './screens/AudioCall';
import { Calls } from './screens/Calls';
import { Chats } from './screens/Chats';
import { Conversation } from './screens/Conversation';
import { Home } from './screens/Home';
import { Notes } from './screens/Notes';
import { Settings } from './screens/Settings';
import { VideoCall } from './screens/VideoCall';
import { Welcome } from './screens/Welcome';

const darkRoutes: Route['name'][] = ['audio-call', 'video-call'];

const frameBg: Partial<Record<Route['name'], string>> = {
  welcome: '#f6f0ff',
  home: '#f8f3ff',
  chat: '#f8f3ff',
  calls: '#f8f3ff',
  notes: '#f8f3ff',
  settings: '#f8f3ff',
  appearance: '#f8f3ff',
  conversation: '#faf7ff',
  'audio-call': '#2a1b4d',
  'video-call': '#0d0918',
};

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'welcome':
      return <Welcome />;
    case 'home':
      return <Home />;
    case 'chat':
      return <Chats />;
    case 'calls':
      return <Calls />;
    case 'notes':
      return <Notes />;
    case 'settings':
      return <Settings />;
    case 'appearance':
      return <Appearance />;
    case 'conversation':
      return <Conversation />;
    case 'audio-call':
      return <AudioCall />;
    case 'video-call':
      return <VideoCall />;
    default:
      return <Home />;
  }
}

function Shell() {
  const { route, direction } = useRouter();
  const isCall = darkRoutes.includes(route.name);
  const isWelcome = route.name === 'welcome';
  const isVideo = route.name === 'video-call';

  const variants = isCall
    ? {
        initial: { y: '100%', opacity: 0.6 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0.6 },
      }
    : {
        initial: { x: direction === 1 ? 26 : -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: direction === 1 ? -14 : 22, opacity: 0 },
      };

  return (
    <div className="stage">
      <div className="frame" style={{ background: frameBg[route.name] ?? 'var(--bg)' }}>
        <ToastProvider>
          <StatusBar light={isCall || isVideo} time={isWelcome ? '10:29' : '10:29'} />
          <div className="app-surface">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={route.name}
                style={{ position: 'absolute', inset: 0 }}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={
                  isCall
                    ? { type: 'spring', stiffness: 260, damping: 30 }
                    : { duration: 0.26, ease: [0.22, 0.9, 0.25, 1] }
                }
              >
                <Screen route={route} />
              </motion.div>
            </AnimatePresence>
          </div>
        </ToastProvider>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}

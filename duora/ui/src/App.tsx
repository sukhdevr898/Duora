import { AnimatePresence, motion } from 'framer-motion';
import { StatusBar } from './components/StatusBar';
import { ToastProvider } from './components/Overlay';
import { RouterProvider, useRouter, type Route } from './nav/router';
import { AppProvider, useApp } from './state/app';
import { Appearance } from './screens/Appearance';
import { AudioCall } from './screens/AudioCall';
import { Calls } from './screens/Calls';
import { Chats } from './screens/Chats';
import { Conversation } from './screens/Conversation';
import { Home } from './screens/Home';
import { Notes } from './screens/Notes';
import { Pairing } from './screens/Pairing';
import { Scanner } from './screens/Scanner';
import { ServerStatus } from './screens/ServerStatus';
import { Settings } from './screens/Settings';
import { SubSettings } from './screens/SubSettings';
import { VideoCall } from './screens/VideoCall';
import { Welcome } from './screens/Welcome';
import { settingSections } from './data/settingsSections';

const slideUpRoutes: Route['name'][] = ['audio-call', 'video-call', 'scanner'];

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
    case 'server':
      return <ServerStatus />;
    case 'pairing':
      return <Pairing />;
    case 'scanner':
      return <Scanner />;
    case 'sub-settings': {
      const section = settingSections[route.section];
      return section ? <SubSettings section={section} /> : <Settings />;
    }
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
  const { resolvedMode, accent, heartMotion, glass, loveMode } = useApp();
  const dark = resolvedMode === 'dark';
  const isVideo = route.name === 'video-call';
  const isCall = route.name === 'audio-call';
  const slideUp = slideUpRoutes.includes(route.name);

  const frameBg = isVideo
    ? '#0d0918'
    : isCall
      ? '#2a1b4d'
      : route.name === 'welcome'
        ? dark
          ? '#1a1233'
          : '#f6f0ff'
        : 'var(--bg)';

  const variants = slideUp
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
    <div className={`stage ${dark ? 'stage--dark' : ''}`}>
      <div
        className="frame"
        data-mode={resolvedMode}
        data-accent={accent}
        data-motion={heartMotion ? 'on' : 'off'}
        data-glass={glass ? 'on' : 'off'}
        data-love={loveMode ? 'on' : 'off'}
        style={{ background: frameBg }}
      >
        <ToastProvider>
          <StatusBar light={isCall || isVideo || dark} />
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
                  slideUp
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
      <AppProvider>
        <Shell />
      </AppProvider>
    </RouterProvider>
  );
}

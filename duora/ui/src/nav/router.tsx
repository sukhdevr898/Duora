import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'welcome' }
  | { name: 'home' }
  | { name: 'chat' }
  | { name: 'calls' }
  | { name: 'notes' }
  | { name: 'settings' }
  | { name: 'conversation' }
  | { name: 'audio-call' }
  | { name: 'video-call' }
  | { name: 'appearance' }
  | { name: 'server' }
  | { name: 'pairing' }
  | { name: 'scanner' }
  | { name: 'sub-settings'; section: string };

const TAB_ROUTES: Route['name'][] = ['home', 'chat', 'calls', 'notes', 'settings'];

type RouterValue = {
  route: Route;
  direction: 1 | -1;
  navigate: (route: Route) => void;
  back: () => void;
  switchTab: (name: (typeof TAB_ROUTES)[number]) => void;
};

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'welcome' }]);
  const [direction, setDirection] = useState<1 | -1>(1);

  const route = stack[stack.length - 1];

  const navigate = useCallback((next: Route) => {
    setDirection(1);
    setStack((prev) => (prev[prev.length - 1]?.name === next.name ? prev : [...prev, next]));
  }, []);

  const back = useCallback(() => {
    setDirection(-1);
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const switchTab = useCallback((name: (typeof TAB_ROUTES)[number]) => {
    setDirection(1);
    setStack((prev) => {
      const base: Route = TAB_ROUTES.includes(prev[0].name) ? prev[0] : { name: 'home' };
      const next = { name } as Route;
      return [base, next];
    });
  }, []);

  const value = useMemo(
    () => ({ route, direction, navigate, back, switchTab }),
    [route, direction, navigate, back, switchTab],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export const tabs = TAB_ROUTES;

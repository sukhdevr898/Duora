import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Check, Info } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { RichText } from './RichText';

/* ------------------------------------------------------------------ */
/* Bottom sheet                                                       */
/* ------------------------------------------------------------------ */
type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: ViewStyle;
};

export function Sheet({ visible, onClose, title, subtitle, children, contentStyle }: SheetProps) {
  const { t } = useDuoraTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(220)}
          style={[
            styles.sheet,
            {
              // The sheet sits on top of the app, so it needs to be solid -
              // a translucent card let the page underneath bleed through.
              backgroundColor: t.surface,
              borderColor: t.line,
              paddingBottom: insets.bottom + 18,
            },
            contentStyle,
          ]}
        >
          <View style={[styles.grab, { backgroundColor: t.lineStrong }]} />
          {title ? <Text style={[styles.title, { color: t.text }]}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.sub, { color: t.text2 }]}>{subtitle}</Text> : null}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: subtitle ? 14 : 8 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Toast                                                              */
/* ------------------------------------------------------------------ */
export type ToastTone = 'info' | 'success' | 'error';

type ToastCtx = { toast: (message: string, tone?: ToastTone) => void };
const ToastContext = createContext<ToastCtx>({ toast: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useDuoraTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<ToastTone>('info');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, nextTone: ToastTone = 'info') => {
    setTone(nextTone);
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const accent = tone === 'success' ? t.mint : tone === 'error' ? t.danger : t.primary;
  const ToneIcon = tone === 'success' ? Check : tone === 'error' ? AlertCircle : Info;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message ? (
        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(240)}
          exiting={FadeOut.duration(140)}
          style={[styles.toast, { backgroundColor: t.text }]}
          pointerEvents="none"
          accessibilityRole="alert"
        >
          <View style={[styles.toastIcon, { backgroundColor: `${accent}33` }]}>
            <ToneIcon size={13} strokeWidth={3} color={accent} />
          </View>
          <RichText text={message} size={12.5} color={t.bg} style={styles.toastText} />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24, 14, 46, 0.42)',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '82%',
  },
  grab: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});

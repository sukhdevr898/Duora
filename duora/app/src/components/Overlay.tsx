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
import { Check } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';

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
              backgroundColor: t.card,
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
type ToastCtx = { toast: (message: string) => void };
const ToastContext = createContext<ToastCtx>({ toast: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useDuoraTheme();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2100);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message ? (
        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(240)}
          exiting={FadeOut.duration(140)}
          style={[styles.toast, { backgroundColor: t.text }]}
          pointerEvents="none"
        >
          <Check size={15} strokeWidth={3} color={t.bg} />
          <Text style={[styles.toastText, { color: t.bg }]}>{message}</Text>
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
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});

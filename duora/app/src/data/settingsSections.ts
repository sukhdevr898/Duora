import {
  Bell,
  Globe2,
  Info,
  Keyboard,
  LifeBuoy,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Palette,
  Phone,
  ShieldCheck,
  Smartphone,
  User,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native';

export type SettingKind = 'toggle' | 'value' | 'link' | 'action';

export type SettingItem = {
  label: string;
  detail?: string;
  kind: SettingKind;
  value?: string;
  icon?: LucideIcon;
  danger?: boolean;
  /** When set, the row opens this route instead of doing anything else. */
  route?: string;
};

export type SettingSection = {
  key: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  groups: { title?: string; items: SettingItem[] }[];
};

export const settingSections: Record<string, SettingSection> = {
  account: {
    key: 'account',
    title: 'Account',
    blurb: 'Your details, devices and who you are to her.',
    icon: User,
    groups: [
      {
        items: [
          { label: 'Display name', kind: 'value', value: 'Sukhdev', icon: User },
          { label: 'Handle', kind: 'value', value: '@sukhdev', icon: Smartphone },
          { label: 'Email', kind: 'value', value: 'sukhdev@duora.app', icon: Mail },
          { label: 'Phone', kind: 'value', value: 'Not added', icon: Phone },
        ],
      },
      {
        title: 'Your space',
        items: [
          { label: 'Partner', kind: 'value', value: 'ruhi', icon: MessageSquare },
          { label: 'Matched on', kind: 'value', value: 'Not yet', icon: Info },
          { label: 'Love theme', kind: 'value', value: 'Violet Love', icon: Palette },
        ],
      },
      {
        title: 'Devices',
        items: [
          { label: 'This phone', kind: 'value', value: 'Active now', icon: Smartphone },
          { label: 'Duora for Web', kind: 'value', value: 'Connected', icon: Globe2 },
        ],
      },
    ],
  },

  'chat-settings': {
    key: 'chat-settings',
    title: 'Chat Settings',
    blurb: 'Make the conversation feel exactly like yours.',
    icon: MessageSquare,
    groups: [
      {
        items: [
          { label: 'Read receipts', kind: 'toggle', detail: 'Show when she has read your message' },
          { label: 'Typing indicator', kind: 'toggle', detail: 'Let her know you are typing' },
          { label: 'Enter to send', kind: 'toggle', detail: 'Use the keyboard send key' },
        ],
      },
      {
        title: 'Appearance',
        items: [
          { label: 'Font size', kind: 'value', value: 'Comfortable', icon: Keyboard },
          { label: 'Bubble style', kind: 'value', value: 'Soft rounded', icon: Palette },
          { label: 'Night theme', kind: 'value', value: 'Follows app', icon: Moon },
        ],
      },
      {
        title: 'Media',
        items: [
          { label: 'Auto-download photos', kind: 'toggle', detail: 'On Wi-Fi only' },
          { label: 'Send voice notes by default', kind: 'toggle' },
        ],
      },
    ],
  },

  notifications: {
    key: 'notifications',
    title: 'Notifications',
    blurb: 'Only the good kind of interruptions.',
    icon: Bell,
    groups: [
      {
        items: [
          { label: 'Messages', kind: 'toggle', detail: 'Every little love note' },
          { label: 'Calls', kind: 'toggle', detail: 'Ring me anytime' },
          { label: 'Voice & video', kind: 'toggle' },
        ],
      },
      {
        title: 'Quiet hours',
        items: [
          { label: 'Enable quiet hours', kind: 'toggle', detail: '22:00 – 07:00' },
          { label: 'Allow from partner', kind: 'toggle', detail: 'She can always reach you' },
        ],
      },
      {
        title: 'Sound',
        items: [
          { label: 'Message tone', kind: 'value', value: 'Heartbeat', icon: Volume2 },
          { label: 'Call ringtone', kind: 'value', value: 'Soft chime', icon: Phone },
        ],
      },
    ],
  },

  privacy: {
    key: 'privacy',
    title: 'Privacy & Security',
    blurb: 'Locked to two. That is the whole point.',
    icon: Lock,
    groups: [
      {
        items: [
          { label: 'Encrypted connection', kind: 'value', value: 'Always on', icon: ShieldCheck },
          { label: 'App lock', kind: 'toggle', detail: 'Require passcode to open' },
          { label: 'Biometric unlock', kind: 'toggle' },
          { label: 'Two-factor sign-in', kind: 'toggle' },
        ],
      },
      {
        title: 'Visibility',
        items: [
          { label: 'App icon', kind: 'value', detail: 'Disguise Duora on your home screen', icon: ShieldCheck, route: '/privacy-icon' },
          { label: 'Show online status', kind: 'toggle' },
          { label: 'Show last seen', kind: 'toggle' },
          { label: 'Hide read receipts', kind: 'toggle' },
        ],
      },
      {
        title: 'Data',
        items: [
          { label: 'Download my data', kind: 'action', icon: Info },
          { label: 'Delete account', kind: 'action', danger: true, icon: Lock },
        ],
      },
    ],
  },

  language: {
    key: 'language',
    title: 'Language',
    blurb: 'Say it in the language you love most.',
    icon: Globe2,
    groups: [
      {
        items: [
          { label: 'App language', kind: 'value', value: 'English (India)', icon: Globe2 },
          { label: 'Spelling', kind: 'value', value: 'English (US)' },
          { label: 'Date format', kind: 'value', value: 'Today' },
          { label: 'Time format', kind: 'value', value: '24-hour' },
        ],
      },
      {
        title: 'More languages',
        items: [
          { label: 'हिन्दी', kind: 'action' },
          { label: 'ਪੰਜਾਬੀ', kind: 'action' },
          { label: 'Español', kind: 'action' },
          { label: 'Français', kind: 'action' },
        ],
      },
    ],
  },

  help: {
    key: 'help',
    title: 'Help & Support',
    blurb: 'We are here whenever you need us.',
    icon: LifeBuoy,
    groups: [
      {
        items: [
          { label: 'Getting started', kind: 'link' },
          { label: 'Pairing & codes', kind: 'link' },
          { label: 'Calls not connecting', kind: 'link' },
          { label: 'Account & sign-in', kind: 'link' },
        ],
      },
      {
        title: 'Contact',
        items: [
          { label: 'Chat with support', kind: 'action', icon: MessageSquare },
          { label: 'Email us', kind: 'action', icon: Mail },
          { label: 'Report a problem', kind: 'action', icon: Info },
        ],
      },
    ],
  },
};

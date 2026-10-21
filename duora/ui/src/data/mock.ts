export type TabKey = 'home' | 'chat' | 'calls' | 'notes' | 'settings';

export const partner = {
  name: 'ruhi',
  fullName: 'Ruhi',
  photo: '/img/partner.jpg',
  online: true,
  lastSeen: 'Online',
};

export const me = {
  name: 'Sukhdev',
  photo: '/img/me.jpg',
};

export type Message = {
  id: string;
  from: 'me' | 'her';
  text?: string;
  emoji?: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: string[];
};

export const messages: Message[] = [
  { id: 'm1', from: 'her', text: 'hello', time: '10:01 am' },
  { id: 'm2', from: 'me', text: 'how much', time: '10:02 am', status: 'read' },
  { id: 'm3', from: 'me', text: 'Call me 💖', time: '10:04 am', status: 'read' },
  { id: 'm4', from: 'me', text: 'Miss you ✨', time: '10:23 am', status: 'read', reactions: ['❤️'] },
  { id: 'm5', from: 'her', emoji: '🥺', time: '10:23 am' },
  { id: 'm6', from: 'me', text: 'Call me 💖', time: '10:24 am', status: 'read' },
  { id: 'm7', from: 'me', text: 'hello', time: '10:28 am', status: 'delivered' },
];

export const quickReplies = ['Miss you ✨', 'Call me 💖', '❤️', '🥺', 'Good night 🌙', 'Love you 💜'];

export const emojis = [
  '❤️', '😍', '🥰', '😘', '🫶', '💖', '💜',
  '😂', '🥺', '😊', '😴', '😭', '😅', '🤭',
  '✨', '💫', '🌸', '🌙', '☀️', '🎶', '🍫',
  '💐', '🧸', '💍', '🍰', '☕', '🫂', '💌',
];

export type CallLog = {
  id: string;
  type: 'Outgoing Call' | 'Incoming Call' | 'Missed Call' | 'Video Call';
  kind: 'voice' | 'video';
  missed?: boolean;
  time: string;
  day: string;
  duration?: string;
  clock: string;
};

export const callLogs: CallLog[] = [
  { id: 'c1', type: 'Outgoing Call', kind: 'voice', time: '12:34', day: 'Today, 10:24 am', clock: '10:24' },
  { id: 'c2', type: 'Incoming Call', kind: 'voice', time: '08:21', day: 'Today, 09:15 am', clock: '09:15' },
  { id: 'c3', type: 'Missed Call', kind: 'voice', missed: true, time: '11:20 pm', day: 'Yesterday, 11:20 pm', clock: '23:20' },
  { id: 'c4', type: 'Video Call', kind: 'video', time: '15:42', day: 'Yesterday, 10:05 pm', clock: '22:05' },
  { id: 'c5', type: 'Outgoing Call', kind: 'voice', time: '03:12', day: '12 Oct, 09:30 pm', clock: '21:30' },
  { id: 'c6', type: 'Video Call', kind: 'video', time: '07:05', day: '11 Oct, 08:12 pm', clock: '20:12' },
];

export type Note = {
  id: string;
  title: string;
  lines: string[];
  date: string;
  image: string;
};

export const notes: Note[] = [
  {
    id: 'n1',
    title: 'Our First Call 💖',
    lines: ['That moment when we first', 'talked...'],
    date: '12 Oct, 2026',
    image: '/img/note-1.jpg',
  },
  {
    id: 'n2',
    title: 'Things I Love About You 🩷',
    lines: ['Your voice', 'Your laugh'],
    date: '10 Oct, 2026',
    image: '/img/note-2.jpg',
  },
  {
    id: 'n3',
    title: 'Future Plans ✨',
    lines: ['Travel together', 'Watch movies', 'Create more memories...'],
    date: '8 Oct, 2026',
    image: '/img/note-3.jpg',
  },
  {
    id: 'n4',
    title: 'Special Days ❤️',
    lines: ['Our moments', 'Our happiness', 'Always together...'],
    date: '5 Oct, 2026',
    image: '/img/note-4.jpg',
  },
];

export type PaletteColor = { name: string; hex: string; label: string };

export const paletteTop: PaletteColor[] = [
  { name: 'Primary', hex: '#6345E8', label: 'Primary' },
  { name: 'Dark', hex: '#5032D8', label: 'Dark' },
  { name: 'Light', hex: '#F0EBFF', label: 'Light' },
];

export const paletteBottom: PaletteColor[] = [
  { name: 'Background', hex: '#FCFAFF', label: 'Background' },
  { name: 'Bubble', hex: '#F0EDFA', label: 'Bubble' },
  { name: 'Online', hex: '#22C55E', label: 'Online' },
  { name: 'Accent', hex: '#F58BBF', label: 'Accent' },
];

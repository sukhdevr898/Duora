import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Search,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { Sheet, useToast } from '../components/Overlay';
import { callLogs, partner, type CallLog } from '../data/mock';
import { useRouter } from '../nav/router';

type Filter = 'All' | 'Voice' | 'Video' | 'Missed';
const filters: Filter[] = ['All', 'Voice', 'Video', 'Missed'];

export function Calls() {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('All');
  const [selected, setSelected] = useState<CallLog | null>(null);

  const list = useMemo(() => {
    if (filter === 'All') return callLogs;
    if (filter === 'Missed') return callLogs.filter((c) => c.missed);
    return callLogs.filter((c) => c.kind === filter.toLowerCase());
  }, [filter]);

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 8 }}>
          <span className="appbar__title">Calls</span>
          <span className="appbar__spacer" />
          <button
            type="button"
            className="icon-btn ghost press"
            onClick={() => toast('Search calls')}
            aria-label="Search calls"
          >
            <Search size={19} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="icon-btn ghost press"
            onClick={() => toast('Clear call history')}
            aria-label="More call options"
          >
            <MoreVertical size={19} strokeWidth={2.2} />
          </button>
        </div>

        <div className="screen-scroll">
          <div style={{ display: 'flex', gap: 8, padding: '2px 20px 14px' }}>
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="stack" style={{ gap: 9, padding: '0 18px 24px' }}>
            {list.map((call, i) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.035, 0.25), duration: 0.3 }}
              >
                <div
                  className="call-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(call.kind === 'video' ? { name: 'video-call' } : { name: 'audio-call' })}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    navigate(call.kind === 'video' ? { name: 'video-call' } : { name: 'audio-call' })
                  }
                >
                  <Avatar src={partner.photo} size={42} alt={partner.fullName} />
                  <div className="call-row__body">
                    <div className="call-row__top">
                      <span className="call-row__name">{partner.name}</span>
                      <span className={`call-row__dir ${call.missed ? 'missed' : ''}`}>
                        {call.kind === 'video' ? (
                          <Video size={13} strokeWidth={2.4} />
                        ) : call.type === 'Incoming Call' ? (
                          <ArrowDownLeft size={13} strokeWidth={2.6} />
                        ) : call.missed ? (
                          <PhoneMissed size={13} strokeWidth={2.6} />
                        ) : (
                          <ArrowUpRight size={13} strokeWidth={2.6} />
                        )}
                      </span>
                    </div>
                    <div className={`call-row__type ${call.missed ? 'missed' : ''}`}>{call.type}</div>
                    <div className="t-caption" style={{ marginTop: 2 }}>
                      {call.day}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="call-row__time">{call.time}</span>
                    <button
                      type="button"
                      className="icon-btn ghost press"
                      style={{ width: 28, height: 30 }}
                      aria-label="Call options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(call);
                      }}
                    >
                      <MoreVertical size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {list.length === 0 && (
              <div className="empty" style={{ minHeight: 300 }}>
                <div className="empty__art" style={{ width: 120, height: 120 }}>
                  {filter === 'Missed' ? (
                    <PhoneMissed size={54} strokeWidth={1.4} color="#c9bee6" />
                  ) : (
                    <PhoneIncoming size={54} strokeWidth={1.4} color="#c9bee6" />
                  )}
                </div>
                <h3 className="empty__title" style={{ fontSize: 18 }}>
                  No {filter.toLowerCase()} calls
                </h3>
                <p className="empty__sub">Every call with {partner.name} will show up here.</p>
              </div>
            )}

            <div style={{ textAlign: 'center', paddingTop: 6 }}>
              <span className="t-caption">Call history is private to your space</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="calls" />

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Call with ${partner.name}`}
        subtitle={selected ? `${selected.type} · ${selected.day}` : undefined}
      >
        <div className="stack" style={{ gap: 8 }}>
          <button
            type="button"
            className="settings-row"
            style={{ borderRadius: 16, background: '#f8f5ff' }}
            onClick={() => {
              setSelected(null);
              navigate({ name: 'audio-call' });
            }}
          >
            <span className="settings-row__icon">
              <Phone size={16} strokeWidth={2.2} />
            </span>
            <span className="settings-row__label">Call back</span>
          </button>
          <button
            type="button"
            className="settings-row"
            style={{ borderRadius: 16, background: '#f8f5ff' }}
            onClick={() => {
              setSelected(null);
              navigate({ name: 'video-call' });
            }}
          >
            <span className="settings-row__icon">
              <Video size={16} strokeWidth={2.2} />
            </span>
            <span className="settings-row__label">Video call</span>
          </button>
          <button
            type="button"
            className="settings-row"
            style={{ borderRadius: 16, background: '#fdeef1' }}
            onClick={() => {
              setSelected(null);
              toast('Removed from history');
            }}
          >
            <span className="settings-row__icon" style={{ color: '#e5484d', background: '#fde3e5' }}>
              <PhoneMissed size={16} strokeWidth={2.2} />
            </span>
            <span className="settings-row__label" style={{ color: '#e5484d' }}>
              Remove from history
            </span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}

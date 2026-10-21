import { motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { RichText } from '../components/RichText';
import { useToast } from '../components/Overlay';
import { partner } from '../data/mock';
import type { SettingSection } from '../data/settingsSections';
import { useRouter } from '../nav/router';

export function SubSettings({ section }: { section: SettingSection }) {
  const { back } = useRouter();
  const { toast } = useToast();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Read receipts': true,
    'Typing indicator': true,
    'Enter to send': true,
    'Auto-download photos': true,
    'Send voice notes by default': false,
    Messages: true,
    Calls: true,
    'Voice & video': true,
    'Enable quiet hours': true,
    'Allow from partner': true,
    'App lock': true,
    'Biometric unlock': false,
    'Two-factor sign-in': false,
    'Show online status': true,
    'Show last seen': true,
    'Hide read receipts': false,
  });

  const SectionIcon = section.icon;

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 4 }}>
          <button type="button" className="icon-btn ghost press" onClick={back} aria-label="Back">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>{section.title}</span>
        </div>

        <div className="screen-scroll">
          <div style={{ padding: '6px 18px 26px' }}>
            <motion.div
              className="sub-head"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="sub-head__icon">
                <SectionIcon size={20} strokeWidth={2.2} />
              </span>
              <span className="grow">
                <span className="sub-head__title" style={{ display: 'block' }}>
                  {section.title}
                </span>
                <span className="sub-head__blurb" style={{ display: 'block' }}>
                  {section.blurb}
                </span>
              </span>
            </motion.div>

            {section.groups.map((group, gi) => (
              <div key={group.title ?? `g${gi}`}>
                {group.title && <div className="section-label">{group.title}</div>}
                <div className="settings-group" style={{ marginTop: group.title ? 2 : gi === 0 ? 0 : 14 }}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    if (item.kind === 'toggle') {
                      const on = toggles[item.label] ?? false;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className="settings-row"
                          onClick={() => setToggles((t) => ({ ...t, [item.label]: !on }))}
                        >
                          {Icon && (
                            <span className="settings-row__icon">
                              <Icon size={16} strokeWidth={2.1} />
                            </span>
                          )}
                          <span className="settings-row__label">
                            {item.label}
                            {item.detail && <span className="settings-row__detail">{item.detail}</span>}
                          </span>
                          <span
                            role="switch"
                            aria-checked={on}
                            aria-label={item.label}
                            className={`toggle ${on ? 'on' : ''}`}
                          />
                        </button>
                      );
                    }
                    if (item.kind === 'value') {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className="settings-row"
                          onClick={() => toast(`${item.label} — coming soon`)}
                        >
                          {Icon && (
                            <span className="settings-row__icon">
                              <Icon size={16} strokeWidth={2.1} />
                            </span>
                          )}
                          <span className="settings-row__label">{item.label}</span>
                          <span className="settings-row__value">{item.value}</span>
                          <ChevronRight className="settings-row__chev" size={17} strokeWidth={2.2} />
                        </button>
                      );
                    }
                    if (item.kind === 'link') {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className="settings-row"
                          onClick={() => toast(`Opening help article`)}
                        >
                          <span className="settings-row__label">{item.label}</span>
                          <ChevronRight className="settings-row__chev" size={17} strokeWidth={2.2} />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="settings-row"
                        onClick={() =>
                          toast(
                            item.danger ? 'This is a demo — nothing was deleted' : `${item.label} — done`,
                          )
                        }
                      >
                        {Icon && (
                          <span
                            className="settings-row__icon"
                            style={
                              item.danger
                                ? { background: 'rgba(244,69,63,0.12)', color: 'var(--danger)' }
                                : undefined
                            }
                          >
                            <Icon size={16} strokeWidth={2.1} />
                          </span>
                        )}
                        <span
                          className="settings-row__label"
                          style={item.danger ? { color: 'var(--danger)' } : undefined}
                        >
                          {item.label}
                        </span>
                        {!item.danger && (
                          <span className="settings-row__value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} strokeWidth={3} color="var(--mint)" />
                          </span>
                        )}
                        {item.danger && (
                          <ChevronRight className="settings-row__chev" size={17} strokeWidth={2.2} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div
              className="row"
              style={{ justifyContent: 'center', gap: 7, marginTop: 18, color: 'var(--text-3)' }}
            >
              <Avatar src={partner.photo} size={22} alt="" />
              <span className="t-caption">
                Shared with {partner.name} <RichText text="💜" size={9} />
              </span>
              <Sparkles size={11} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

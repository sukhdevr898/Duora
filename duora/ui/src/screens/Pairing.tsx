import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Heart,
  KeyRound,
  Link2,
  MessageSquare,
  QrCode,
  RefreshCw,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  Unlink,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { HeartOrb, LogoHearts } from '../components/Brand';
import { useToast } from '../components/Overlay';
import { QRCode } from '../components/QRCode';
import { RichText } from '../components/RichText';
import { me, partner } from '../data/mock';
import { useRouter } from '../nav/router';
import { useApp } from '../state/app';

function LinkedView() {
  const { back, navigate } = useRouter();
  const { pairing, resetPairing } = useApp();
  const { toast } = useToast();
  const since = pairing.matchedAt
    ? Math.max(1, Math.round((Date.now() - pairing.matchedAt) / 86400000))
    : 12;

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 4 }}>
          <button type="button" className="icon-btn ghost press" onClick={back} aria-label="Back">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Pairing &amp; connection
          </span>
        </div>

        <div className="screen-scroll">
          <div style={{ padding: '6px 18px 26px' }}>
            <div className="pair-card" style={{ textAlign: 'center', paddingTop: 22 }}>
              <div className="avatar-pair">
                <Avatar src={me.photo} size={66} alt="You" />
                <span className="avatar-pair__link">
                  <Heart size={15} fill="currentColor" strokeWidth={0} />
                </span>
                <Avatar src={partner.photo} size={66} alt={partner.fullName} online />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 16,
                  height: 26,
                  padding: '0 11px',
                  borderRadius: 999,
                  background: 'var(--primary-soft)',
                  color: 'var(--primary-deep)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  width: 'fit-content',
                  marginInline: 'auto',
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.6} /> Matched
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.4px', marginTop: 10 }}>
                You &amp; {pairing.linkedName ?? 'ruhi'}
              </div>
              <div className="t-body" style={{ fontSize: 11.5, marginTop: 4 }}>
                {`Connected ${since} days ago · locked to two people`}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block press"
                style={{ marginTop: 18 }}
                onClick={() => navigate({ name: 'conversation' })}
              >
                <MessageSquare size={15} strokeWidth={2.4} /> Open our chat
              </button>
            </div>

            <div className="settings-group" style={{ marginTop: 16 }}>
              <div className="service-row">
                <span className="service-row__icon">
                  <KeyRound size={15} strokeWidth={2.2} />
                </span>
                <span className="service-row__meta">
                  <span className="service-row__name" style={{ display: 'block' }}>
                    Your pairing code
                  </span>
                  <span className="service-row__detail" style={{ display: 'block' }}>
                    Share only with your person
                  </span>
                </span>
                <span className="service-row__ping" style={{ color: 'var(--primary-deep)', letterSpacing: 1.5 }}>
                  {pairing.code}
                </span>
              </div>
              <div className="service-row">
                <span className="service-row__icon">
                  <QrCode size={15} strokeWidth={2.2} />
                </span>
                <span className="service-row__meta">
                  <span className="service-row__name" style={{ display: 'block' }}>
                    QR pairing
                  </span>
                  <span className="service-row__detail" style={{ display: 'block' }}>
                    Show or scan a code in person
                  </span>
                </span>
              </div>
              <div className="service-row">
                <span className="service-row__icon">
                  <ShieldCheck size={15} strokeWidth={2.2} />
                </span>
                <span className="service-row__meta">
                  <span className="service-row__name" style={{ display: 'block' }}>
                    End-to-end private
                  </span>
                  <span className="service-row__detail" style={{ display: 'block' }}>
                    Only the two of you can read this space
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger-soft btn-block press"
              style={{ marginTop: 16 }}
              onClick={() => {
                resetPairing();
                toast('Connection removed — you are unpaired');
              }}
            >
              <Unlink size={15} strokeWidth={2.4} /> Unlink &amp; pair again
            </button>
            <div className="pair-hint">
              Unlinking removes the shared space on this device. Your memories stay safe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchedView() {
  const { back, switchTab, navigate } = useRouter();
  const { pairing, resetPairing, dismissCelebration } = useApp();
  const { toast } = useToast();

  return (
    <div className="matched">
      <div className="matched__glow" />
      <div className="matched__hearts" aria-hidden="true">
        {[
          { left: '12%', size: 16, delay: 0, dur: 7 },
          { left: '30%', size: 10, delay: 2.2, dur: 9 },
          { left: '68%', size: 13, delay: 1.1, dur: 8 },
          { left: '84%', size: 9, delay: 3.6, dur: 10 },
          { left: '48%', size: 8, delay: 5, dur: 9.5 },
        ].map((h, i) => (
          <span key={i} style={{ left: h.left, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s` }}>
            <Heart size={h.size} fill="currentColor" strokeWidth={0} />
          </span>
        ))}
      </div>

      <motion.div
        className="matched__badge"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Sparkles size={11} strokeWidth={2.6} /> Love connection matched
      </motion.div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 15, delay: 0.2 }}
        style={{ marginTop: 22, position: 'relative', zIndex: 2 }}
      >
        <span className="avatar-pair">
          <Avatar src={me.photo} size={76} alt="You" />
          <span className="avatar-pair__link">
            <Heart size={16} fill="currentColor" strokeWidth={0} />
          </span>
          <Avatar src={partner.photo} size={76} alt={partner.fullName} online />
        </span>
      </motion.div>

      <motion.h1
        className="matched__title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        You &amp; {pairing.linkedName ?? 'ruhi'}
        <br />
        are connected
      </motion.h1>
      <motion.p
        className="matched__sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        Your private space is ready. Chat, call and keep every little memory — just the two of you.
      </motion.p>

      <motion.div
        className="matched__actions"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <button
          type="button"
          className="btn btn-primary btn-block press"
          onClick={() => {
            dismissCelebration();
            back();
            navigate({ name: 'conversation' });
          }}
        >
          Start chatting <ArrowRight size={17} strokeWidth={2.6} />
        </button>
        <button
          type="button"
          className="btn btn-soft btn-block press"
          onClick={() => {
            dismissCelebration();
            back();
            switchTab('home');
          }}
        >
          Go to home
        </button>
        <button
          type="button"
          className="link-btn"
          style={{ alignSelf: 'center', marginTop: 4 }}
          onClick={() => {
            resetPairing();
            toast('Connection removed');
          }}
        >
          <Unlink size={12} strokeWidth={2.4} /> Unlink this connection
        </button>
      </motion.div>
    </div>
  );
}

export function Pairing() {
  const { back, navigate } = useRouter();
  const { toast } = useToast();
  const {
    pairing,
    sendRequest,
    cancelRequest,
    acceptIncoming,
    declineIncoming,
    triggerIncoming,
  } = useApp();

  const [tab, setTab] = useState<'code' | 'qr'>('code');
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  if (pairing.phase === 'matched') {
    return pairing.celebrate ? <MatchedView /> : <LinkedView />;
  }

  const chars = code.padEnd(6, ' ').split('').slice(0, 6);

  const onCodeChange = (raw: string) => {
    setCode(raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  const submit = () => {
    if (code.length < 6) {
      toast('Enter the full 6-character code');
      inputRef.current?.focus();
      return;
    }
    sendRequest(code);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(pairing.code);
      toast('Pairing code copied');
    } catch {
      toast(`Your code is ${pairing.code}`);
    }
  };

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 4 }}>
          <button type="button" className="icon-btn ghost press" onClick={back} aria-label="Back">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Pair your person
          </span>
        </div>

        <div className="screen-scroll">
          <div style={{ padding: '4px 18px 26px' }}>
            <div className="row" style={{ gap: 11, marginBottom: 16, paddingInline: 2 }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--primary-ghost)',
                  color: 'var(--primary)',
                  flex: '0 0 auto',
                }}
              >
                <Link2 size={20} strokeWidth={2.2} />
              </span>
              <span className="t-body" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                One code, one person. Once your partner accepts, your space is locked to the two of
                you.
              </span>
            </div>

            <div className="pair-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'code'}
                className={`pair-tab ${tab === 'code' ? 'active' : ''}`}
                onClick={() => setTab('code')}
              >
                <KeyRound size={13} strokeWidth={2.4} /> Pairing code
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'qr'}
                className={`pair-tab ${tab === 'qr' ? 'active' : ''}`}
                onClick={() => setTab('qr')}
              >
                <QrCode size={13} strokeWidth={2.4} /> QR code
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {tab === 'code' ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  {pairing.phase === 'outgoing' ? (
                    <div className="wait-card">
                      <div className="spinner-ring" />
                      <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.3px' }}>
                        Waiting for {partner.name}…
                      </div>
                      <div className="t-body" style={{ fontSize: 11.5, marginTop: 6 }}>
                        Request sent to <b style={{ letterSpacing: 1.6 }}>{pairing.targetCode}</b>.
                        She has 10 minutes to accept.
                      </div>
                      <div className="avatar-pair" style={{ marginTop: 16 }}>
                        <Avatar src={me.photo} size={54} alt="You" />
                        <span className="avatar-pair__link">
                          <Send size={14} strokeWidth={2.6} />
                        </span>
                        <Avatar src={partner.photo} size={54} alt={partner.fullName} />
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-block press"
                        style={{ marginTop: 18 }}
                        onClick={() => {
                          cancelRequest();
                          toast('Pairing request cancelled');
                        }}
                      >
                        Cancel request
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="pair-card">
                        <div className="section-label" style={{ marginBottom: 12 }}>
                          <KeyRound size={14} strokeWidth={2.4} /> Enter partner&apos;s code
                        </div>
                        <div className="code-wrap">
                          <div className="code-boxes" onClick={() => inputRef.current?.focus()}>
                            {chars.map((ch, i) => (
                              <span
                                key={i}
                                className={`code-box ${ch.trim() ? 'filled' : ''} ${
                                  i === Math.min(code.length, 5) ? 'active' : ''
                                }`}
                              >
                                {ch.trim() || ''}
                              </span>
                            ))}
                          </div>
                          <input
                            ref={inputRef}
                            className="code-input"
                            value={code}
                            onChange={(e) => onCodeChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                            inputMode="text"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            aria-label="Partner pairing code"
                          />
                        </div>
                        <div className="pair-hint">
                          Codes are 6 characters — letters and numbers.
                          <br />
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => {
                              onCodeChange('LOVE24');
                              inputRef.current?.focus();
                            }}
                          >
                            Try demo code LOVE24
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-block press"
                          style={{ marginTop: 14 }}
                          disabled={code.length < 6}
                          onClick={submit}
                        >
                          <Send size={15} strokeWidth={2.6} />
                          Send pairing request
                        </button>
                      </div>

                      {pairing.phase === 'incoming' ? (
                        <div className="request-card">
                          <div className="avatar-pair">
                            <Avatar src={partner.photo} size={54} alt={partner.fullName} online />
                            <span className="avatar-pair__link">
                              <Heart size={14} fill="currentColor" strokeWidth={0} />
                            </span>
                            <Avatar src={me.photo} size={54} alt="You" />
                          </div>
                          <div className="request-card__title">{partner.fullName} wants to pair</div>
                          <div className="request-card__sub">
                            Accept to join your private space together. You can unlink any time.
                          </div>
                          <div className="request-card__actions">
                            <button
                              type="button"
                              className="btn btn-primary press"
                              onClick={acceptIncoming}
                            >
                              <Check size={15} strokeWidth={2.8} /> Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-soft press"
                              onClick={() => {
                                declineIncoming();
                                toast('Request declined');
                              }}
                            >
                              <X size={15} strokeWidth={2.8} /> Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="link-btn"
                          style={{ margin: '14px auto 0', justifyContent: 'center', width: '100%' }}
                          onClick={() => {
                            triggerIncoming();
                            toast('Incoming pairing request');
                          }}
                        >
                          <Sparkles size={12} strokeWidth={2.4} /> Preview an incoming request
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="pair-card" style={{ textAlign: 'center' }}>
                    <div className="qr-frame">
                      <QRCode value={`duora://pair/${pairing.code}`} size={182} />
                    </div>
                    <div className="pair-code-badge" style={{ marginTop: 14 }}>
                      {pairing.code}
                    </div>
                    <div className="pair-hint">
                      Show this to {partner.name}, or scan hers. The code rotates for safety.
                    </div>
                    <div className="pair-actions">
                      <button
                        type="button"
                        className="btn btn-soft press"
                        onClick={copyCode}
                      >
                        <Copy size={14} strokeWidth={2.4} /> Copy
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft press"
                        onClick={() => toast('Refreshed — new code generated')}
                      >
                        <RefreshCw size={14} strokeWidth={2.4} /> Refresh
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-block press"
                    style={{ marginTop: 14 }}
                    onClick={() => navigate({ name: 'scanner' })}
                  >
                    <ScanLine size={16} strokeWidth={2.6} />
                    Scan partner&apos;s QR
                  </button>

                  <div className="pair-hint" style={{ marginTop: 10 }}>
                    Both on Duora? Add her code instead — it works offline.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* how it works */}
            <div className="settings-group" style={{ marginTop: 22 }}>
              {[
                { icon: KeyRound, text: 'Share your 6-character code or QR' },
                { icon: Send, text: 'Your partner accepts the request' },
                { icon: ShieldCheck, text: 'Your private space is matched' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={text} className="service-row">
                  <span className="service-row__icon">
                    <Icon size={15} strokeWidth={2.2} />
                  </span>
                  <span className="service-row__meta">
                    <span className="service-row__name" style={{ display: 'block' }}>
                      {text}
                    </span>
                  </span>
                  <span className="t-caption">{i + 1}/3</span>
                </div>
              ))}
            </div>

            <div
              className="row"
              style={{ justifyContent: 'center', gap: 6, marginTop: 16, color: 'var(--text-3)' }}
            >
              <LogoHearts size={16} />
              <span className="t-caption" style={{ fontWeight: 600 }}>
                Only two people can ever be in this space
              </span>
              <RichText text="💜" size={10} />
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'center', marginTop: 14, opacity: 0.85 }}
            >
              <HeartOrb size={34} tone="violet" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

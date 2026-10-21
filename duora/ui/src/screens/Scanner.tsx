import { ArrowLeft, Check, Flashlight, KeyRound, ScanLine, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/Overlay';
import { partner } from '../data/mock';
import { useRouter } from '../nav/router';
import { useApp } from '../state/app';

export function Scanner() {
  const { back } = useRouter();
  const { completeScan } = useApp();
  const { toast } = useToast();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    if (scanned) return;
    setScanned(true);
    window.setTimeout(() => {
      completeScan();
      back();
    }, 700);
  };

  return (
    <div className="scan-screen">
      <div className="scan-cam">
        <img src={partner.photo} alt="" aria-hidden="true" />
      </div>
      <div className="scan-veil" />

      <div className="scan-top">
        <button
          type="button"
          className="vc-btn press"
          style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.16)' }}
          onClick={back}
          aria-label="Back"
        >
          <ArrowLeft size={19} strokeWidth={2.4} />
        </button>
        <span className="scan-title">Scan pairing QR</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className={`vc-btn press ${torch ? 'on' : ''}`}
          style={{ width: 40, height: 40 }}
          onClick={() => {
            setTorch((t) => !t);
            toast(torch ? 'Torch off' : 'Torch on');
          }}
          aria-label="Toggle torch"
        >
          <Flashlight size={18} strokeWidth={2.2} />
        </button>
      </div>

      <div className="scan-frame" style={scanned ? { boxShadow: '0 0 0 3px rgba(78,208,166,.9)' } : undefined}>
        <span className="scan-corner tl" />
        <span className="scan-corner tr" />
        <span className="scan-corner bl" />
        <span className="scan-corner br" />
        {!scanned && <span className="scan-laser" />}
        {scanned && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#4ed0a6',
            }}
          >
            <Check size={64} strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="scan-hint">
        {scanned ? 'Found it — pairing your hearts…' : "Point at your partner's Duora QR code"}
      </div>

      <div className="scan-bottom">
        <button type="button" className="scan-btn press" onClick={handleScan} disabled={scanned}>
          <ScanLine size={17} strokeWidth={2.6} />
          {scanned ? 'Pairing…' : 'Simulate successful scan'}
        </button>
        <button
          type="button"
          className="link-btn"
          style={{ color: 'rgba(255,255,255,0.85)' }}
          onClick={back}
        >
          <KeyRound size={12} strokeWidth={2.4} /> Enter code instead
        </button>
        <span className="scan-note">
          <Sparkles size={10} strokeWidth={2.6} style={{ verticalAlign: '-1px', marginRight: 3 }} />
          Camera capture is mocked in this preview
        </span>
      </div>
    </div>
  );
}

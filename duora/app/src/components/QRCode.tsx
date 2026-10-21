import { memo } from 'react';
import { View } from 'react-native';
import QRCodeSvg from 'react-native-qrcode-svg';
import { useDuoraTheme } from '../theme/ThemeProvider';

/**
 * Real, scannable pairing QR code.
 * The payload is `duora://pair?token=…` — the partner's app scans it and the
 * server links both accounts.
 */
export const PairingQRCode = memo(function PairingQRCode({
  value,
  size = 190,
}: {
  value: string;
  size?: number;
}) {
  const { t } = useDuoraTheme();
  if (!value) return null;
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        borderWidth: StyleSheetHairline,
      }}
    >
      <QRCodeSvg
        value={value}
        size={size - 28}
        color={t.text}
        backgroundColor="#ffffff"
        logoSize={0}
      />
    </View>
  );
});

const StyleSheetHairline = 1;

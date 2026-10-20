/**
 * Duora Android config plugin (applied only during prebuild / EAS builds;
 * ignored by Expo Go).
 *
 * Responsibilities:
 *  - Enable native picture-in-picture on the main Activity.
 *  - Keep the Activity alive across rotation/PiP config changes so the call
 *    screen is not recreated and the PeerConnection is not torn down.
 *  - Declare the foreground service used by the native calling stack.
 */
import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

const withDuoraAndroid: ConfigPlugin = (config) =>
  withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return modConfig;

    const mainActivity = application.activity?.find(
      (activity) => activity.$?.['android:name'] === '.MainActivity',
    );
    if (mainActivity) {
      mainActivity.$ = {
        ...mainActivity.$,
        'android:resizeableActivity': 'true',
        'android:supportsPictureInPicture': 'true',
      };
      const existing = mainActivity.$['android:configChanges'] ?? '';
      const required = ['screenSize', 'smallestScreenSize', 'screenLayout', 'orientation', 'keyboardHidden'];
      mainActivity.$['android:configChanges'] = Array.from(
        new Set([...existing.split('|').filter(Boolean), ...required]),
      ).join('|');
    }

    // Foreground service declaration. Runtime permissions live in app.json.
    const services = application.service ?? [];
    const alreadyDeclared = services.some(
      (service) => service.$?.['android:name'] === 'com.duora.app.calling.CallForegroundService',
    );
    if (!alreadyDeclared) {
      services.push({
        $: {
          'android:name': 'com.duora.app.calling.CallForegroundService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'microphone|camera|connectedDevice',
        },
      });
      application.service = services;
    }

    return modConfig;
  });

export default withDuoraAndroid;

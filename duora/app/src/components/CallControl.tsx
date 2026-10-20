import { StyleSheet, View } from 'react-native';
import { CallActionButton } from './CallActionButton';
import { useCallStore } from '../state/call.store';
import { callCoordinator } from '../features/calling/CallCoordinator';

interface CallControlProps {
  video: boolean;
}

/** Mute / speaker / camera / flip controls, bound directly to the coordinator. */
export function CallControl({ video }: CallControlProps) {
  const { muted, speakerOn, cameraOn, frontCamera } = useCallStore();

  return (
    <View style={styles.row}>
      <CallActionButton
        icon={muted ? 'mic-off' : 'mic'}
        label={muted ? 'Unmute' : 'Mute'}
        active={muted}
        onPress={() => callCoordinator.toggleMute()}
      />
      <CallActionButton
        icon={speakerOn ? 'volume-high' : 'volume-medium'}
        label="Speaker"
        active={!speakerOn}
        onPress={() => callCoordinator.toggleSpeaker()}
      />
      {video ? (
        <>
          <CallActionButton
            icon={cameraOn ? 'videocam' : 'videocam-off'}
            label={cameraOn ? 'Camera off' : 'Camera on'}
            active={!cameraOn}
            onPress={() => callCoordinator.toggleCamera()}
          />
          <CallActionButton
            icon={frontCamera ? 'camera-reverse' : 'camera-reverse-outline'}
            label="Flip"
            onPress={() => void callCoordinator.flipCamera()}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 16 },
});

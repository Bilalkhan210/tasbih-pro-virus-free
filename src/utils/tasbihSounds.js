import { Image, Platform } from 'react-native';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

// Bundled in src/assets/sounds/ (also copied to android/app/src/main/res/raw/).
const TAP_FORWARD_ASSET = require('../assets/sounds/tap_forward.mp3');
const TAP_BACKWARD_ASSET = require('../assets/sounds/tap_backward.mp3');
const ROUND_COMPLETE_ASSET = require('../assets/sounds/round_complete.mp3');

let forwardSound = null;
let backwardSound = null;
let roundCompleteSound = null;
let soundEnabled = true;

const loadSound = (asset, androidRawName, onError) => {
  if (Platform.OS === 'android') {
    return new Sound(`${androidRawName}.mp3`, Sound.MAIN_BUNDLE, onError);
  }

  const resolved = Image.resolveAssetSource(asset);
  if (!resolved?.uri) {
    onError?.('Could not resolve sound asset URI');
    return null;
  }

  return new Sound(resolved.uri, '', onError);
};

const playLoadedSound = (sound, ignoreCountSoundSetting = false) => {
  if (!sound || (!ignoreCountSoundSetting && !soundEnabled)) {
    return;
  }

  const tryPlay = () => {
    sound.stop(() => {
      sound.play();
    });
  };

  if (sound.isLoaded()) {
    tryPlay();
    return;
  }

  setTimeout(() => {
    if (soundEnabled && sound.isLoaded()) {
      tryPlay();
    }
  }, 80);
};

export const setTasbihSoundEnabled = (enabled) => {
  soundEnabled = enabled;
};

export const initTasbihSounds = () => {
  if (!forwardSound) {
    forwardSound = loadSound(TAP_FORWARD_ASSET, 'tap_forward', (error) => {
      if (error) {
        console.warn('Failed to load assets/sounds/tap_forward.mp3', error);
      }
    });
  }

  if (!backwardSound) {
    backwardSound = loadSound(TAP_BACKWARD_ASSET, 'tap_backward', (error) => {
      if (error) {
        console.warn('Failed to load assets/sounds/tap_backward.mp3', error);
      }
    });
  }

  if (!roundCompleteSound) {
    roundCompleteSound = loadSound(
      ROUND_COMPLETE_ASSET,
      'round_complete',
      (error) => {
        if (error) {
          console.warn('Failed to load assets/sounds/round_complete.mp3', error);
        }
      },
    );
  }

  if (Platform.OS === 'ios') {
    Sound.enableInSilenceMode(true);
  }
};

export const playTapForward = () => {
  if (!forwardSound) {
    initTasbihSounds();
  }
  playLoadedSound(forwardSound);
};

export const playTapBackward = () => {
  if (!backwardSound) {
    initTasbihSounds();
  }
  playLoadedSound(backwardSound);
};

export const playRoundComplete = () => {
  if (!roundCompleteSound) {
    initTasbihSounds();
  }
  playLoadedSound(roundCompleteSound, true);
};

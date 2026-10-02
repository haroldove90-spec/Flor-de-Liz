/**
 * Notification Audio Player
 * Audio file: universfield-new-notification-057-494255.mp3
 * Hosted on Supabase Storage
 */

export const NOTIFICATION_SOUND_URL =
  'https://ptzdzlafekxtakbfnyur.supabase.co/storage/v1/object/public/notificacion/universfield-new-notification-057-494255.mp3';

let audioElement: HTMLAudioElement | null = null;
let isAudioInitialized = false;

/**
 * Preloads and initializes the notification audio element on first user interaction.
 */
export const initNotificationAudio = () => {
  if (typeof window === 'undefined' || isAudioInitialized) return;

  try {
    audioElement = new Audio(NOTIFICATION_SOUND_URL);
    audioElement.preload = 'auto';
    audioElement.volume = 0.85;

    // Attempt a silent play to unlock autoplay policy if possible
    const unlockPromise = audioElement.play();
    if (unlockPromise !== undefined) {
      unlockPromise
        .then(() => {
          audioElement?.pause();
          if (audioElement) audioElement.currentTime = 0;
          isAudioInitialized = true;
        })
        .catch(() => {
          // Autoplay was prevented; will retry upon user click
          isAudioInitialized = false;
        });
    }
  } catch (err) {
    console.warn('initNotificationAudio warning:', err);
  }
};

/**
 * Plays the official notification sound chime.
 */
export const playNotificationSound = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    if (!audioElement) {
      audioElement = new Audio(NOTIFICATION_SOUND_URL);
      audioElement.preload = 'auto';
      audioElement.volume = 0.85;
    }

    audioElement.currentTime = 0;
    const playPromise = audioElement.play();

    if (playPromise !== undefined) {
      await playPromise;
      return true;
    }
    return true;
  } catch (err) {
    // Autoplay restrictions or network fallback
    console.warn('playNotificationSound info: Browser autoplay policy requires user interaction first.', err);
    return false;
  }
};

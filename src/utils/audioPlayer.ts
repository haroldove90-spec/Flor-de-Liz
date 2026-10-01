/**
 * Audio manager for notification alerts
 * Sound URL: https://ylzgfsvcibqsztarglja.supabase.co/storage/v1/object/public/Notificaciones/WhatsApp%20Ptt%202026-09-29%20at%2020.31.23.ogg
 */

export const NOTIFICATION_SOUND_URL =
  'https://ylzgfsvcibqsztarglja.supabase.co/storage/v1/object/public/Notificaciones/WhatsApp%20Ptt%202026-09-29%20at%2020.31.23.ogg';

let audioInstance: HTMLAudioElement | null = null;
let isAudioInitialized = false;

/**
 * Prepares the audio instance to minimize playback latency and unlock browser autoplay restrictions
 */
export const initNotificationAudio = () => {
  if (typeof window === 'undefined') return;
  if (!audioInstance) {
    try {
      audioInstance = new Audio(NOTIFICATION_SOUND_URL);
      audioInstance.preload = 'auto';
      audioInstance.volume = 0.9;
      isAudioInitialized = true;
    } catch (e) {
      console.warn('Could not initialize notification audio:', e);
    }
  }
};

/**
 * Plays the WhatsApp notification sound
 */
export const playNotificationSound = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    if (!audioInstance) {
      initNotificationAudio();
    }

    if (audioInstance) {
      audioInstance.currentTime = 0;
      const playPromise = audioInstance.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      return true;
    }
  } catch (error) {
    // Fallback: create fresh audio element on-demand
    try {
      const fallbackAudio = new Audio(NOTIFICATION_SOUND_URL);
      fallbackAudio.volume = 0.9;
      await fallbackAudio.play();
      audioInstance = fallbackAudio;
      return true;
    } catch (err) {
      console.warn('Notification audio playback blocked by browser or failed:', err);
    }
  }
  return false;
};

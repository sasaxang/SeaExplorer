// Sound utilities for Seaquest game
import { Howl, HowlOptions } from 'howler';

// Sound file URLs
const SOUND_URLS = {
  explosion: '/sounds/explosion.mp3',
  explosionShark: '/sounds/explosion_shark.mp3',
  bubble: '/sounds/bubble.mp3',
  hit: '/sounds/hit.mp3',
  warning: '/sounds/warning.mp3',
  hello: '/sounds/hello.mp3',
  backgroundMusic: '/backgroundmusic.mp3', // Now in the public folder
  startMusic: '/start_music.mp3', // Start screen music
};

// Collection of loaded sounds
const sounds: { [key: string]: Howl } = {};

// Initialize sounds
export function initSounds() {
  // Cleanup existing sounds first to prevent duplicates/memory leaks
  Object.keys(sounds).forEach(key => {
    if (sounds[key]) {
      sounds[key].stop();
      sounds[key].unload();
    }
  });

  // Create Howl instances for each sound
  sounds.explosion = new Howl({
    src: [SOUND_URLS.explosion],
    volume: 0.5,
    pool: 5, // Allow multiple simultaneous playback
  });

  sounds.explosionShark = new Howl({
    src: [SOUND_URLS.explosionShark],
    volume: 0.6,
    pool: 3, // Less frequent than regular explosions
  });

  sounds.bubble = new Howl({
    src: [SOUND_URLS.bubble],
    volume: 0.3,
    pool: 3,
  });

  sounds.hit = new Howl({
    src: [SOUND_URLS.hit],
    volume: 0.4,
    pool: 5,
  });

  sounds.warning = new Howl({
    src: [SOUND_URLS.warning],
    volume: 0.7,
    pool: 1, // Only one warning sound at a time
  });

  sounds.hello = new Howl({
    src: [SOUND_URLS.hello],
    volume: 0.5,
    pool: 1, // Only one hello sound at a time
  });

  sounds.backgroundMusic = new Howl({
    src: [SOUND_URLS.backgroundMusic],
    volume: 0.3,
    loop: true, // Make the background music loop continuously
    autoplay: false, // We'll manually start it when the game loads
  });

  sounds.startMusic = new Howl({
    src: [SOUND_URLS.startMusic],
    volume: 0.4,
    loop: true,
    autoplay: false,
  });
}

// Play a sound
export function playSound(name: keyof typeof SOUND_URLS, options: HowlOptions = { src: [] }) {
  if (sounds[name]) {
    return sounds[name].play();
  }
  return null;
}

// Stop a sound
export function stopSound(name: keyof typeof SOUND_URLS) {
  if (sounds[name]) {
    sounds[name].stop();
  }
}

// Track muted state separately since Howler's API is not straightforward for checking it
let mutedState = false;

// Mute/unmute all sounds
export function setMuted(muted: boolean) {
  mutedState = muted;
  Howler.mute(muted);
}

// Are sounds muted?
export function isMuted(): boolean {
  return mutedState;
}

// Play background music
export function playBackgroundMusic() {
  console.log("playBackgroundMusic called");
  if (sounds.backgroundMusic) {
    // Stop start music if playing
    if (sounds.startMusic) {
      console.log("Stopping start music, current state:", sounds.startMusic.state());
      sounds.startMusic.stop();
      console.log("Start music stopped, new state:", sounds.startMusic.state());
    }

    // Stop first in case it's already playing
    sounds.backgroundMusic.stop();
    // Play and loop continuously
    const playId = sounds.backgroundMusic.play();
    console.log("Background music play ID:", playId, "State:", sounds.backgroundMusic.state());
  } else {
    console.warn("backgroundMusic sound not initialized");
  }
}

// Play start screen music
export function playStartMusic() {
  console.log("playStartMusic called");
  if (sounds.startMusic) {
    // Stop background music if playing
    if (sounds.backgroundMusic) {
      console.log("Stopping background music, current state:", sounds.backgroundMusic.state());
      sounds.backgroundMusic.stop();
      console.log("Background music stopped, new state:", sounds.backgroundMusic.state());
    }

    // Stop first in case it's already playing
    sounds.startMusic.stop();
    // Play and loop continuously
    const playId = sounds.startMusic.play();
    console.log("Start music play ID:", playId, "State:", sounds.startMusic.state());
  } else {
    console.warn("startMusic sound not initialized");
  }
}

// Explicitly resume AudioContext (helper for autoplay policies)
export function resumeAudioContext() {
  console.log("Attempting to resume AudioContext, current state:", Howler.ctx?.state);
  if (Howler.ctx) {
    if (Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        console.log("AudioContext resumed successfully, new state:", Howler.ctx?.state);
      }).catch((err) => {
        console.error("Failed to resume AudioContext:", err);
      });
    } else {
      console.log("AudioContext already in state:", Howler.ctx.state);
    }
  } else {
    console.warn("Howler.ctx is not available yet");
  }
}
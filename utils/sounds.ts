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
};

// Collection of loaded sounds
const sounds: { [key: string]: Howl } = {};

// Initialize sounds
export function initSounds() {
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
  if (sounds.backgroundMusic) {
    // Stop first in case it's already playing
    sounds.backgroundMusic.stop();
    // Play and loop continuously
    sounds.backgroundMusic.play();
  }
}
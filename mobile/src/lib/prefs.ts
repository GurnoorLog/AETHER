import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_KEY = 'half-turn:settings:voice';
export const DEFAULT_VOICE = 'aura-asteria-en';

export const AURA_VOICES = [
  'aura-asteria-en',
  'aura-luna-en',
  'aura-stella-en',
  'aura-athena-en',
  'aura-hera-en',
  'aura-orion-en',
  'aura-arcas-en',
  'aura-perseus-en',
  'aura-angus-en',
  'aura-orpheus-en',
  'aura-helios-en',
  'aura-zeus-en',
] as const;

export function getVoice(): Promise<string> {
  return AsyncStorage.getItem(VOICE_KEY).then((v) => v || DEFAULT_VOICE);
}

export function setVoice(voice: string): Promise<void> {
  return AsyncStorage.setItem(VOICE_KEY, voice).catch(() => {});
}

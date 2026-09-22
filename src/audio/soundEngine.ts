/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioTrack, SynthStyle } from '../types';

// Musical note frequencies (Hz) for procedural acoustic and orchestral composition
const NOTES: Record<string, number> = {
  C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.5, G2: 98.0, Ab2: 103.83, A2: 110.0, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.0, G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.0, Bb5: 932.33, B5: 987.77,
  C6: 1046.5,
};

// Authentic Cultural & Orchestral Modal Scales
const SCALES: Record<string, string[]> = {
  minor_Am: ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5'],
  sakura_InSen: ['D3', 'Eb3', 'G3', 'A3', 'C4', 'D4', 'Eb4', 'G4', 'A4', 'C5', 'D5'],
  oriental_Pentatonic: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
  flamenco_Phrygian: ['E2', 'F2', 'G2', 'Ab2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'Ab3', 'B3', 'E4'],
  raga_Bhairav: ['C3', 'Eb3', 'E3', 'F3', 'G3', 'Ab3', 'B3', 'C4', 'Eb4', 'E4', 'G4', 'C5'],
  afrobeat_Modal: ['G2', 'A2', 'C3', 'D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4'],
  tango_Dramatic: ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'Ab3', 'A3', 'C4', 'D4', 'E4', 'F4', 'A4'],
  andina_Inca: ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5'],
  samba_Tropical: ['F2', 'G2', 'A2', 'Bb2', 'C3', 'D3', 'E3', 'F3', 'A3', 'C4', 'D4', 'F4'],
  cumbia_Sonidera: ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4'],
  pacific_Island: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5'],
  celtic_Jig: ['D3', 'E3', 'Fs3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'Fs4', 'G4', 'A4', 'B4', 'D5'],
  dub_Reggae: ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'G4', 'A4'],
  kpop_Pentatonic: ['Db3', 'Eb3', 'F3', 'Ab3', 'Bb3', 'Db4', 'Eb4', 'F4', 'Ab4', 'Bb4', 'Db5'],
  mariachi_Brass: ['G3', 'B3', 'D4', 'G4', 'B4', 'D5', 'E5', 'D5', 'B4', 'G4'],
  french_House: ['F3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5'],
  italo_Disco: ['D3', 'F3', 'A3', 'C4', 'D4', 'F4', 'A4', 'C5'],
  nordic_EDM: ['E3', 'G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'B4'],
  techno_Acid: ['C3', 'Eb3', 'F3', 'G3', 'Bb3', 'C4', 'Eb4', 'G4'],
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlayingMusic: boolean = false;
  private currentTrack: AudioTrack | null = null;
  private isPlayingMenuTheme: boolean = false;
  private menuThemeTimerId: number | null = null;
  private menuThemeStep: number = 0;
  private menuThemeNextStepTime: number = 0;

  // Sequencer timing
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private timerId: number | null = null;
  private tempo: number = 130;
  private stepDuration: number = 0.125; // 16th notes
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // seconds
  private beatCallback?: (beat: number, isQuarter: boolean, isBar: boolean) => void;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMusicVolume(volume: number) {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number) {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public setBeatCallback(cb: (beat: number, isQuarter: boolean, isBar: boolean) => void) {
    this.beatCallback = cb;
  }

  // --- SOUND EFFECTS (SFX) ---

  public playJumpSound(pitchMod: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(520 * pitchMod, t + 0.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.1);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playOrbSound(type: 'yellow' | 'pink' | 'cyan') {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const baseFreq = type === 'yellow' ? 659.25 : type === 'pink' ? 523.25 : 880.0;

    [baseFreq, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.16);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  public playPadSound(type: 'yellow' | 'cyan') {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(type === 'yellow' ? 880 : 1050, t + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.18);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  public playGravityFlipSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.linearRampToValueAtTime(290, t + 0.08);
    osc.frequency.linearRampToValueAtTime(660, t + 0.2);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playPortalSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.14);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playCoinSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    [1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.35, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.18);
    });
  }

  public playCheckpointSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.28, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.2);
    });
  }

  public playBuySuccessSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.28);
    });
  }

  public playDiamondSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    [880.0, 1174.66, 1567.98, 2093.0].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.28, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.32);
    });
  }

  public playVehicleTransformSound(vehicleName: string) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'triangle';

    if (vehicleName === 'SHIP') {
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.15);
    } else if (vehicleName === 'WAVE') {
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);
    } else if (vehicleName === 'BALL') {
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.14);
    } else if (vehicleName === 'UFO') {
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.1);
    } else if (vehicleName === 'ROBOT') {
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.18);
    } else if (vehicleName === 'SPIDER') {
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(980, t + 0.1);
    } else {
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playSpiderTeleportSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playUFOThrustSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.07);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playTycoonRestoreSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Orchestral harp and chime arpeggio
    [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.28, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.45);
    });
  }

  public playDeathSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Heavy bass boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.32);

    oscGain.gain.setValueAtTime(0.55, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);

    osc.start(t);
    osc.stop(t + 0.38);

    // Noise shatter burst
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1500, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(250, t + 0.22);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain!);

    noise.start(t);
    noise.stop(t + 0.27);
  }

  public playVictorySound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.35, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.5);
    });
  }

  // --- PROCEDURAL MUSIC SEQUENCER ---

  public startMenuBattleMusic() {
    this.init();
    this.resume();
    if (this.isPlayingMenuTheme) return;
    this.stopMusic(); // Ensure no level music is running
    this.stopMenuBattleMusic();

    this.isPlayingMenuTheme = true;
    this.menuThemeStep = 0;
    this.menuThemeNextStepTime = this.ctx!.currentTime + 0.05;

    const tempo = 112; // Epic noble medieval battle march tempo
    const stepDuration = 60 / tempo / 4; // 16th notes

    const menuScheduler = () => {
      if (!this.isPlayingMenuTheme || !this.ctx) return;

      while (this.menuThemeNextStepTime < this.ctx.currentTime + 0.1) {
        this.scheduleMedievalBattleStep(this.menuThemeStep, this.menuThemeNextStepTime, stepDuration);
        this.menuThemeNextStepTime += stepDuration;
        this.menuThemeStep++;
      }

      this.menuThemeTimerId = window.setTimeout(menuScheduler, 25.0);
    };

    menuScheduler();
  }

  public stopMenuBattleMusic() {
    this.isPlayingMenuTheme = false;
    if (this.menuThemeTimerId !== null) {
      window.clearTimeout(this.menuThemeTimerId);
      this.menuThemeTimerId = null;
    }
  }

  public isMenuBattleMusicActive(): boolean {
    return this.isPlayingMenuTheme;
  }

  public toggleMenuBattleMusic(): boolean {
    if (this.isPlayingMenuTheme) {
      this.stopMenuBattleMusic();
      return false;
    } else {
      this.startMenuBattleMusic();
      return true;
    }
  }

  private scheduleMedievalBattleStep(step: number, time: number, stepDuration: number) {
    if (!this.ctx || this.isMuted) return;

    const stepInBar = step % 16;
    const bar = Math.floor(step / 16);

    // 1. TIMPANI / WAR DRUM CADENCE (Marching on 1, 5, 9, 13 with syncopation)
    if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 12) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(stepInBar === 0 ? 85 : 72, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.22);
      gain.gain.setValueAtTime(stepInBar === 0 ? 0.65 : 0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.26);
    }

    // 2. MARCHING MILITARY SNARE ROLLS (Triplet and accent cadence)
    if (stepInBar === 4 || stepInBar === 10 || stepInBar === 12 || stepInBar === 14 || stepInBar === 15) {
      const bufferSize = this.ctx.sampleRate * 0.06;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(stepInBar === 12 ? 0.32 : 0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      noise.start(time);
      noise.stop(time + 0.08);
    }

    // 3. FRENCH HORNS & TRUMPETS BATTLE FANFARE (Heroic Dorian motif in D minor / D Dorian)
    // Melody: D3 -> F3 -> G3 -> A3 -> D4 -> C4 -> A3 -> G3
    const fanfareNotes: Record<number, string> = {
      0: 'D3',
      4: 'F3',
      8: 'G3',
      12: 'A3',
      16: 'D4',
      20: 'C4',
      24: 'A3',
      28: 'G3',
      32: 'F3',
      36: 'D3',
      40: 'C3',
      44: 'D3',
      48: 'A3',
      52: 'G3',
      56: 'F3',
      60: 'D3',
    };

    const globalStep = step % 64;
    if (fanfareNotes[globalStep]) {
      const note = fanfareNotes[globalStep];
      const freq = NOTES[note] || 220;

      // Horn 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const filter1 = this.ctx.createBiquadFilter();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);

      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(1400, time);
      filter1.frequency.linearRampToValueAtTime(800, time + stepDuration * 3.5);

      gain1.gain.setValueAtTime(0.01, time);
      gain1.gain.linearRampToValueAtTime(0.28, time + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3.8);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.musicGain!);
      osc1.start(time);
      osc1.stop(time + stepDuration * 4);

      // Horn 2 (Harmonic fifth)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.5, time);
      gain2.gain.setValueAtTime(0.01, time);
      gain2.gain.linearRampToValueAtTime(0.12, time + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3.8);
      osc2.connect(gain2);
      gain2.connect(this.musicGain!);
      osc2.start(time);
      osc2.stop(time + stepDuration * 4);
    }

    // 4. MEDIEVAL LUTE / HARP MODAL ARPEGGIOS (Every 16th note on offbeats)
    if (stepInBar % 2 === 1) {
      const harpScale = ['D3', 'F3', 'A3', 'C4', 'D4', 'F4', 'A4', 'C5'];
      const noteIndex = (step * 3) % harpScale.length;
      const note = harpScale[noteIndex];
      const freq = NOTES[note] || 440;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.19);
    }

    // 5. LOW CELLO DRONE (Root D2 / A2 sustained harmony)
    if (stepInBar === 0) {
      const droneNote = (bar % 4 === 2) ? 'C2' : (bar % 4 === 3) ? 'A2' : 'D2';
      const droneFreq = NOTES[droneNote] || 73.42;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(droneFreq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.22, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 15.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + stepDuration * 16);
    }
  }

  public startMusic(track: AudioTrack, startFromStep: number = 0) {
    this.init();
    this.resume();
    this.stopMenuBattleMusic(); // Stop menu music when entering gameplay
    this.stopMusic();

    this.currentTrack = track;
    this.tempo = track.bpm;
    this.stepDuration = 60 / this.tempo / 4; // 16th notes
    this.currentStep = startFromStep;
    this.nextStepTime = this.ctx!.currentTime + 0.05;
    this.isPlayingMusic = true;

    this.schedulerLoop();
  }

  public updateBPM(bpm: number) {
    this.tempo = bpm;
    this.stepDuration = 60 / this.tempo / 4;
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private schedulerLoop = () => {
    if (!this.isPlayingMusic || !this.ctx) return;

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.stepDuration;
      this.currentStep++;
    }

    this.timerId = window.setTimeout(this.schedulerLoop, this.lookahead);
  };

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.currentTrack) return;

    const stepInBar = step % 16;
    const bar = Math.floor(step / 16);
    const isQuarter = stepInBar % 4 === 0;
    const isBar = stepInBar === 0;

    // Trigger UI beat pulses
    if (this.beatCallback && isQuarter) {
      const beatNumber = Math.floor(step / 4);
      setTimeout(() => {
        if (this.isPlayingMusic) {
          this.beatCallback?.(beatNumber, isQuarter, isBar);
        }
      }, Math.max(0, (time - this.ctx!.currentTime) * 1000));
    }

    const trackStyle = this.currentTrack.synthStyle || 'synthwave';
    const isDropSection = (bar >= 4 && bar < 12) || (bar >= 16 && bar < 28) || bar % 8 >= 4;

    // 1. ACOUSTIC DRUMS & CULTURAL PERCUSSION
    this.scheduleDrums(stepInBar, time, isDropSection, trackStyle);

    // 2. ACOUSTIC UPRIGHT CONTRABASS & CELLO BASSLINE
    this.scheduleBass(stepInBar, bar, time, isDropSection, trackStyle);

    // 3. CULTURAL ACOUSTIC & ORCHESTRAL MELODY (Bandoneón, Spanish Guitar, Shakuhachi, Panflute, Brass, Accordion)
    this.scheduleLead(stepInBar, bar, time, isDropSection, trackStyle);

    // 4. LUSH CHAMBER STRING SECTION HARMONIES
    if (isBar) {
      this.schedulePads(bar, time, trackStyle);
    }
  }

  private scheduleDrums(stepInBar: number, time: number, isDrop: boolean, style: SynthStyle) {
    if (!this.ctx) return;

    // 1. NATURAL PERCUSSION KICK / SURDO / CAJÓN PATTERNS
    let isKick = false;
    if (style === 'samba') {
      // Syncopated Brazilian Surdo bass drum
      isKick = stepInBar === 0 || stepInBar === 6 || stepInBar === 10 || (isDrop && stepInBar === 14);
    } else if (style === 'cumbia') {
      // Traditional Cumbia Tambora beat
      isKick = stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12;
    } else if (style === 'tango') {
      // Tango Marcato: strong beats 1 and 3 with syncopation
      isKick = stepInBar === 0 || stepInBar === 8 || (isDrop && stepInBar === 12);
    } else if (style === 'flamenco') {
      // Flamenco Cajón bass strike
      isKick = stepInBar === 0 || stepInBar === 6 || stepInBar === 10;
    } else if (style === 'dub') {
      // Reggae acoustic bass drum on beat 3
      isKick = stepInBar === 8 || (isDrop && stepInBar === 0);
    } else {
      // Orchestral & acoustic timekeeping
      isKick = stepInBar % 4 === 0 || (isDrop && stepInBar === 14);
    }

    if (isKick) {
      this.synthesizeKick(time, style === 'samba' ? 62 : style === 'flamenco' ? 55 : 44);
    }

    // 2. ACOUSTIC SNARE / PALMAS / RIMSHOTS / CONGAS
    let isSnare = false;
    let isPalmas = false;
    if (style === 'flamenco') {
      // Authentic Andalusian Palmas (handclaps)
      isSnare = stepInBar === 2 || stepInBar === 6 || stepInBar === 8 || stepInBar === 10 || stepInBar === 14;
      isPalmas = true;
    } else if (style === 'tango') {
      // Bandoneón accent percussive beat
      isSnare = stepInBar === 4 || stepInBar === 10 || stepInBar === 14;
    } else if (style === 'samba') {
      // Brazilian Tamborim / Repique
      isSnare = stepInBar === 3 || stepInBar === 7 || stepInBar === 11 || stepInBar === 15;
    } else if (style === 'dub') {
      // Wooden rimshot on beat 3
      isSnare = stepInBar === 8;
    } else {
      // Warm acoustic orchestral snare on 2 and 4
      isSnare = stepInBar === 4 || stepInBar === 12;
    }

    if (isSnare) {
      this.synthesizeSnare(time, isPalmas);
    }

    // 3. ORGANIC CYMBALS, MARACAS, SHAKERS, BELLS
    if (style === 'samba') {
      // Pandeiro shaker on 16ths + Agogô bell accents
      this.synthesizeHiHat(time, stepInBar % 2 === 1);
      if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6 || stepInBar === 9 || stepInBar === 12) {
        this.synthesizeAgogo(time, stepInBar % 6 === 0 ? 880 : 1174);
      }
    } else if (style === 'sakura') {
      // Japanese Taiko drums & Hyoshigi wooden clappers
      if (stepInBar === 0 || stepInBar === 8) {
        this.synthesizeTaiko(time);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.synthesizeWoodenClack(time);
      }
    } else if (style === 'mariachi' || style === 'cumbia' || style === 'andina') {
      // Latin acoustic maracas / shakers
      if (stepInBar % 2 === 0) {
        this.synthesizeHiHat(time, stepInBar % 4 === 2);
      }
    } else {
      const isHat = stepInBar % 2 === 0 || isDrop;
      if (isHat) {
        const isOpen = stepInBar % 4 === 2;
        this.synthesizeHiHat(time, isOpen);
      }
    }
  }

  private synthesizeWoodenClack(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1450, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.035);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.045);
  }

  private synthesizeAgogo(time: number, freq: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private synthesizeTaiko(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.22);
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  private synthesizeKick(time: number, endFreq: number = 44) {
    if (!this.ctx) return;
    // Acoustic bass drum with warm woody body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, time);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);

    osc.start(time);
    osc.stop(time + 0.19);
  }

  private synthesizeSnare(time: number, isPalmas: boolean = false) {
    if (!this.ctx) return;

    if (!isPalmas) {
      // Acoustic wood drum body
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, time);
      osc.frequency.exponentialRampToValueAtTime(95, time + 0.08);
      oscGain.gain.setValueAtTime(0.32, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.connect(oscGain);
      oscGain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + 0.11);
    }

    // Natural brush / palmas room acoustic sound
    const bufferSize = this.ctx.sampleRate * (isPalmas ? 0.08 : 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isPalmas ? 1800 : 1200, time);
    filter.Q.setValueAtTime(isPalmas ? 3.0 : 1.5, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isPalmas ? 0.35 : 0.28, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + (isPalmas ? 0.08 : 0.1));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain!);

    noise.start(time);
    noise.stop(time + (isPalmas ? 0.09 : 0.11));
  }

  private synthesizeHiHat(time: number, isOpen: boolean) {
    if (!this.ctx) return;

    // Organic metallic acoustic shaker / cymbal
    const bufferSize = this.ctx.sampleRate * (isOpen ? 0.07 : 0.03);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.18 : 0.11, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isOpen ? 0.07 : 0.03));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);

    noise.start(time);
    noise.stop(time + (isOpen ? 0.08 : 0.035));
  }

  private scheduleBass(stepInBar: number, bar: number, time: number, isDrop: boolean, style: SynthStyle) {
    if (!this.ctx) return;

    let rootNotes = ['A2', 'F2', 'C3', 'G2', 'A2', 'F2', 'D3', 'E2'];
    if (style === 'tango') {
      rootNotes = ['A2', 'D3', 'E2', 'A2'];
    } else if (style === 'mariachi') {
      rootNotes = ['G2', 'D3', 'G2', 'C3'];
    } else if (style === 'flamenco') {
      rootNotes = ['E2', 'F2', 'G2', 'E2'];
    } else if (style === 'samba') {
      rootNotes = ['F2', 'C3', 'Bb2', 'C3'];
    } else if (style === 'andina') {
      rootNotes = ['A2', 'C3', 'E3', 'A2'];
    }

    const root = rootNotes[bar % rootNotes.length] || 'A2';
    const rootFreq = NOTES[root] || 110;

    let shouldPlayBass = true;
    if (style === 'dub') {
      shouldPlayBass = stepInBar === 0 || stepInBar === 6 || stepInBar === 10;
    } else if (style === 'tango') {
      shouldPlayBass = stepInBar === 0 || stepInBar === 8 || stepInBar === 12;
    } else if (style === 'mariachi') {
      // Guitarrón on beats 1 and 3
      shouldPlayBass = stepInBar === 0 || stepInBar === 8;
    }

    if (!shouldPlayBass) return;

    const isHigh = stepInBar % 2 === 1 || stepInBar === 3 || stepInBar === 11;
    const freq = isHigh && style !== 'dub' && style !== 'mariachi' ? rootFreq * 2 : rootFreq;

    // Plucked Acoustic Contrabass / Upright Double Bass
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Natural wood string tone (triangle with soft low-pass)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + this.stepDuration * 1.5);

    const vol = style === 'mariachi' ? 0.5 : style === 'tango' ? 0.44 : 0.38;

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);

    osc.start(time);
    osc.stop(time + this.stepDuration * 1.7);
  }

  private getScaleForStyle(style: SynthStyle): string[] {
    switch (style) {
      case 'sakura':
        return SCALES.sakura_InSen;
      case 'oriental':
        return SCALES.oriental_Pentatonic;
      case 'flamenco':
        return SCALES.flamenco_Phrygian;
      case 'raga':
        return SCALES.raga_Bhairav;
      case 'afrobeat':
        return SCALES.afrobeat_Modal;
      case 'tango':
        return SCALES.tango_Dramatic;
      case 'andina':
        return SCALES.andina_Inca;
      case 'samba':
        return SCALES.samba_Tropical;
      case 'cumbia':
        return SCALES.cumbia_Sonidera;
      case 'pacific':
        return SCALES.pacific_Island;
      case 'celtic':
        return SCALES.celtic_Jig;
      case 'dub':
        return SCALES.dub_Reggae;
      case 'kpop':
        return SCALES.kpop_Pentatonic;
      case 'mariachi':
        return SCALES.mariachi_Brass;
      case 'french_touch':
        return SCALES.french_House;
      case 'italodisco':
        return SCALES.italo_Disco;
      case 'nordic_edm':
        return SCALES.nordic_EDM;
      case 'techno':
        return SCALES.techno_Acid;
      default:
        return SCALES.minor_Am;
    }
  }

  private scheduleLead(stepInBar: number, bar: number, time: number, isDrop: boolean, style: SynthStyle) {
    if (!this.ctx) return;

    const scale = this.getScaleForStyle(style);
    const arpIndex = (stepInBar * 3 + bar * 2) % scale.length;
    const noteName = scale[arpIndex];
    const freq = NOTES[noteName] || 440;

    // 1. ACOUSTIC TANGO BANDONEÓN & VIOLIN (Argentina / Uruguay)
    if (style === 'tango') {
      if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6 || stepInBar === 8 || stepInBar === 11 || stepInBar === 14) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.002, time); // Subtle accordion acoustic chorus

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, time);
        filter.Q.setValueAtTime(1.8, time);

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.24, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 2.8);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + this.stepDuration * 3);
        osc2.stop(time + this.stepDuration * 3);
      }
      return;
    }

    // 2. ACOUSTIC FLAMENCO SPANISH GUITAR (Spain)
    if (style === 'flamenco') {
      if (stepInBar % 2 === 0 || stepInBar === 3 || stepInBar === 7) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle'; // Nylon string guitar pluck
        osc.frequency.setValueAtTime(freq, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, time);
        filter.frequency.exponentialRampToValueAtTime(450, time + this.stepDuration * 2);

        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(time);
        osc.stop(time + this.stepDuration * 2.1);
      }
      return;
    }

    // 3. ACOUSTIC SAMBA CAVAQUINHO & FLUTE (Brazil)
    if (style === 'samba') {
      if (stepInBar % 2 === 0 || stepInBar === 3 || stepInBar === 7 || stepInBar === 11) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1700, time);

        gain.gain.setValueAtTime(0.19, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(time);
        osc.stop(time + this.stepDuration * 1.6);
      }
      return;
    }

    // 4. ACOUSTIC MARIACHI TRUMPETS & VIHUELA (Mexico)
    if (style === 'mariachi') {
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
        [1, 1.25].forEach((interval, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const filter = this.ctx!.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * interval, time);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, time);

          gain.gain.setValueAtTime(0.01, time);
          gain.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.14, time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 3.5);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain!);

          osc.start(time);
          osc.stop(time + this.stepDuration * 3.6);
        });
      }
      return;
    }

    // 5. ANDEAN ZAMPOÑA & QUENA PANFLUTES (Peru / Chile)
    if (style === 'andina') {
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        // Breath vibrato
        osc.frequency.linearRampToValueAtTime(freq * 1.012, time + this.stepDuration * 1.5);
        osc.frequency.linearRampToValueAtTime(freq, time + this.stepDuration * 3);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.24, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(time);
        osc.stop(time + this.stepDuration * 4);
      }
      return;
    }

    // 6. JAPANESE SHAKUHACHI FLUTE & KOTO HARP (Japan)
    if (style === 'sakura') {
      if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 12) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        // Shakuhachi pitch bend
        osc.frequency.linearRampToValueAtTime(freq * 1.018, time + this.stepDuration * 1.2);
        osc.frequency.linearRampToValueAtTime(freq, time + this.stepDuration * 2.5);

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 3.6);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(time);
        osc.stop(time + this.stepDuration * 3.8);
      }
      return;
    }

    // 7. FRENCH MUSETTE ACCORDION (France)
    if (style === 'french_touch') {
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
        [freq, freq * 1.004].forEach((f) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const filter = this.ctx!.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, time);
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1050, time);

          gain.gain.setValueAtTime(0.01, time);
          gain.gain.linearRampToValueAtTime(0.18, time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 3.2);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain!);

          osc.start(time);
          osc.stop(time + this.stepDuration * 3.3);
        });
      }
      return;
    }

    // 8. ALL OTHER CULTURES (Acoustic Chamber Strings & Grand Piano Melodies)
    if (stepInBar % 2 === 0 || isDrop) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle'; // Warm acoustic string/piano resonance
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, time);
      filter.frequency.exponentialRampToValueAtTime(600, time + this.stepDuration * 1.5);

      gain.gain.setValueAtTime(isDrop ? 0.22 : 0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + this.stepDuration * 1.7);
    }
  }

  private schedulePads(bar: number, time: number, style: SynthStyle) {
    if (!this.ctx) return;

    let chords = [
      ['A3', 'C4', 'E4'],
      ['F3', 'A3', 'C4'],
      ['C3', 'E3', 'G3'],
      ['G3', 'B3', 'D4'],
    ];

    if (style === 'tango') {
      chords = [
        ['A3', 'C4', 'E4'],
        ['D3', 'F3', 'A3'],
        ['E3', 'Ab3', 'B3'],
        ['A3', 'C4', 'E4'],
      ];
    } else if (style === 'samba') {
      chords = [
        ['F3', 'A3', 'C4'],
        ['D3', 'F3', 'A3'],
        ['G3', 'Bb3', 'D4'],
        ['C3', 'E3', 'G3'],
      ];
    } else if (style === 'flamenco') {
      chords = [
        ['E3', 'Ab3', 'B3'],
        ['F3', 'A3', 'C4'],
        ['G3', 'B3', 'D4'],
        ['F3', 'A3', 'C4'],
      ];
    }

    const chord = chords[bar % chords.length];
    const duration = this.stepDuration * 16;

    // Natural Acoustic Chamber String Section (Violins, Violas, Cellos)
    chord.forEach((note) => {
      const freq = NOTES[note] || 220;
      [-1.5, 1.5].forEach((detune) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'triangle'; // Warm string chamber
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(detune, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.035, time + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(time);
        osc.stop(time + duration);
      });
    });
  }
}

export const soundEngine = new SoundEngine();

export const TRACK_LIST: AudioTrack[] = [
  {
    id: 'track_brazil',
    title: 'Brasil - Samba Tradicional & Favelas de Río',
    artist: 'Batucada Tradicional Carioca',
    bpm: 128,
    difficulty: 'EASY',
    themeColor: '#10b981',
    secondaryColor: '#eab308',
    bgGradient: ['#042217', '#1c1b03'],
    description: 'Ritmo festivo y armónico de samba tradicional acústica con pandeiros, agogô y el Cristo Redentor.',
    baseSpeed: 420,
    synthStyle: 'samba',
    lengthSeconds: 68,
    seed: 10423,
    flagEmoji: '🇧🇷',
  },
  {
    id: 'track_argentina',
    title: 'Argentina - Tango Porteño del Obelisco',
    artist: 'Bandoneón & Guitarras Porteñas',
    bpm: 130,
    difficulty: 'NORMAL',
    themeColor: '#38bdf8',
    secondaryColor: '#facc15',
    bgGradient: ['#031828', '#1a1803'],
    description: 'Tango acústico tranquilo con bandoneón expresivo y acordes nocturnos por la Avenida 9 de Julio.',
    baseSpeed: 440,
    synthStyle: 'tango',
    lengthSeconds: 72,
    seed: 21980,
    flagEmoji: '🇦🇷',
  },
  {
    id: 'track_mexico',
    title: 'México - Tradición de Mariachi en Chichén Itzá',
    artist: 'Sones y Trompetas de Jalisco',
    bpm: 132,
    difficulty: 'EASY',
    themeColor: '#f43f5e',
    secondaryColor: '#eab308',
    bgGradient: ['#240212', '#241a02'],
    description: 'Alegres sones tradicionales de mariachi con guitarrón y pirámides mayas ancestrales.',
    baseSpeed: 425,
    synthStyle: 'mariachi',
    lengthSeconds: 68,
    seed: 61204,
    flagEmoji: '🇲🇽',
  },
  {
    id: 'track_spain',
    title: 'España - Flamenco Acústico en Sagrada Familia',
    artist: 'Guitarras Españolas & Palmas de Andalucía',
    bpm: 134,
    difficulty: 'EASY',
    themeColor: '#ef4444',
    secondaryColor: '#eab308',
    bgGradient: ['#260404', '#211802'],
    description: 'Arpegios de guitarra española flamenca, compás de palmas y arquitectura de Gaudí.',
    baseSpeed: 430,
    synthStyle: 'flamenco',
    lengthSeconds: 70,
    seed: 11234,
    flagEmoji: '🇪🇸',
  },
  {
    id: 'track_france',
    title: 'Francia - Vals Parisino bajo la Torre Eiffel',
    artist: 'Acordeón de París',
    bpm: 138,
    difficulty: 'NORMAL',
    themeColor: '#38bdf8',
    secondaryColor: '#f43f5e',
    bgGradient: ['#041a2e', '#23030d'],
    description: 'Melodía elegante de acordeón parisino con la Torre Eiffel de fondo.',
    baseSpeed: 450,
    synthStyle: 'french_touch',
    lengthSeconds: 75,
    seed: 23451,
    flagEmoji: '🇫🇷',
  },
  {
    id: 'track_italy',
    title: 'Italia - Serenata en el Coliseo Romano',
    artist: 'Mandolinas y Cuerdas de Roma',
    bpm: 140,
    difficulty: 'HARD',
    themeColor: '#10b981',
    secondaryColor: '#f97316',
    bgGradient: ['#021e14', '#250f03'],
    description: 'Armonías italianas clásicas a través del Coliseo de Roma.',
    baseSpeed: 470,
    synthStyle: 'italodisco',
    lengthSeconds: 76,
    seed: 35672,
    flagEmoji: '🇮🇹',
  },
  {
    id: 'track_japan',
    title: 'Japón - Shakuhachi & Koto del Monte Fuji',
    artist: 'Música Tradicional Japonesa',
    bpm: 132,
    difficulty: 'NORMAL',
    themeColor: '#ec4899',
    secondaryColor: '#06b6d4',
    bgGradient: ['#240316', '#021924'],
    description: 'Flauta shakuhachi y arpa koto en la escala pentatónica In-Sen con flores de cerezo.',
    baseSpeed: 435,
    synthStyle: 'sakura',
    lengthSeconds: 70,
    seed: 67123,
    flagEmoji: '🇯🇵',
  },
  {
    id: 'track_endless',
    title: 'Modo Infinito - Exploración Mundial',
    artist: 'Ritmo Global',
    bpm: 140,
    difficulty: 'ENDLESS',
    themeColor: '#06b6d4',
    secondaryColor: '#f43f5e',
    bgGradient: ['#090518', '#1a082c'],
    description: 'Carrera procedural infinita por todos los continentes del planeta.',
    baseSpeed: 450,
    synthStyle: 'samba',
    lengthSeconds: 9999,
    seed: 999999,
  },
];

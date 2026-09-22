/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum VehicleType {
  CUBE = 'CUBE',
  SHIP = 'SHIP',
  WAVE = 'WAVE',
  BALL = 'BALL',
  UFO = 'UFO',
  ROBOT = 'ROBOT',
  SPIDER = 'SPIDER',
}

export enum ObstacleType {
  SPIKE = 'SPIKE',
  DOUBLE_SPIKE = 'DOUBLE_SPIKE',
  TRIPLE_SPIKE = 'TRIPLE_SPIKE',
  HANGING_SPIKE = 'HANGING_SPIKE',
  BLOCK = 'BLOCK',
  PILLAR = 'PILLAR',
  STEP_PLATFORM = 'STEP_PLATFORM',
  FLOATING_BLOCK = 'FLOATING_BLOCK',
  SAW_BLADE = 'SAW_BLADE',
  JUMP_ORB_YELLOW = 'JUMP_ORB_YELLOW', // High jump
  JUMP_ORB_PINK = 'JUMP_ORB_PINK',     // Small jump
  JUMP_ORB_CYAN = 'JUMP_ORB_CYAN',     // Reverse gravity jump
  JUMP_PAD_YELLOW = 'JUMP_PAD_YELLOW', // Auto super jump
  JUMP_PAD_CYAN = 'JUMP_PAD_CYAN',     // Auto gravity flip jump
  GRAVITY_PORTAL_UP = 'GRAVITY_PORTAL_UP',     // Inverts gravity to ceiling
  GRAVITY_PORTAL_DOWN = 'GRAVITY_PORTAL_DOWN', // Normal gravity to floor
  SPEED_PORTAL_SLOW = 'SPEED_PORTAL_SLOW',     // 0.8x
  SPEED_PORTAL_NORMAL = 'SPEED_PORTAL_NORMAL', // 1.0x
  SPEED_PORTAL_FAST = 'SPEED_PORTAL_FAST',     // 1.25x
  SPEED_PORTAL_SONIC = 'SPEED_PORTAL_SONIC',   // 1.5x
  VEHICLE_PORTAL_CUBE = 'VEHICLE_PORTAL_CUBE',
  VEHICLE_PORTAL_SHIP = 'VEHICLE_PORTAL_SHIP',
  VEHICLE_PORTAL_WAVE = 'VEHICLE_PORTAL_WAVE',
  VEHICLE_PORTAL_BALL = 'VEHICLE_PORTAL_BALL',
  VEHICLE_PORTAL_UFO = 'VEHICLE_PORTAL_UFO',
  VEHICLE_PORTAL_ROBOT = 'VEHICLE_PORTAL_ROBOT',
  VEHICLE_PORTAL_SPIDER = 'VEHICLE_PORTAL_SPIDER',
  NEON_COIN = 'NEON_COIN',
  HAZARD_LASER = 'HAZARD_LASER',
  FINISH_GATE = 'FINISH_GATE',
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  beatIndex?: number;
  radius?: number;
  active?: boolean;
  collected?: boolean;
  rotation?: number;
  pulseScale?: number;
  customColor?: string;
  hazardLaserActive?: boolean;
  subType?: string;
}

export type GameMode =
  | 'MENU'
  | 'WORLD_MAP'
  | 'STORE'
  | 'TYCOON'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'OUT_OF_LIVES'
  | 'VICTORY'
  | 'GARAGE';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'INSANE' | 'DEMON' | 'ENDLESS';

export interface Checkpoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  vehicle: VehicleType;
  time: number;
  beatIndex: number;
  speedMultiplier: number;
  attemptScore: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isDead: boolean;
  gravity: number; // 1 = normal (falling down), -1 = inverted (falling up)
  rotation: number; // in radians
  speedMultiplier: number;
  score: number;
  coins: number;
  orbsHit: number;
  jumpBufferTime: number;
  isHoldingJump: boolean;
  lastGroundedY: number;
  lives: number; // 5 lives per level
  maxLives: number;
  vehicle: VehicleType;
  robotBoostTimer?: number;
  wavePoints?: { x: number; y: number }[];
  spiderTeleportFlash?: number;
  checkpointSpawnX?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha?: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'spark' | 'ring' | 'triangle' | 'sakura' | 'confetti' | 'ember';
  rotation?: number;
  vRot?: number;
}

export interface TrailNode {
  x: number;
  y: number;
  alpha: number;
  color: string;
  size: number;
}

export type SynthStyle =
  | 'synthwave'
  | 'chiptune'
  | 'cyberpunk'
  | 'darkwave'
  | 'dnb'
  | 'samba'
  | 'tango'
  | 'andina'
  | 'cumbia'
  | 'mariachi'
  | 'flamenco'
  | 'techno'
  | 'sakura'
  | 'raga'
  | 'afrobeat'
  | 'oriental'
  | 'pacific'
  | 'celtic'
  | 'dub'
  | 'kpop'
  | 'french_touch'
  | 'italodisco'
  | 'nordic_edm';

export type LandmarkType =
  | 'pyramid'
  | 'torii'
  | 'eiffel'
  | 'pagoda'
  | 'tiki'
  | 'mountains'
  | 'colosseum'
  | 'castle'
  | 'big_ben'
  | 'taj_mahal'
  | 'moai'
  | 'sydney_opera'
  | 'statue_liberty'
  | 'cristo_redentor'
  | 'windmill'
  | 'mayan_pyramid'
  | 'parthenon'
  | 'obelisk_buenos_aires'
  | 'favelas_rio'
  | 'sagrada_familia'
  | 'brandenburg_gate'
  | 'fuji_torii'
  | 'machu_picchu'
  | 'seoul_tower'
  | 'sound_system_reggae'
  | 'safari_savanna';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  themeColor: string;
  secondaryColor: string;
  bgGradient: [string, string];
  description: string;
  baseSpeed: number;
  synthStyle: SynthStyle;
  lengthSeconds: number;
  seed: number;
  countryCode?: string;
  countryName?: string;
  flagEmoji?: string;
  continentId?: string;
  culturalTrait?: string;
  landmark?: LandmarkType;
}

export interface CountryLevel {
  id: string;
  countryName: string;
  countryCode: string;
  flagEmoji: string;
  levelName: string;
  culturalTheme: string;
  continentId: string;
  difficulty: Difficulty;
  bpm: number;
  baseSpeed: number;
  themeColor: string;
  secondaryColor: string;
  bgGradient: [string, string];
  description: string;
  synthStyle: SynthStyle;
  seed: number;
  landmark: LandmarkType;
  rewardCoins: number;
}

export interface ContinentData {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  bgGrad: [string, string];
  countries: CountryLevel[];
}

export interface PlayerCustomization {
  skinId: string;
  primaryColor: string;
  secondaryColor: string;
  trailType: 'glow' | 'rainbow' | 'particles' | 'fire' | 'matrix' | 'sakura' | 'warp';
  deathEffect: 'shatter' | 'implosion' | 'pixelate' | 'supernova' | 'blackhole';
}

export interface StoreItem {
  id: string;
  name: string;
  category: 'skin' | 'trail' | 'deathEffect' | 'color';
  price: number;
  currency?: 'coins' | 'diamonds';
  description: string;
  icon: string;
  primaryColor?: string;
  secondaryColor?: string;
  badge?: string;
}

export interface LevelData {
  id: string;
  name: string;
  seed: number;
  bpm: number;
  difficulty: Difficulty;
  speed: number;
  length: number;
  obstacles: Obstacle[];
  track: AudioTrack;
  landmark?: LandmarkType;
  countryInfo?: {
    name: string;
    flag: string;
    culture: string;
  };
}

export interface LevelResultReward {
  levelCoinsCollected: number;
  completionBonus: number;
  perfectBonus: number;
  attemptBonus: number;
  totalCoinsEarned: number;
  isPerfect: boolean;
}

export interface TycoonMachine {
  id: string;
  name: string;
  cost: number;
  incomePerSec: number;
  currencyType: 'coins' | 'diamonds';
  floor: 1 | 2;
  description: string;
  icon: string;
  glowColor: string;
}

export interface TycoonState {
  floor1Restored: boolean; // Cost: 500 coins to restore illumination & decor
  floor1PurchasedMachines: string[]; // ids of purchased machines
  floor2Unlocked: boolean; // Cost: 1500 coins after all floor 1 items bought
  floor2PurchasedMachines: string[]; // ids of purchased diamond machines
  lastCollectTimestamp: number;
}

export interface UserProfile {
  username: string;
  avatarIcon: string;
  rankTitle: string;
  countryFlag: string;
  bio: string;
  favoriteCountryId?: string;
  unlockedBadges: string[];
}

export interface GameStats {
  coinsBalance: number; // Spendable coins
  diamondsBalance: number; // Spendable diamonds 💎
  attempts: number;
  jumps: number;
  deaths: number;
  coinsCollected: number;
  diamondsCollected: number;
  levelsCompleted: number;
  highScores: Record<string, number>; // levelId -> percentage (0 - 100)
  levelStars: Record<string, number>; // levelId -> stars (1 - 3)
  unlockedSkins: string[];
  unlockedTrails: string[];
  unlockedDeathEffects: string[];
  tycoon: TycoonState;
  userProfile?: UserProfile;
}

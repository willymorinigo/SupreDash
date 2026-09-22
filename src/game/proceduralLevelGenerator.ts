/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioTrack, CountryLevel, Difficulty, LevelData, Obstacle, ObstacleType } from '../types';

export const GAME_CONSTANTS = {
  GRID_SIZE: 50,
  FLOOR_Y: 480,
  CEILING_Y: 100,
  PLAYER_SIZE: 42,
  // Smooth, satisfying and responsive low-gravity arcade physics (floaty & balanced)
  GRAVITY: 1580,
  JUMP_FORCE: -640,
  ORB_YELLOW_FORCE: -680,
  ORB_PINK_FORCE: -540,
  ORB_CYAN_FORCE: -630,
  PAD_YELLOW_FORCE: -820,
  PAD_CYAN_FORCE: -740,
  TERMINAL_VELOCITY: 900,
  BUFFER_WINDOW_MS: 190,
};

// Seeded PRNG (Mulberry32)
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed ? Math.abs(seed) : 123456789;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public choose<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  public chance(prob: number): boolean {
    return this.next() < prob;
  }
}

export class ProceduralLevelGenerator {
  /**
   * Helper to convert a CountryLevel from the World Map into an AudioTrack
   */
  public static countryToAudioTrack(country: CountryLevel): AudioTrack {
    return {
      id: country.id,
      title: `${country.countryName} - ${country.levelName}`,
      artist: country.culturalTheme,
      bpm: country.bpm,
      difficulty: country.difficulty,
      themeColor: country.themeColor,
      secondaryColor: country.secondaryColor,
      bgGradient: country.bgGradient,
      description: country.description,
      baseSpeed: country.baseSpeed,
      synthStyle: country.synthStyle,
      lengthSeconds: 68,
      seed: country.seed,
      countryCode: country.countryCode,
      countryName: country.countryName,
      flagEmoji: country.flagEmoji,
      continentId: country.continentId,
      culturalTrait: country.culturalTheme,
      landmark: country.landmark,
    };
  }

  /**
   * Generates a complete beat-synced level for a given country or custom track with vehicle portals
   */
  public static generateLevel(track: AudioTrack, customSeed?: number, customDifficulty?: Difficulty): LevelData {
    const seed = customSeed !== undefined ? customSeed : track.seed;
    const difficulty = customDifficulty || track.difficulty;
    const rng = new SeededRNG(seed);

    const bpm = track.bpm;
    const speed = track.baseSpeed;
    const secondsPerBeat = 60 / bpm;
    const distancePerBeat = speed * secondsPerBeat;

    const totalBeats = Math.floor((track.lengthSeconds || 68) / secondsPerBeat);
    const obstacles: Obstacle[] = [];

    let currentBeat = 4;
    let currentGravity = 1; // 1 = floor, -1 = ceiling
    let currentVehicle = 'CUBE';
    let idCounter = 1;

    const createId = () => `obs_${idCounter++}`;

    const getGroundY = (grav: number, heightLevel: number = 0) => {
      if (grav === 1) {
        return GAME_CONSTANTS.FLOOR_Y - heightLevel * GAME_CONSTANTS.GRID_SIZE;
      } else {
        return GAME_CONSTANTS.CEILING_Y + heightLevel * GAME_CONSTANTS.GRID_SIZE;
      }
    };

    while (currentBeat < totalBeats - 4) {
      const beatX = currentBeat * distancePerBeat;
      const barIndex = Math.floor(currentBeat / 4);
      const isBarStart = currentBeat % 4 === 0;

      const isDrop = (barIndex >= 5 && barIndex < 12) || (barIndex >= 16 && barIndex < 24);
      const isClimax = barIndex >= 20 && barIndex < 24;

      // 1. VEHICLE TRANSFORMATION SECTIONS (Dedicated gameplay tracks built specifically for each vehicle)
      if (isBarStart && isDrop && rng.chance(0.48) && currentBeat + 18 < totalBeats && currentVehicle === 'CUBE') {
        const vehiclePool = [
          ObstacleType.VEHICLE_PORTAL_SHIP,
          ObstacleType.VEHICLE_PORTAL_WAVE,
          ObstacleType.VEHICLE_PORTAL_BALL,
          ObstacleType.VEHICLE_PORTAL_UFO,
          ObstacleType.VEHICLE_PORTAL_ROBOT,
          ObstacleType.VEHICLE_PORTAL_SPIDER,
        ];
        const selectedPortal = rng.choose(vehiclePool);
        
        // Spawn Vehicle Entry Portal
        obstacles.push({
          id: createId(),
          type: selectedPortal,
          x: beatX,
          y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 45,
          width: 40,
          height: 90,
          beatIndex: currentBeat,
          pulseScale: 1.2,
        });

        currentBeat += 2;

        // GENERATE DEDICATED TRACK FOR THIS VEHICLE
        if (selectedPortal === ObstacleType.VEHICLE_PORTAL_SHIP) {
          // --- SHIP FLIGHT CAVERN (12 beats) ---
          const shipDuration = 12;
          for (let s = 0; s < shipDuration; s += 2.5) {
            const sx = (currentBeat + s) * distancePerBeat;
            const topHeight = rng.choose([1, 1.5, 2]) * GAME_CONSTANTS.GRID_SIZE;
            const bottomHeight = rng.choose([1, 1.5, 2]) * GAME_CONSTANTS.GRID_SIZE;

            // Ceiling hanging obstacles
            obstacles.push({
              id: createId(),
              type: ObstacleType.HANGING_SPIKE,
              x: sx,
              y: GAME_CONSTANTS.CEILING_Y,
              width: GAME_CONSTANTS.GRID_SIZE * 1.5,
              height: topHeight,
              beatIndex: currentBeat + s,
            });

            // Floor spikes
            obstacles.push({
              id: createId(),
              type: ObstacleType.SPIKE,
              x: sx + distancePerBeat * 0.8,
              y: GAME_CONSTANTS.FLOOR_Y - bottomHeight,
              width: GAME_CONSTANTS.GRID_SIZE * 1.5,
              height: bottomHeight,
              beatIndex: currentBeat + s + 0.8,
            });

            // Floating coin rings in the safe flying corridor
            if (s > 2 && s < shipDuration - 2 && rng.chance(0.6)) {
              obstacles.push({
                id: createId(),
                type: ObstacleType.NEON_COIN,
                x: sx + distancePerBeat * 0.4,
                y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 16,
                width: 32,
                height: 32,
                beatIndex: currentBeat + s + 0.4,
              });
            }
          }
          currentBeat += shipDuration;
        } else if (selectedPortal === ObstacleType.VEHICLE_PORTAL_WAVE) {
          // --- WAVE ZIG-ZAG CORRIDORS (10 beats) ---
          const waveDuration = 10;
          for (let w = 0; w < waveDuration; w += 2) {
            const wx = (currentBeat + w) * distancePerBeat;
            const isUpper = (w / 2) % 2 === 0;

            obstacles.push({
              id: createId(),
              type: isUpper ? ObstacleType.HANGING_SPIKE : ObstacleType.SPIKE,
              x: wx,
              y: isUpper ? GAME_CONSTANTS.CEILING_Y : GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE * 1.8,
              width: GAME_CONSTANTS.GRID_SIZE * 1.8,
              height: GAME_CONSTANTS.GRID_SIZE * 1.8,
              beatIndex: currentBeat + w,
            });

            if (rng.chance(0.5)) {
              obstacles.push({
                id: createId(),
                type: ObstacleType.NEON_COIN,
                x: wx + distancePerBeat * 0.5,
                y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 16,
                width: 32,
                height: 32,
                beatIndex: currentBeat + w + 0.5,
              });
            }
          }
          currentBeat += waveDuration;
        } else if (selectedPortal === ObstacleType.VEHICLE_PORTAL_BALL) {
          // --- BALL DUAL GRAVITY PLATFORMS (12 beats) ---
          const ballDuration = 12;
          for (let b = 0; b < ballDuration; b += 3) {
            const bx = (currentBeat + b) * distancePerBeat;
            const isFloorRunway = (b / 3) % 2 === 0;

            // Runway
            obstacles.push({
              id: createId(),
              type: ObstacleType.STEP_PLATFORM,
              x: bx,
              y: isFloorRunway ? GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE : GAME_CONSTANTS.CEILING_Y + GAME_CONSTANTS.GRID_SIZE,
              width: GAME_CONSTANTS.GRID_SIZE * 2.5,
              height: GAME_CONSTANTS.GRID_SIZE,
              beatIndex: currentBeat + b,
            });

            // Hazard on opposite side that requires flip
            obstacles.push({
              id: createId(),
              type: isFloorRunway ? ObstacleType.HANGING_SPIKE : ObstacleType.SPIKE,
              x: bx + distancePerBeat * 1.2,
              y: isFloorRunway ? GAME_CONSTANTS.CEILING_Y : GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE,
              width: GAME_CONSTANTS.GRID_SIZE,
              height: GAME_CONSTANTS.GRID_SIZE,
              beatIndex: currentBeat + b + 1.2,
            });
          }
          currentBeat += ballDuration;
        } else if (selectedPortal === ObstacleType.VEHICLE_PORTAL_UFO) {
          // --- UFO FLAPPING GAUNTLET (12 beats) ---
          const ufoDuration = 12;
          for (let u = 0; u < ufoDuration; u += 2.4) {
            const ux = (currentBeat + u) * distancePerBeat;
            const pillarHeight = rng.choose([1, 2]) * GAME_CONSTANTS.GRID_SIZE;

            // Floating stepping platform
            obstacles.push({
              id: createId(),
              type: ObstacleType.STEP_PLATFORM,
              x: ux,
              y: GAME_CONSTANTS.FLOOR_Y - pillarHeight - GAME_CONSTANTS.GRID_SIZE * 1.5,
              width: GAME_CONSTANTS.GRID_SIZE * 1.5,
              height: GAME_CONSTANTS.GRID_SIZE * 0.8,
              beatIndex: currentBeat + u,
            });

            // Spike beneath the gap
            obstacles.push({
              id: createId(),
              type: ObstacleType.SPIKE,
              x: ux + GAME_CONSTANTS.GRID_SIZE * 1.6,
              y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE,
              width: GAME_CONSTANTS.GRID_SIZE,
              height: GAME_CONSTANTS.GRID_SIZE,
              beatIndex: currentBeat + u + 0.6,
            });
          }
          currentBeat += ufoDuration;
        } else if (selectedPortal === ObstacleType.VEHICLE_PORTAL_SPIDER) {
          // --- SPIDER TELEPORT WALLS (12 beats) ---
          const spiderDuration = 12;
          for (let sp = 0; sp < spiderDuration; sp += 3) {
            const spx = (currentBeat + sp) * distancePerBeat;
            const topBar = (sp / 3) % 2 === 0;

            if (topBar) {
              obstacles.push({
                id: createId(),
                type: ObstacleType.HANGING_SPIKE,
                x: spx,
                y: GAME_CONSTANTS.CEILING_Y,
                width: GAME_CONSTANTS.GRID_SIZE * 2,
                height: GAME_CONSTANTS.GRID_SIZE * 2.8,
                beatIndex: currentBeat + sp,
              });
            } else {
              obstacles.push({
                id: createId(),
                type: ObstacleType.SPIKE,
                x: spx,
                y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE * 2.8,
                width: GAME_CONSTANTS.GRID_SIZE * 2,
                height: GAME_CONSTANTS.GRID_SIZE * 2.8,
                beatIndex: currentBeat + sp,
              });
            }
          }
          currentBeat += spiderDuration;
        } else if (selectedPortal === ObstacleType.VEHICLE_PORTAL_ROBOT) {
          // --- ROBOT SUPER LEAP CANYONS (12 beats) ---
          const robotDuration = 12;
          for (let rb = 0; rb < robotDuration; rb += 4) {
            const rbx = (currentBeat + rb) * distancePerBeat;
            const highLedgeHeight = GAME_CONSTANTS.GRID_SIZE * 2.5;

            // Tall takeoff platform
            obstacles.push({
              id: createId(),
              type: ObstacleType.STEP_PLATFORM,
              x: rbx,
              y: GAME_CONSTANTS.FLOOR_Y - highLedgeHeight,
              width: GAME_CONSTANTS.GRID_SIZE * 2,
              height: highLedgeHeight,
              beatIndex: currentBeat + rb,
            });

            // Deep spike canyon
            obstacles.push({
              id: createId(),
              type: ObstacleType.DOUBLE_SPIKE,
              x: rbx + GAME_CONSTANTS.GRID_SIZE * 2.2,
              y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE,
              width: GAME_CONSTANTS.GRID_SIZE * 2,
              height: GAME_CONSTANTS.GRID_SIZE,
              beatIndex: currentBeat + rb + 1.2,
            });
          }
          currentBeat += robotDuration;
        }

        // Spawn Exit Portal returning player to Cube
        const exitPortalX = currentBeat * distancePerBeat;
        obstacles.push({
          id: createId(),
          type: ObstacleType.VEHICLE_PORTAL_CUBE,
          x: exitPortalX,
          y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 45,
          width: 40,
          height: 90,
          beatIndex: currentBeat,
          pulseScale: 1.2,
        });

        currentVehicle = 'CUBE';
        currentBeat += 3;
        continue;
      }

      // 2. GRAVITY INVERSION PORTALS (In cube)
      if (
        isBarStart &&
        isDrop &&
        currentVehicle === 'CUBE' &&
        difficulty !== 'EASY' &&
        rng.chance(difficulty === 'INSANE' || difficulty === 'DEMON' ? 0.35 : 0.22)
      ) {
        currentGravity = currentGravity === 1 ? -1 : 1;
        obstacles.push({
          id: createId(),
          type: currentGravity === -1 ? ObstacleType.GRAVITY_PORTAL_UP : ObstacleType.GRAVITY_PORTAL_DOWN,
          x: beatX,
          y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 40,
          width: 36,
          height: 80,
          beatIndex: currentBeat,
          pulseScale: 1,
        });
        currentBeat += 3;
        continue;
      }

      // 3. SPEED ACCELERATION GATES
      if (isBarStart && isClimax && rng.chance(0.25) && difficulty !== 'EASY') {
        const speedType =
          difficulty === 'DEMON'
            ? ObstacleType.SPEED_PORTAL_SONIC
            : difficulty === 'INSANE'
            ? ObstacleType.SPEED_PORTAL_FAST
            : ObstacleType.SPEED_PORTAL_NORMAL;

        obstacles.push({
          id: createId(),
          type: speedType,
          x: beatX,
          y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 35,
          width: 32,
          height: 70,
          beatIndex: currentBeat,
        });
        currentBeat += 2;
        continue;
      }

      // 4. VEHICLE SPECIFIC DEDICATED LEVEL PATTERNS
      if (currentVehicle === 'SHIP' || currentVehicle === 'WAVE') {
        // Ship / Wave Flight Corridor: Pillars and hanging saws
        const midY = (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2;
        const placeTopObstacle = rng.chance(0.6);
        const placeBottomObstacle = rng.chance(0.6);

        if (placeTopObstacle) {
          obstacles.push({
            id: createId(),
            type: ObstacleType.HANGING_SPIKE,
            x: beatX,
            y: GAME_CONSTANTS.CEILING_Y,
            width: GAME_CONSTANTS.GRID_SIZE * (currentVehicle === 'WAVE' ? 1 : 2),
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
        }
        if (placeBottomObstacle) {
          obstacles.push({
            id: createId(),
            type: ObstacleType.SPIKE,
            x: beatX + (placeTopObstacle ? distancePerBeat * 0.5 : 0),
            y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE,
            width: GAME_CONSTANTS.GRID_SIZE * (currentVehicle === 'WAVE' ? 1 : 2),
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
        }

        // Coin in center of flight path
        if (rng.chance(0.25)) {
          obstacles.push({
            id: createId(),
            type: ObstacleType.NEON_COIN,
            x: beatX + distancePerBeat * 0.5,
            y: midY - 16,
            width: 32,
            height: 32,
            beatIndex: currentBeat,
          });
        }

        currentBeat += 2.2;
        continue;
      }

      // UFO SPECIFIC PATTERN: Consecutive jumping pillars with spikes between
      if (currentVehicle === 'UFO') {
        const pillarCount = rng.choose([3, 4, 5]);
        for (let p = 0; p < pillarCount; p++) {
          const pX = beatX + p * (distancePerBeat * 1.6);
          const pillarHeight = rng.choose([1, 2, 3]) * GAME_CONSTANTS.GRID_SIZE;
          const pY = GAME_CONSTANTS.FLOOR_Y - pillarHeight;

          // Pillar block
          obstacles.push({
            id: createId(),
            type: ObstacleType.STEP_PLATFORM,
            x: pX,
            y: pY,
            width: GAME_CONSTANTS.GRID_SIZE * 1.5,
            height: pillarHeight,
            beatIndex: currentBeat + p * 1.6,
          });

          // Spike in the gap between pillars
          if (p < pillarCount - 1) {
            obstacles.push({
              id: createId(),
              type: ObstacleType.SPIKE,
              x: pX + GAME_CONSTANTS.GRID_SIZE * 1.5 + 10,
              y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE,
              width: GAME_CONSTANTS.GRID_SIZE,
              height: GAME_CONSTANTS.GRID_SIZE,
              beatIndex: currentBeat + p * 1.6 + 0.8,
            });
          }

          // Bonus coin on top of middle pillar
          if (p === Math.floor(pillarCount / 2)) {
            obstacles.push({
              id: createId(),
              type: ObstacleType.NEON_COIN,
              x: pX + GAME_CONSTANTS.GRID_SIZE * 0.5,
              y: pY - 50,
              width: 32,
              height: 32,
              beatIndex: currentBeat + p * 1.6,
            });
          }
        }

        currentBeat += pillarCount * 1.6 + 1;
        continue;
      }

      // BALL SPECIFIC PATTERN: Alternating Floor & Ceiling switches
      if (currentVehicle === 'BALL') {
        const switchCount = rng.choose([2, 3]);
        for (let s = 0; s < switchCount; s++) {
          const sX = beatX + s * (distancePerBeat * 2.2);
          const isFloor = s % 2 === 0;

          // Hazard on current track that requires gravity switch
          obstacles.push({
            id: createId(),
            type: isFloor ? ObstacleType.SPIKE : ObstacleType.HANGING_SPIKE,
            x: sX,
            y: isFloor ? GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE : GAME_CONSTANTS.CEILING_Y,
            width: GAME_CONSTANTS.GRID_SIZE,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat + s * 2.2,
          });

          // Runway on opposite side to land on
          obstacles.push({
            id: createId(),
            type: ObstacleType.STEP_PLATFORM,
            x: sX + 40,
            y: !isFloor ? GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE : GAME_CONSTANTS.CEILING_Y,
            width: GAME_CONSTANTS.GRID_SIZE * 2,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat + s * 2.2 + 0.5,
          });
        }

        currentBeat += switchCount * 2.2 + 1;
        continue;
      }

      // SPIDER SPECIFIC PATTERN: Teleport gap walls
      if (currentVehicle === 'SPIDER') {
        const wallX = beatX;
        // Tall wall with only top or bottom passage
        const leaveBottomOpen = rng.chance(0.5);
        if (leaveBottomOpen) {
          // Hanging barrier from ceiling
          obstacles.push({
            id: createId(),
            type: ObstacleType.HANGING_SPIKE,
            x: wallX,
            y: GAME_CONSTANTS.CEILING_Y,
            width: GAME_CONSTANTS.GRID_SIZE * 2,
            height: GAME_CONSTANTS.GRID_SIZE * 3,
            beatIndex: currentBeat,
          });
        } else {
          // Tall barrier from floor
          obstacles.push({
            id: createId(),
            type: ObstacleType.SPIKE,
            x: wallX,
            y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.GRID_SIZE * 3,
            width: GAME_CONSTANTS.GRID_SIZE * 2,
            height: GAME_CONSTANTS.GRID_SIZE * 3,
            beatIndex: currentBeat,
          });
        }

        currentBeat += 2.5;
        continue;
      }

      // 5. INVERTED CEILING PATHWAYS (When gravity is inverted: build along upper ceiling)
      if (currentGravity === -1) {
        const topPattern = rng.range(0, 100);
        const ceilY = GAME_CONSTANTS.CEILING_Y;

        if (topPattern < 40) {
          // Ceiling hanging spikes
          const count = rng.choose([1, 2]);
          obstacles.push({
            id: createId(),
            type: count === 2 ? ObstacleType.DOUBLE_SPIKE : ObstacleType.HANGING_SPIKE,
            x: beatX,
            y: ceilY,
            width: GAME_CONSTANTS.GRID_SIZE * count,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += count === 2 ? 2.8 : 2.0;
        } else if (topPattern < 75) {
          // Upper elevated ceiling platform walkway
          const platLen = rng.choose([2, 3, 4]);
          obstacles.push({
            id: createId(),
            type: ObstacleType.STEP_PLATFORM,
            x: beatX,
            y: ceilY + GAME_CONSTANTS.GRID_SIZE,
            width: GAME_CONSTANTS.GRID_SIZE * platLen,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });

          // Inverted jumping orb along top path
          if (rng.chance(0.5)) {
            obstacles.push({
              id: createId(),
              type: ObstacleType.JUMP_ORB_YELLOW,
              x: beatX + (platLen * GAME_CONSTANTS.GRID_SIZE) / 2,
              y: ceilY + 110,
              width: 36,
              height: 36,
              beatIndex: currentBeat,
            });
          }

          currentBeat += platLen + 1;
        } else {
          // Inverted Jump Pad attached to ceiling
          obstacles.push({
            id: createId(),
            type: ObstacleType.JUMP_PAD_YELLOW,
            x: beatX,
            y: ceilY,
            width: 44,
            height: 18,
            beatIndex: currentBeat,
          });
          currentBeat += 2.2;
        }
        continue;
      }

      // 6. STANDARD RHYTHMIC HAZARD PATTERNS FOR GROUND (Cube, Robot)
      const patternChoice = rng.range(0, 100);

      if (patternChoice < 26) {
        // Pattern A: Single, Double or Triple Spikes
        const isDouble = (difficulty !== 'EASY' && rng.chance(0.48)) || isDrop;
        const isTriple =
          (difficulty === 'HARD' || difficulty === 'INSANE' || difficulty === 'DEMON') && rng.chance(0.35);

        if (isTriple && currentGravity === 1) {
          obstacles.push({
            id: createId(),
            type: ObstacleType.TRIPLE_SPIKE,
            x: beatX,
            y: getGroundY(currentGravity) - GAME_CONSTANTS.GRID_SIZE,
            width: GAME_CONSTANTS.GRID_SIZE * 3,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += 3.8;
        } else if (isDouble) {
          obstacles.push({
            id: createId(),
            type: ObstacleType.DOUBLE_SPIKE,
            x: beatX,
            y:
              currentGravity === 1
                ? getGroundY(currentGravity) - GAME_CONSTANTS.GRID_SIZE
                : getGroundY(currentGravity),
            width: GAME_CONSTANTS.GRID_SIZE * 2,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += 2.8;
        } else {
          obstacles.push({
            id: createId(),
            type: currentGravity === 1 ? ObstacleType.SPIKE : ObstacleType.HANGING_SPIKE,
            x: beatX,
            y:
              currentGravity === 1
                ? getGroundY(currentGravity) - GAME_CONSTANTS.GRID_SIZE
                : getGroundY(currentGravity),
            width: GAME_CONSTANTS.GRID_SIZE,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += difficulty === 'EASY' ? 2.8 : 2.0;
        }
      } else if (patternChoice < 48) {
        // Pattern B: Stepping Platforms & Elevated Runways
        const blockCount = rng.choose([2, 3, 4]);
        const blockX = beatX;
        const blockY =
          currentGravity === 1
            ? getGroundY(currentGravity) - GAME_CONSTANTS.GRID_SIZE
            : getGroundY(currentGravity);

        obstacles.push({
          id: createId(),
          type: ObstacleType.STEP_PLATFORM,
          x: blockX,
          y: blockY,
          width: GAME_CONSTANTS.GRID_SIZE * blockCount,
          height: GAME_CONSTANTS.GRID_SIZE,
          beatIndex: currentBeat,
        });

        // Hazardous spikes on top of platform for higher difficulties
        if (blockCount >= 3 && rng.chance(0.55) && difficulty !== 'EASY') {
          obstacles.push({
            id: createId(),
            type: currentGravity === 1 ? ObstacleType.SPIKE : ObstacleType.HANGING_SPIKE,
            x: blockX + GAME_CONSTANTS.GRID_SIZE,
            y:
              currentGravity === 1
                ? blockY - GAME_CONSTANTS.GRID_SIZE
                : blockY + GAME_CONSTANTS.GRID_SIZE,
            width: GAME_CONSTANTS.GRID_SIZE,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
        }

        // Secret Neon Coin reward
        if (rng.chance(0.2)) {
          obstacles.push({
            id: createId(),
            type: ObstacleType.NEON_COIN,
            x: blockX + (blockCount * GAME_CONSTANTS.GRID_SIZE) / 2,
            y: currentGravity === 1 ? blockY - 80 : blockY + 80,
            width: 32,
            height: 32,
            beatIndex: currentBeat,
          });
        }

        currentBeat += blockCount + 1;
      } else if (patternChoice < 72) {
        // Pattern C: Interactive Jump Orbs & Jump Pads
        const isOrb = rng.chance(0.65);
        const groundY = getGroundY(currentGravity);

        if (isOrb) {
          const orbType =
            (difficulty === 'INSANE' || difficulty === 'DEMON') && rng.chance(0.4)
              ? ObstacleType.JUMP_ORB_CYAN
              : rng.chance(0.7)
              ? ObstacleType.JUMP_ORB_YELLOW
              : ObstacleType.JUMP_ORB_PINK;

          // Spike hazard below the orb
          obstacles.push({
            id: createId(),
            type: currentGravity === 1 ? ObstacleType.SPIKE : ObstacleType.HANGING_SPIKE,
            x: beatX,
            y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
            width: GAME_CONSTANTS.GRID_SIZE,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });

          // Interactive Jump Orb
          obstacles.push({
            id: createId(),
            type: orbType,
            x: beatX + 8,
            y: currentGravity === 1 ? groundY - 110 : groundY + 80,
            width: 36,
            height: 36,
            radius: 28,
            active: true,
            beatIndex: currentBeat,
          });

          // Chained 2nd orb for hard / insane / demon
          if (
            (difficulty === 'HARD' || difficulty === 'INSANE' || difficulty === 'DEMON') &&
            isDrop &&
            rng.chance(0.45)
          ) {
            const secondOrbX = beatX + distancePerBeat * 1.1;
            obstacles.push({
              id: createId(),
              type: ObstacleType.JUMP_ORB_PINK,
              x: secondOrbX + 8,
              y: currentGravity === 1 ? groundY - 125 : groundY + 95,
              width: 36,
              height: 36,
              radius: 28,
              active: true,
              beatIndex: currentBeat + 1,
            });
            obstacles.push({
              id: createId(),
              type: currentGravity === 1 ? ObstacleType.DOUBLE_SPIKE : ObstacleType.HANGING_SPIKE,
              x: secondOrbX,
              y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
              width: GAME_CONSTANTS.GRID_SIZE * 2,
              height: GAME_CONSTANTS.GRID_SIZE,
              beatIndex: currentBeat + 1,
            });
            currentBeat += 2.8;
          } else {
            currentBeat += 2.4;
          }
        } else {
          // Auto Jump Pad
          const padType = rng.chance(0.75) ? ObstacleType.JUMP_PAD_YELLOW : ObstacleType.JUMP_PAD_CYAN;
          obstacles.push({
            id: createId(),
            type: padType,
            x: beatX,
            y: currentGravity === 1 ? groundY - 15 : groundY,
            width: 44,
            height: 15,
            beatIndex: currentBeat,
          });

          // Hazard for pad to leap over
          obstacles.push({
            id: createId(),
            type: ObstacleType.TRIPLE_SPIKE,
            x: beatX + distancePerBeat * 0.65,
            y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
            width: GAME_CONSTANTS.GRID_SIZE * 3,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat + 1,
          });

          currentBeat += 3.2;
        }
      } else if (patternChoice < 88) {
        // Pattern D: Spinning Saw Blades
        const groundY = getGroundY(currentGravity);
        const sawY = currentGravity === 1 ? groundY - 70 : groundY + 40;

        obstacles.push({
          id: createId(),
          type: ObstacleType.SAW_BLADE,
          x: beatX + 20,
          y: sawY,
          width: 54,
          height: 54,
          radius: 27,
          rotation: 0,
          beatIndex: currentBeat,
        });

        // Jump pad to launch before saw
        obstacles.push({
          id: createId(),
          type: ObstacleType.JUMP_PAD_YELLOW,
          x: beatX - distancePerBeat * 0.45,
          y: currentGravity === 1 ? groundY - 15 : groundY,
          width: 44,
          height: 15,
          beatIndex: currentBeat - 0.5,
        });

        currentBeat += 2.8;
      } else {
        // Pattern E: Tower Pillar with Orb Vault
        const groundY = getGroundY(currentGravity);

        obstacles.push({
          id: createId(),
          type: ObstacleType.PILLAR,
          x: beatX,
          y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE * 2 : groundY,
          width: GAME_CONSTANTS.GRID_SIZE,
          height: GAME_CONSTANTS.GRID_SIZE * 2,
          beatIndex: currentBeat,
        });

        obstacles.push({
          id: createId(),
          type: ObstacleType.JUMP_ORB_YELLOW,
          x: beatX - distancePerBeat * 0.55,
          y: currentGravity === 1 ? groundY - 100 : groundY + 70,
          width: 36,
          height: 36,
          radius: 28,
          active: true,
          beatIndex: currentBeat,
        });

        currentBeat += 3.2;
      }
    }

    // Finish Gate
    const finishX = totalBeats * distancePerBeat;
    obstacles.push({
      id: 'finish_gate',
      type: ObstacleType.FINISH_GATE,
      x: finishX,
      y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 80,
      width: 50,
      height: 160,
      beatIndex: totalBeats,
    });

    return {
      id: track.id,
      name: track.title,
      seed,
      bpm,
      difficulty,
      speed,
      length: finishX + 200,
      obstacles,
      track,
      landmark: track.landmark,
      countryInfo: track.countryName
        ? {
            name: track.countryName,
            flag: track.flagEmoji || '🏳️',
            culture: track.culturalTrait || '',
          }
        : undefined,
    };
  }

  /**
   * Endless mode chunk generation with vehicle portals
   */
  public static generateEndlessChunk(
    startX: number,
    length: number,
    speed: number,
    bpm: number,
    difficultyTier: number,
    rng: SeededRNG
  ): Obstacle[] {
    const chunkObstacles: Obstacle[] = [];
    const secondsPerBeat = 60 / bpm;
    const distancePerBeat = speed * secondsPerBeat;
    const chunkBeats = Math.floor(length / distancePerBeat);

    let currentBeat = 0;
    let currentGravity = 1;
    let idCounter = Math.floor(startX);

    while (currentBeat < chunkBeats) {
      const beatX = startX + currentBeat * distancePerBeat;
      const groundY = currentGravity === 1 ? GAME_CONSTANTS.FLOOR_Y : GAME_CONSTANTS.CEILING_Y;

      // Occasional vehicle switch portal in Endless mode
      if (rng.chance(0.12) && currentBeat > 3) {
        const vehiclePortals = [
          ObstacleType.VEHICLE_PORTAL_SHIP,
          ObstacleType.VEHICLE_PORTAL_WAVE,
          ObstacleType.VEHICLE_PORTAL_BALL,
          ObstacleType.VEHICLE_PORTAL_UFO,
          ObstacleType.VEHICLE_PORTAL_ROBOT,
          ObstacleType.VEHICLE_PORTAL_SPIDER,
          ObstacleType.VEHICLE_PORTAL_CUBE,
        ];
        chunkObstacles.push({
          id: `endless_veh_${idCounter++}`,
          type: rng.choose(vehiclePortals),
          x: beatX,
          y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 40,
          width: 36,
          height: 80,
          beatIndex: currentBeat,
        });
        currentBeat += 3;
        continue;
      }

      if (difficultyTier > 2 && rng.chance(0.18) && currentBeat > 2) {
        currentGravity = currentGravity === 1 ? -1 : 1;
        chunkObstacles.push({
          id: `endless_portal_${idCounter++}`,
          type: currentGravity === -1 ? ObstacleType.GRAVITY_PORTAL_UP : ObstacleType.GRAVITY_PORTAL_DOWN,
          x: beatX,
          y: (GAME_CONSTANTS.FLOOR_Y + GAME_CONSTANTS.CEILING_Y) / 2 - 40,
          width: 36,
          height: 80,
          beatIndex: currentBeat,
        });
        currentBeat += 3;
        continue;
      }

      const roll = rng.range(0, 100);

      if (roll < 36) {
        const isTriple = difficultyTier >= 3 && rng.chance(0.3);
        const isDouble = difficultyTier >= 2 && rng.chance(0.4);

        if (isTriple && currentGravity === 1) {
          chunkObstacles.push({
            id: `endless_tri_${idCounter++}`,
            type: ObstacleType.TRIPLE_SPIKE,
            x: beatX,
            y: groundY - GAME_CONSTANTS.GRID_SIZE,
            width: GAME_CONSTANTS.GRID_SIZE * 3,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += 3.8;
        } else if (isDouble) {
          chunkObstacles.push({
            id: `endless_dbl_${idCounter++}`,
            type: ObstacleType.DOUBLE_SPIKE,
            x: beatX,
            y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
            width: GAME_CONSTANTS.GRID_SIZE * 2,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += 2.8;
        } else {
          chunkObstacles.push({
            id: `endless_spk_${idCounter++}`,
            type: currentGravity === 1 ? ObstacleType.SPIKE : ObstacleType.HANGING_SPIKE,
            x: beatX,
            y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
            width: GAME_CONSTANTS.GRID_SIZE,
            height: GAME_CONSTANTS.GRID_SIZE,
            beatIndex: currentBeat,
          });
          currentBeat += 2.2;
        }
      } else if (roll < 65) {
        // Platform
        const len = rng.choose([2, 3]);
        chunkObstacles.push({
          id: `endless_plt_${idCounter++}`,
          type: ObstacleType.STEP_PLATFORM,
          x: beatX,
          y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
          width: GAME_CONSTANTS.GRID_SIZE * len,
          height: GAME_CONSTANTS.GRID_SIZE,
          beatIndex: currentBeat,
        });
        currentBeat += len + 1;
      } else if (roll < 85) {
        // Orb jump
        chunkObstacles.push({
          id: `endless_spk_${idCounter++}`,
          type: currentGravity === 1 ? ObstacleType.SPIKE : ObstacleType.HANGING_SPIKE,
          x: beatX,
          y: currentGravity === 1 ? groundY - GAME_CONSTANTS.GRID_SIZE : groundY,
          width: GAME_CONSTANTS.GRID_SIZE,
          height: GAME_CONSTANTS.GRID_SIZE,
          beatIndex: currentBeat,
        });
        chunkObstacles.push({
          id: `endless_orb_${idCounter++}`,
          type: rng.chance(0.7) ? ObstacleType.JUMP_ORB_YELLOW : ObstacleType.JUMP_ORB_CYAN,
          x: beatX + 8,
          y: currentGravity === 1 ? groundY - 110 : groundY + 80,
          width: 36,
          height: 36,
          radius: 28,
          active: true,
          beatIndex: currentBeat,
        });
        currentBeat += 2.5;
      } else {
        // Saw
        chunkObstacles.push({
          id: `endless_saw_${idCounter++}`,
          type: ObstacleType.SAW_BLADE,
          x: beatX + 20,
          y: currentGravity === 1 ? groundY - 70 : groundY + 40,
          width: 54,
          height: 54,
          radius: 27,
          beatIndex: currentBeat,
        });
        currentBeat += 2.8;
      }
    }

    return chunkObstacles;
  }
}

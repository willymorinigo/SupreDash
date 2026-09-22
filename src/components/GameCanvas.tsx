/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AudioTrack,
  Checkpoint,
  Difficulty,
  GameMode,
  GameStats,
  LevelData,
  LevelResultReward,
  Obstacle,
  ObstacleType,
  PlayerCustomization,
  PlayerState,
  VehicleType,
} from '../types';
import { GAME_CONSTANTS, ProceduralLevelGenerator, SeededRNG } from '../game/proceduralLevelGenerator';
import { PhysicsEngine } from '../game/physics';
import { ParticleSystem } from '../game/particles';
import { GameRenderer } from '../game/renderer';
import { soundEngine } from '../audio/soundEngine';
import { GameHUD } from './GameHUD';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { VictoryModal } from './VictoryModal';

interface GameCanvasProps {
  levelData: LevelData;
  customization: PlayerCustomization;
  initialPracticeMode: boolean;
  onExitToMenu: () => void;
  onExitToWorldMap?: () => void;
  onOpenStore: () => void;
  onLevelComplete: (reward: LevelResultReward, statsUpdate: Partial<GameStats>) => void;
  onNextLevel: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelData,
  customization,
  initialPracticeMode,
  onExitToMenu,
  onExitToWorldMap,
  onOpenStore,
  onLevelComplete,
  onNextLevel,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI States
  const [gameMode, setGameMode] = useState<GameMode>('PLAYING');
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(initialPracticeMode);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [lives, setLives] = useState<number>(5);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [currentBpm] = useState<number>(levelData.bpm);
  const [bestPercentage, setBestPercentage] = useState<number>(0);
  const [victoryReward, setVictoryReward] = useState<LevelResultReward | null>(null);

  // Mutable Game References for High-Performance 60/120fps Animation Loop
  const gameStateRef = useRef({
    player: {
      x: 50,
      y: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.PLAYER_SIZE,
      vx: levelData.speed,
      vy: 0,
      width: GAME_CONSTANTS.PLAYER_SIZE,
      height: GAME_CONSTANTS.PLAYER_SIZE,
      isGrounded: true,
      isDead: false,
      gravity: 1,
      rotation: 0,
      speedMultiplier: 1.0,
      score: 0,
      coins: 0,
      orbsHit: 0,
      jumpBufferTime: 0,
      isHoldingJump: false,
      lastGroundedY: GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.PLAYER_SIZE,
    } as PlayerState,
    obstacles: [...levelData.obstacles] as Obstacle[],
    particles: new ParticleSystem(),
    renderer: null as GameRenderer | null,
    cameraOffset: 0,
    beatPulse: 0,
    checkpoints: [] as Checkpoint[],
    lastTime: 0,
    isPractice: initialPracticeMode,
    isPaused: false,
    isGameOver: false,
    isVictory: false,
    endlessChunkX: 0,
    endlessRNG: new SeededRNG(levelData.seed),
    endlessTier: 1,
    maxCoinsInLevel: levelData.obstacles.filter((o) => o.type === ObstacleType.NEON_COIN).length,
    activeKeys: new Set<string>(),
    currentLives: 5,
    maxLives: 5,
    invincibleTimer: 0,
  });

  const jumpRequestedRef = useRef<boolean>(false);

  // Initialize Canvas & Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth || window.innerWidth || 1000;
        canvas.height = containerRef.current.clientHeight || (window.innerHeight < 600 ? window.innerHeight : 600);
        gameStateRef.current.renderer = new GameRenderer(canvas);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    // Setup Sound Beat Callback for visual pulse
    soundEngine.setBeatCallback((beat, isQuarter, isBar) => {
      gameStateRef.current.beatPulse = isBar ? 1.0 : isQuarter ? 0.7 : 0.3;
    });

    // Start Music
    soundEngine.startMusic(levelData.track);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
      soundEngine.stopMusic();
    };
  }, [levelData]);

  // Restart / Reset Player Run
  const restartRun = useCallback(
    (useLastCheckpoint: boolean = false, fullResetLives: boolean = false) => {
      const state = gameStateRef.current;

      if (useLastCheckpoint && state.isPractice && state.checkpoints.length > 0) {
        // Respawn at last diamond checkpoint in Practice Mode
        const cp = state.checkpoints[state.checkpoints.length - 1];
        state.player.x = cp.x;
        state.player.y = cp.y;
        state.player.vx = cp.vx;
        state.player.vy = 0;
        state.player.gravity = cp.gravity;
        state.player.rotation = cp.rotation;
        state.player.speedMultiplier = cp.speedMultiplier;
        state.player.vehicle = cp.vehicle || VehicleType.CUBE;
        state.player.wavePoints = [];
        state.player.robotBoostTimer = 0;
        state.player.spiderTeleportFlash = 0;
        state.player.isDead = false;
        state.player.isGrounded = false;
        state.isGameOver = false;

        soundEngine.startMusic(levelData.track, cp.beatIndex * 4);
      } else {
        // Full level reset from 0% - ALWAYS starts with the Cube!
        if (fullResetLives) {
          state.currentLives = 5;
          setLives(5);
        }

        setAttemptCount((prev) => prev + 1);
        state.player.x = 50;
        state.player.y = GAME_CONSTANTS.FLOOR_Y - GAME_CONSTANTS.PLAYER_SIZE;
        state.player.vx = levelData.speed;
        state.player.vy = 0;
        state.player.gravity = 1;
        state.player.rotation = 0;
        state.player.speedMultiplier = 1.0;
        state.player.vehicle = VehicleType.CUBE; // Reset vehicle to CUBE!
        state.player.wavePoints = [];
        state.player.robotBoostTimer = 0;
        state.player.spiderTeleportFlash = 0;
        state.player.isDead = false;
        state.player.isGrounded = true;
        state.player.coins = 0;
        setCoinsCollected(0);
        state.isGameOver = false;
        state.isVictory = false;

        // Reset obstacles active and collected states
        state.obstacles = levelData.obstacles.map((o) => ({
          ...o,
          active: true,
          collected: false,
        }));

        state.particles.clear();
        soundEngine.startMusic(levelData.track, 0);
      }

      setGameMode('PLAYING');
    },
    [levelData]
  );

  // Place Checkpoint (Practice Mode)
  const handlePlaceCheckpoint = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isPractice || state.player.isDead) return;

    const secondsPerBeat = 60 / levelData.bpm;
    const currentBeat = Math.floor(state.player.x / levelData.speed / secondsPerBeat);

    const cp: Checkpoint = {
      x: state.player.x,
      y: state.player.y,
      vx: state.player.vx,
      vy: state.player.vy,
      gravity: state.player.gravity,
      rotation: state.player.rotation,
      vehicle: state.player.vehicle || VehicleType.CUBE,
      time: Date.now(),
      beatIndex: currentBeat,
      speedMultiplier: state.player.speedMultiplier,
      attemptScore: state.player.score,
    };

    state.checkpoints.push(cp);
    setCheckpoints([...state.checkpoints]);
    soundEngine.playCheckpointSound();
  }, [levelData]);

  // Delete Last Checkpoint
  const handleDeleteCheckpoint = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isPractice || state.checkpoints.length === 0) return;
    state.checkpoints.pop();
    setCheckpoints([...state.checkpoints]);
  }, []);

  // Trigger Jump / Action
  const handleJumpPress = useCallback(() => {
    jumpRequestedRef.current = true;
    const player = gameStateRef.current.player;
    player.isHoldingJump = true;
    player.jumpBufferTime = GAME_CONSTANTS.BUFFER_WINDOW_MS;
    if (player.isGrounded && !player.isDead) {
      PhysicsEngine.executeJump(player);
    }
  }, []);

  const handleJumpRelease = useCallback(() => {
    gameStateRef.current.player.isHoldingJump = false;
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleJumpPress();
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        handlePlaceCheckpoint();
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        handleDeleteCheckpoint();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        restartRun(true, false);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setGameMode((prev) => {
          if (prev === 'PLAYING') {
            soundEngine.stopMusic();
            return 'PAUSED';
          } else if (prev === 'PAUSED') {
            soundEngine.resume();
            soundEngine.startMusic(levelData.track);
            return 'PLAYING';
          }
          return prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        handleJumpRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJumpPress, handleJumpRelease, handlePlaceCheckpoint, handleDeleteCheckpoint, restartRun, levelData]);

  // Main 60/120 FPS Physics & Render Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = (timestamp: number) => {
      const state = gameStateRef.current;

      if (!state.lastTime) {
        state.lastTime = timestamp;
      }

      // Compute Delta Time with safety cap (max 50ms)
      const rawDt = (timestamp - state.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      state.lastTime = timestamp;

      // Decay beat pulse
      if (state.beatPulse > 0) {
        state.beatPulse = Math.max(0, state.beatPulse - dt * 2.8);
      }

      const isJumpTriggered = jumpRequestedRef.current || state.player.isHoldingJump;
      jumpRequestedRef.current = false;

      if (gameMode === 'PLAYING' && !state.player.isDead) {
        // 1. HIT CALLBACKS
        const onHitObstacle = (obs: Obstacle) => {
          if (obs.type === ObstacleType.FINISH_GATE) {
            // LEVEL COMPLETE VICTORY!
            state.isVictory = true;
            soundEngine.playVictorySound();
            soundEngine.stopMusic();

            const completionBase =
              levelData.difficulty === 'EASY'
                ? 100
                : levelData.difficulty === 'NORMAL'
                ? 150
                : levelData.difficulty === 'HARD'
                ? 220
                : levelData.difficulty === 'INSANE'
                ? 300
                : 450;

            const isPerfectRun = state.currentLives === 5;
            const perfectBonus = isPerfectRun ? 150 : 0;
            const attemptBonus = attemptCount === 1 ? 50 : 0;
            const levelCoinsVal = state.player.coins * 10;
            const totalEarned = levelCoinsVal + completionBase + perfectBonus + attemptBonus;

            const reward: LevelResultReward = {
              levelCoinsCollected: state.player.coins,
              completionBonus: completionBase,
              perfectBonus,
              attemptBonus,
              totalCoinsEarned: totalEarned,
              isPerfect: isPerfectRun,
            };

            setVictoryReward(reward);
            setGameMode('VICTORY');

            onLevelComplete(reward, {
              levelsCompleted: 1,
              coinsCollected: totalEarned,
              coinsBalance: totalEarned,
              highScores: { [levelData.id]: 100 },
              levelStars: { [levelData.id]: isPerfectRun ? 3 : 2 },
            });
          } else {
            // PLAYER IMPACT / CRASH
            state.player.isDead = true;
            soundEngine.playDeathSound();
            soundEngine.stopMusic();
            state.particles.emitDeathShatter(
              state.player.x + state.player.width / 2,
              state.player.y + state.player.height / 2,
              customization.primaryColor,
              customization.secondaryColor
            );

            if (state.isPractice) {
              // In practice mode, instant checkpoint respawn
              setTimeout(() => {
                restartRun(true, false);
              }, 450);
            } else {
              // Deduct 1 Life from the 5-lives pool
              state.currentLives = Math.max(0, state.currentLives - 1);
              setLives(state.currentLives);

              if (state.currentLives > 0) {
                // Still has remaining lives: auto restart from 0% with fewer lives
                setTimeout(() => {
                  restartRun(false, false);
                }, 600);
              } else {
                // 0 lives left: Game Over screen!
                state.isGameOver = true;
                setTimeout(() => {
                  setGameMode('GAMEOVER');
                }, 600);
              }
            }
          }
        };

        const onCollectCoin = (coin: Obstacle) => {
          setCoinsCollected(state.player.coins);
          state.particles.emitCoinSparkle(coin.x + 16, coin.y + 16);
        };

        // 2. UPDATE PHYSICS
        const prevGrounded = state.player.isGrounded;
        PhysicsEngine.updatePlayer(
          state.player,
          dt,
          levelData.speed,
          state.obstacles,
          onHitObstacle,
          onCollectCoin
        );

        // Jump sparks
        if (prevGrounded && !state.player.isGrounded && state.player.vy < 0) {
          state.particles.emitJumpSparks(
            state.player.x + 10,
            state.player.y + state.player.height,
            customization.primaryColor
          );
        }

        // Add trail node
        state.particles.addTrailNode(
          state.player.x + state.player.width / 2,
          state.player.y + state.player.height / 2,
          customization.primaryColor,
          state.player.width
        );

        // Emit slide particles if grounded
        if (state.player.isGrounded) {
          state.particles.emitGroundSlide(
            state.player.x,
            state.player.y + state.player.height,
            customization.secondaryColor
          );
        }

        // 3. ENDLESS MODE CHUNK GENERATION
        if (levelData.difficulty === 'ENDLESS') {
          if (state.player.x > state.endlessChunkX - 2500) {
            const nextChunkX = Math.max(state.player.x, state.endlessChunkX);
            const chunk = ProceduralLevelGenerator.generateEndlessChunk(
              nextChunkX,
              3000,
              levelData.speed,
              levelData.bpm,
              state.endlessTier,
              state.endlessRNG
            );
            state.obstacles.push(...chunk);
            state.endlessChunkX = nextChunkX + 3000;
            state.endlessTier = Math.min(5, Math.floor(state.player.x / 4000) + 1);
          }
        }

        // 4. UPDATE PROGRESS PERCENTAGE
        const currentPct = Math.min(100, (state.player.x / levelData.length) * 100);
        setProgressPercent(currentPct);
        if (currentPct > bestPercentage && !state.isPractice) {
          setBestPercentage(currentPct);
        }
      }

      // Update Particles
      state.particles.update(dt);

      // Camera Smooth Follow
      const targetCamX = state.player.x - 180;
      state.cameraOffset += (targetCamX - state.cameraOffset) * Math.min(1, dt * 15);

      // 5. RENDER CANVAS
      if (state.renderer) {
        state.renderer.render(
          state.player,
          state.obstacles,
          state.particles,
          levelData.track.themeColor,
          levelData.track.secondaryColor,
          customization,
          soundEngine.getFrequencyData(),
          state.beatPulse,
          state.cameraOffset,
          state.checkpoints,
          state.isPractice,
          progressPercent,
          levelData.landmark,
          levelData.track.synthStyle
        );
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameMode, levelData, customization, onLevelComplete, progressPercent, bestPercentage, attemptCount, restartRun]);

  const handleTogglePracticeModeInGame = () => {
    const next = !isPracticeMode;
    setIsPracticeMode(next);
    gameStateRef.current.isPractice = next;
    if (!next) {
      gameStateRef.current.checkpoints = [];
      setCheckpoints([]);
    }
  };

  return (
    <div
      ref={containerRef}
      id="game-viewport-container"
      onPointerDown={handleJumpPress}
      onPointerUp={handleJumpRelease}
      className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-black overflow-hidden select-none touch-none"
    >
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        id="neon-dash-canvas"
        className="w-full h-full max-h-[650px] object-cover cursor-pointer block"
      />

      {/* Mobile Touch Tap Cue (Subtle corner pulse on touch devices) */}
      <div className="sm:hidden absolute bottom-5 right-5 pointer-events-none opacity-40 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-orbitron text-cyan-300">
        <span>TOCA PARA SALTAR</span>
      </div>

      {/* In-Game HUD Overlay */}
      <GameHUD
        progressPercent={progressPercent}
        attempt={attemptCount}
        coins={coinsCollected}
        maxCoins={gameStateRef.current.maxCoinsInLevel}
        lives={lives}
        maxLives={5}
        track={levelData.track}
        difficulty={levelData.difficulty}
        isPracticeMode={isPracticeMode}
        checkpointsCount={checkpoints.length}
        bpm={currentBpm}
        onPause={() => {
          soundEngine.stopMusic();
          setGameMode('PAUSED');
        }}
        onExitToMenu={onExitToMenu}
        onPlaceCheckpoint={handlePlaceCheckpoint}
        onDeleteCheckpoint={handleDeleteCheckpoint}
      />

      {/* Modals */}
      {gameMode === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            soundEngine.resume();
            soundEngine.startMusic(levelData.track);
            setGameMode('PLAYING');
          }}
          onRestart={() => restartRun(false, true)}
          onExitToMenu={onExitToMenu}
          onExitToWorldMap={onExitToWorldMap}
          isPracticeMode={isPracticeMode}
          onTogglePracticeMode={handleTogglePracticeModeInGame}
        />
      )}

      {gameMode === 'GAMEOVER' && (
        <GameOverModal
          percentage={progressPercent}
          bestPercentage={bestPercentage}
          attempt={attemptCount}
          difficulty={levelData.difficulty}
          isPracticeMode={isPracticeMode}
          onRestart={() => restartRun(false, true)}
          onExitToMenu={onExitToMenu}
          onOpenStore={onOpenStore}
          onTogglePracticeMode={handleTogglePracticeModeInGame}
        />
      )}

      {gameMode === 'VICTORY' && victoryReward && (
        <VictoryModal
          track={levelData.track}
          difficulty={levelData.difficulty}
          attempt={attemptCount}
          reward={victoryReward}
          onReplay={() => restartRun(false, true)}
          onNextLevel={onNextLevel}
          onExitToMenu={onExitToMenu}
        />
      )}
    </div>
  );
};

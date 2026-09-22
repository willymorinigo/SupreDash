/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Heart,
  Crown,
  ChevronRight,
  Shield,
  Sparkles,
  Key,
  Flame,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { GameStats, PlayerCustomization } from '../types';
import { soundEngine } from '../audio/soundEngine';

export interface EmpireLevel {
  id: string;
  empireName: string;
  era: string;
  location: string;
  flag: string;
  themeColor: string;
  accentColor: string;
  bgGrad: [string, string];
  relicName: string;
  relicIcon: string;
  description: string;
  requiredRelics: number;
}

export const EMPIRE_LEVELS: EmpireLevel[] = [
  {
    id: 'roman-empire',
    empireName: 'Imperio Romano',
    era: 'Siglo I d.C.',
    location: 'Roma Antiqua',
    flag: '🏛️',
    themeColor: '#dc2626',
    accentColor: '#f59e0b',
    bgGrad: ['#2e0c0c', '#120404'],
    relicName: 'Coronas de Laurel de Oro',
    relicIcon: '🌿',
    description: 'Asciende por acueductos imperiales, arcos del Coliseo y columnas de mármol del Foro Romano.',
    requiredRelics: 7,
  },
  {
    id: 'ming-dynasty',
    empireName: 'Dinastía Ming',
    era: 'Siglo XV',
    location: 'China Imperial',
    flag: '🐉',
    themeColor: '#ea580c',
    accentColor: '#fbbf24',
    bgGrad: ['#2e1004', '#150601'],
    relicName: 'Sellos de Jade del Dragón',
    relicIcon: '🏮',
    description: 'Navega los tejados curvos de la Ciudad Prohibida, faroles colgantes y las torres de la Gran Muralla.',
    requiredRelics: 7,
  },
  {
    id: 'inca-empire',
    empireName: 'Imperio Inca (Tahuantinsuyo)',
    era: 'Siglo XV',
    location: 'Cusco & Machu Picchu',
    flag: '☀️',
    themeColor: '#ca8a04',
    accentColor: '#10b981',
    bgGrad: ['#2c1a02', '#0d2212'],
    relicName: 'Discos Solares del Inti',
    relicIcon: '☀️',
    description: 'Explora terrazas andinas de piedra labrada, cumbres nevadas del Huayna Picchu y templos solares.',
    requiredRelics: 7,
  },
  {
    id: 'ottoman-empire',
    empireName: 'Imperio Otomano',
    era: 'Siglo XVI',
    location: 'Constantinopla / Estambul',
    flag: '🕌',
    themeColor: '#0d9488',
    accentColor: '#f59e0b',
    bgGrad: ['#032622', '#1a1302'],
    relicName: 'Gemas Turquesas del Sultán',
    relicIcon: '💎',
    description: 'Asciende por las grandes cúpulas de Santa Sofía, minaretes dorados y arcos sobre el Bósforo.',
    requiredRelics: 7,
  },
  {
    id: 'european-union',
    empireName: 'Unión Europea & Alianza Global',
    era: 'Era Moderna',
    location: 'Bruselas & Metrópolis',
    flag: '🇪🇺',
    themeColor: '#2563eb',
    accentColor: '#facc15',
    bgGrad: ['#061b44', '#1b1702'],
    relicName: 'Estrellas Doradas de la Alianza',
    relicIcon: '⭐',
    description: 'Supera rascacielos de cristal, esferas colosales del Atomium y plataformas magnéticas.',
    requiredRelics: 7,
  },
];

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'moving' | 'crumbly' | 'hazard';
  vx?: number;
  minX?: number;
  maxX?: number;
}

interface RelicItem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Hazard {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'spike' | 'fire' | 'saw';
}

interface PlatformerGameProps {
  stats: GameStats;
  customization: PlayerCustomization;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onBack: () => void;
}

export const PlatformerGame: React.FC<PlatformerGameProps> = ({
  stats,
  customization,
  onUpdateStats,
  onBack,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<EmpireLevel | null>(null);
  const [lives, setLives] = useState<number>(5);
  const [relicsCollected, setRelicsCollected] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Platformer State
  const playerRef = useRef({
    x: 100,
    y: 350,
    vx: 0,
    vy: 0,
    w: 36,
    h: 36,
    isGrounded: false,
    jumpCount: 0,
    facing: 1 as 1 | -1,
    keys: { left: false, right: false, up: false, down: false },
  });

  const levelObjectsRef = useRef<{
    platforms: Platform[];
    relics: RelicItem[];
    hazards: Hazard[];
    exitGate: { x: number; y: number; w: number; h: number };
  }>({
    platforms: [],
    relics: [],
    hazards: [],
    exitGate: { x: 2600, y: 280, w: 50, h: 80 },
  });

  // Build Level Architecture
  const setupLevel = useCallback((level: EmpireLevel) => {
    playerRef.current = {
      x: 80,
      y: 380,
      vx: 0,
      vy: 0,
      w: 36,
      h: 36,
      isGrounded: false,
      jumpCount: 0,
      facing: 1,
      keys: { left: false, right: false, up: false, down: false },
    };

    const platforms: Platform[] = [
      // Base floors with gaps
      { x: 0, y: 480, w: 500, h: 120, type: 'solid' },
      { x: 620, y: 480, w: 450, h: 120, type: 'solid' },
      { x: 1200, y: 480, w: 500, h: 120, type: 'solid' },
      { x: 1850, y: 480, w: 450, h: 120, type: 'solid' },
      { x: 2450, y: 480, w: 500, h: 120, type: 'solid' },
      { x: 3100, y: 480, w: 550, h: 120, type: 'solid' },
      { x: 3800, y: 480, w: 850, h: 120, type: 'solid' },

      // Section 1: Entrance & Aqueducts (0 - 900px)
      { x: 180, y: 390, w: 120, h: 22, type: 'solid' },
      { x: 340, y: 310, w: 130, h: 22, type: 'solid' },
      { x: 520, y: 350, w: 110, h: 22, type: 'moving', vx: 1.8, minX: 480, maxX: 640 },
      { x: 700, y: 280, w: 140, h: 22, type: 'solid' },
      { x: 900, y: 230, w: 140, h: 22, type: 'solid' },

      // Section 2: High Terrace Ascent (900 - 1800px)
      { x: 1100, y: 330, w: 100, h: 22, type: 'moving', vx: -2.0, minX: 1060, maxX: 1220 },
      { x: 1280, y: 390, w: 130, h: 22, type: 'solid' },
      { x: 1460, y: 310, w: 140, h: 22, type: 'solid' },
      { x: 1640, y: 240, w: 130, h: 22, type: 'solid' },
      { x: 1820, y: 340, w: 120, h: 22, type: 'moving', vx: 2.2, minX: 1760, maxX: 1940 },

      // Section 3: Central Temple & Spire (1800 - 2700px)
      { x: 2020, y: 390, w: 140, h: 22, type: 'solid' },
      { x: 2200, y: 310, w: 130, h: 22, type: 'solid' },
      { x: 2380, y: 230, w: 140, h: 22, type: 'solid' },
      { x: 2560, y: 170, w: 120, h: 22, type: 'solid' },
      { x: 2740, y: 260, w: 110, h: 22, type: 'moving', vx: -2.2, minX: 2680, maxX: 2860 },

      // Section 4: Great Bridge of the Dynasty (2700 - 3600px)
      { x: 2920, y: 360, w: 140, h: 22, type: 'solid' },
      { x: 3120, y: 300, w: 130, h: 22, type: 'solid' },
      { x: 3300, y: 220, w: 140, h: 22, type: 'solid' },
      { x: 3480, y: 290, w: 120, h: 22, type: 'moving', vx: 2.4, minX: 3420, maxX: 3620 },
      { x: 3680, y: 370, w: 140, h: 22, type: 'solid' },

      // Section 5: The Imperial Citadel Gate (3600 - 4500px)
      { x: 3880, y: 310, w: 140, h: 22, type: 'solid' },
      { x: 4060, y: 240, w: 150, h: 22, type: 'solid' },
      { x: 4260, y: 320, w: 160, h: 22, type: 'solid' },
      { x: 4450, y: 380, w: 200, h: 22, type: 'solid' },
    ];

    const relics: RelicItem[] = [
      { id: 1, x: 390, y: 260, collected: false },
      { id: 2, x: 950, y: 180, collected: false },
      { id: 3, x: 1690, y: 190, collected: false },
      { id: 4, x: 2610, y: 120, collected: false },
      { id: 5, x: 3350, y: 170, collected: false },
      { id: 6, x: 4110, y: 190, collected: false },
      { id: 7, x: 4320, y: 270, collected: false },
    ];

    const hazards: Hazard[] = [
      { x: 500, y: 560, w: 120, h: 40, type: 'spike' },
      { x: 1070, y: 560, w: 130, h: 40, type: 'spike' },
      { x: 1530, y: 290, w: 30, h: 20, type: 'spike' },
      { x: 1700, y: 560, w: 150, h: 40, type: 'spike' },
      { x: 2300, y: 560, w: 150, h: 40, type: 'spike' },
      { x: 2440, y: 210, w: 30, h: 20, type: 'spike' },
      { x: 2950, y: 560, w: 150, h: 40, type: 'spike' },
      { x: 3650, y: 560, w: 150, h: 40, type: 'spike' },
      { x: 3940, y: 290, w: 30, h: 20, type: 'spike' },
    ];

    levelObjectsRef.current = {
      platforms,
      relics,
      hazards,
      exitGate: { x: 4520, y: 300, w: 60, h: 80 },
    };

    setLives(5);
    setRelicsCollected(0);
    setIsVictory(false);
    setIsGameOver(false);
  }, []);

  // Keyboard Event Listeners for WASD / Arrow Keys
  useEffect(() => {
    if (!selectedLevel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = playerRef.current.keys;
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft') {
        keys.left = true;
        playerRef.current.facing = -1;
      }
      if (key === 'd' || key === 'arrowright') {
        keys.right = true;
        playerRef.current.facing = 1;
      }
      if (key === 'w' || key === 'arrowup' || key === ' ') {
        if (!keys.up) {
          keys.up = true;
          handleJump();
        }
      }
      if (key === 's' || key === 'arrowdown') {
        keys.down = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = playerRef.current.keys;
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft') keys.left = false;
      if (key === 'd' || key === 'arrowright') keys.right = false;
      if (key === 'w' || key === 'arrowup' || key === ' ') keys.up = false;
      if (key === 's' || key === 'arrowdown') keys.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedLevel]);

  const handleJump = () => {
    const p = playerRef.current;
    if (p.isGrounded) {
      p.vy = -620; // Smooth responsive jump
      p.isGrounded = false;
      p.jumpCount = 1;
      soundEngine.playJumpSound(1.0);
    } else if (p.jumpCount === 1) {
      p.vy = -560; // Double jump!
      p.jumpCount = 2;
      soundEngine.playJumpSound(1.3);
    }
  };

  // Main Platformer Physics & Render Loop
  useEffect(() => {
    if (!selectedLevel || isVictory || isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let cameraX = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      const p = playerRef.current;
      const { platforms, relics, hazards, exitGate } = levelObjectsRef.current;

      // 1. HORIZONTAL PHYSICS (WASD Smooth Acceleration)
      const accel = 1800;
      const maxSpeed = 380;
      const friction = 1400;

      if (p.keys.left) {
        p.vx = Math.max(-maxSpeed, p.vx - accel * dt);
      } else if (p.keys.right) {
        p.vx = Math.min(maxSpeed, p.vx + accel * dt);
      } else {
        if (p.vx > 0) p.vx = Math.max(0, p.vx - friction * dt);
        else if (p.vx < 0) p.vx = Math.min(0, p.vx + friction * dt);
      }

      p.x += p.vx * dt;

      // 2. VERTICAL PHYSICS (Gravity)
      const gravity = 1600;
      p.vy += gravity * dt;
      p.vy = Math.min(p.vy, 950);
      p.y += p.vy * dt;

      // 3. MOVING PLATFORMS UPDATE
      platforms.forEach((plat) => {
        if (plat.type === 'moving' && plat.vx && plat.minX !== undefined && plat.maxX !== undefined) {
          plat.x += plat.vx;
          if (plat.x <= plat.minX || plat.x >= plat.maxX) {
            plat.vx *= -1;
          }
        }
      });

      // 4. PLATFORM COLLISIONS
      p.isGrounded = false;
      platforms.forEach((plat) => {
        // AABB Collision check
        if (
          p.x + p.w > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + p.h >= plat.y &&
          p.y + p.h <= plat.y + 24 &&
          p.vy >= 0
        ) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.isGrounded = true;
          p.jumpCount = 0;

          if (plat.type === 'moving' && plat.vx) {
            p.x += plat.vx;
          }
        }
      });

      // 5. HAZARDS COLLISION
      hazards.forEach((h) => {
        if (
          p.x + p.w > h.x &&
          p.x < h.x + h.w &&
          p.y + p.h > h.y &&
          p.y < h.y + h.h
        ) {
          // Take Damage / Respawn
          handlePlayerHit();
        }
      });

      // Fall out of bounds
      if (p.y > 600) {
        handlePlayerHit();
      }

      // 6. RELIC PICKUPS
      relics.forEach((r) => {
        if (!r.collected) {
          const dist = Math.hypot(p.x + p.w / 2 - r.x, p.y + p.h / 2 - r.y);
          if (dist < 32) {
            r.collected = true;
            soundEngine.playCoinSound();
            setRelicsCollected((prev) => {
              const next = prev + 1;
              return next;
            });
            onUpdateStats((prev) => ({
              ...prev,
              coinsBalance: prev.coinsBalance + 30,
              coinsCollected: prev.coinsCollected + 1,
            }));
          }
        }
      });

      // 7. EXIT GATE VICTORY CHECK
      const collectedCount = relics.filter((r) => r.collected).length;
      if (
        collectedCount >= selectedLevel.requiredRelics &&
        p.x + p.w > exitGate.x &&
        p.x < exitGate.x + exitGate.w &&
        p.y + p.h > exitGate.y
      ) {
        setIsVictory(true);
        soundEngine.playVictorySound();
        onUpdateStats((prev) => ({
          ...prev,
          coinsBalance: prev.coinsBalance + 250,
          diamondsBalance: prev.diamondsBalance + 5,
          levelsCompleted: prev.levelsCompleted + 1,
        }));
      }

      // 8. CAMERA SMOOTH TRACKING
      const targetCamX = p.x - canvas.width * 0.35;
      cameraX += (targetCamX - cameraX) * 0.1;
      cameraX = Math.max(0, Math.min(cameraX, 4650 - canvas.width));

      // 9. RENDER SCENE
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky / Empire Atmosphere
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, selectedLevel.bgGrad[0]);
      skyGrad.addColorStop(1, selectedLevel.bgGrad[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // CULTURAL BACKGROUND SCENERY (Parallax Layer 1 & 2)
      ctx.save();
      const parallaxCamX = cameraX * 0.35; // Soft parallax
      ctx.translate(-parallaxCamX, 0);

      if (selectedLevel.id === 'roman-empire') {
        // ROMAN EMPIRE CULTURAL BACKGROUND: Colosseum arcades, marble columns, aqueducts, SPQR banners
        // 1. Distant hills and Roman Aqueducts
        ctx.fillStyle = 'rgba(180, 83, 9, 0.12)';
        for (let i = 0; i < 20; i++) {
          const aqX = i * 260;
          // Aqueduct arches
          ctx.fillRect(aqX, 160, 240, 20); // Top water channel
          ctx.fillRect(aqX + 10, 180, 25, 120); // Column 1
          ctx.fillRect(aqX + 120, 180, 25, 120); // Column 2
          ctx.fillRect(aqX + 215, 180, 25, 120); // Column 3
          // Arch semicircles
          ctx.beginPath();
          ctx.arc(aqX + 72, 180, 40, Math.PI, 0);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(aqX + 175, 180, 40, Math.PI, 0);
          ctx.fill();
        }

        // 2. Colosseum monumental arcades & Roman temple facade
        for (let i = 0; i < 12; i++) {
          const colX = i * 420 + 80;
          // Colosseum curved wall segment
          ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
          ctx.fillRect(colX, 200, 320, 260);
          // Windows / Archways
          ctx.fillStyle = 'rgba(18, 4, 4, 0.6)';
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 5; c++) {
              ctx.fillRect(colX + 25 + c * 58, 220 + r * 70, 36, 45);
              ctx.beginPath();
              ctx.arc(colX + 43 + c * 58, 220 + r * 70, 18, Math.PI, 0);
              ctx.fill();
            }
          }

          // SPQR Red & Gold Imperial Banner
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(colX + 150, 140, 36, 70);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SPQR', colX + 168, 175);
          ctx.fillText('🦅', colX + 168, 160);
        }
      } else if (selectedLevel.id === 'ming-dynasty') {
        // MING DYNASTY CULTURAL BACKGROUND: Misty Karst mountains, Pagodas, Great Wall towers, Red Lanterns
        // 1. Giant Glowing Moon
        ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
        ctx.beginPath();
        ctx.arc(500, 100, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
        ctx.beginPath();
        ctx.arc(500, 100, 45, 0, Math.PI * 2);
        ctx.fill();

        // 2. Karst mountain spires
        for (let i = 0; i < 16; i++) {
          const kx = i * 280;
          ctx.fillStyle = 'rgba(234, 88, 12, 0.12)';
          ctx.beginPath();
          ctx.moveTo(kx - 60, 480);
          ctx.lineTo(kx + 80, 120 + (i % 3) * 50);
          ctx.lineTo(kx + 220, 480);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Pagodas with curved eaves & Great Wall towers
        for (let i = 0; i < 10; i++) {
          const px = i * 440 + 60;
          ctx.fillStyle = 'rgba(234, 88, 12, 0.22)';
          // 3-tiered pagoda
          for (let tier = 0; tier < 3; tier++) {
            const ty = 220 + tier * 55;
            const tw = 160 - tier * 35;
            ctx.fillRect(px + (160 - tw) / 2 + 10, ty, tw, 45);
            // Curved eave
            ctx.beginPath();
            ctx.moveTo(px + (160 - tw) / 2 - 15, ty);
            ctx.quadraticCurveTo(px + 90, ty - 15, px + (160 - tw) / 2 + tw + 35, ty);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#f59e0b';
            ctx.stroke();
          }
          // Spire
          ctx.fillRect(px + 86, 175, 8, 45);

          // Hanging red paper lanterns with gentle sway
          const lanternSway = Math.sin(time * 0.003 + i) * 6;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(px + 20 + lanternSway, 320, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.fillRect(px + 16 + lanternSway, 314, 8, 12);
        }
      } else if (selectedLevel.id === 'inca-empire') {
        // INCA EMPIRE CULTURAL BACKGROUND: Andean mountain peaks, Machu Picchu stone terraces, Inti Golden Sun
        // 1. Inti Sun radiating rays
        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        ctx.beginPath();
        ctx.arc(420, 90, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(234, 179, 8, 0.7)';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☀️', 420, 100);

        // 2. Snow-capped Andean Peaks
        for (let i = 0; i < 14; i++) {
          const mx = i * 320;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
          ctx.beginPath();
          ctx.moveTo(mx - 80, 480);
          ctx.lineTo(mx + 110, 80 + (i % 2) * 60);
          ctx.lineTo(mx + 300, 480);
          ctx.closePath();
          ctx.fill();

          // Snow cap
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.moveTo(mx + 70, 130 + (i % 2) * 60);
          ctx.lineTo(mx + 110, 80 + (i % 2) * 60);
          ctx.lineTo(mx + 150, 130 + (i % 2) * 60);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Stepped Agricultural Terraces (Andenes)
        for (let i = 0; i < 18; i++) {
          const tx = i * 240;
          for (let step = 0; step < 4; step++) {
            ctx.fillStyle = 'rgba(202, 138, 4, 0.2)';
            ctx.fillRect(tx + step * 30, 300 + step * 35, 200, 30);
            ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
            ctx.fillRect(tx + step * 30, 300 + step * 35, 200, 4); // Green grass ledge
          }
        }
      } else if (selectedLevel.id === 'ottoman-empire') {
        // OTTOMAN EMPIRE CULTURAL BACKGROUND: Hagia Sophia domes, slender minarets, Bosphorus sunset & galleons
        // 1. Domes and Minarets
        for (let i = 0; i < 12; i++) {
          const ox = i * 380 + 40;

          // Grand Central Dome
          ctx.fillStyle = 'rgba(13, 148, 136, 0.25)';
          ctx.beginPath();
          ctx.arc(ox + 160, 240, 75, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(ox + 85, 240, 150, 160);

          // Golden Crescent Finial on top
          ctx.fillStyle = '#fbbf24';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('☪', ox + 160, 160);

          // 2 Slender Pencil Minarets with pointed cones
          ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
          ctx.fillRect(ox + 50, 150, 16, 250); // Left minaret
          ctx.fillRect(ox + 254, 150, 16, 250); // Right minaret

          // Minaret Balconies
          ctx.fillRect(ox + 44, 200, 28, 8);
          ctx.fillRect(ox + 248, 200, 28, 8);

          // Minaret conical spires
          ctx.beginPath();
          ctx.moveTo(ox + 50, 150);
          ctx.lineTo(ox + 58, 115);
          ctx.lineTo(ox + 66, 150);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(ox + 254, 150);
          ctx.lineTo(ox + 262, 115);
          ctx.lineTo(ox + 270, 150);
          ctx.fill();

          // Traditional Ottoman Wooden Galleon / Dhow on water
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.moveTo(ox + 20, 440);
          ctx.lineTo(ox + 90, 440);
          ctx.lineTo(ox + 75, 460);
          ctx.lineTo(ox + 35, 460);
          ctx.closePath();
          ctx.fill();
          // Sails
          ctx.fillRect(ox + 55, 400, 3, 40);
          ctx.beginPath();
          ctx.moveTo(ox + 58, 405);
          ctx.lineTo(ox + 85, 425);
          ctx.lineTo(ox + 58, 435);
          ctx.fill();
        }
      } else if (selectedLevel.id === 'european-union') {
        // EUROPEAN UNION CULTURAL BACKGROUND: Atomium of Brussels, Modern Towers, 12 Golden Stars Ring
        // 1. Constellation Ring of 12 Golden Stars
        ctx.save();
        ctx.translate(500, 130);
        ctx.rotate(time * 0.0008);
        for (let s = 0; s < 12; s++) {
          const angle = (s * Math.PI * 2) / 12;
          const starX = Math.cos(angle) * 75;
          const starY = Math.sin(angle) * 75;
          ctx.fillStyle = '#facc15';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', starX, starY);
        }
        ctx.restore();

        // 2. Giant Atomium Structure (Brussels)
        for (let i = 0; i < 8; i++) {
          const atX = i * 550 + 120;
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
          ctx.lineWidth = 4;

          // Spheres positions
          const cx = atX + 150;
          const cy = 250;
          const spheres = [
            { x: cx, y: cy },
            { x: cx - 60, y: cy - 60 },
            { x: cx + 60, y: cy - 60 },
            { x: cx - 60, y: cy + 60 },
            { x: cx + 60, y: cy + 60 },
            { x: cx, y: cy - 100 },
          ];

          // Connecting tubes
          spheres.forEach((sp) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(sp.x, sp.y);
            ctx.stroke();
          });

          // Draw metallic spheres
          spheres.forEach((sp) => {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });

          // Modern Glass High-rises with lit windows
          ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
          ctx.fillRect(atX + 300, 160, 120, 320);
          ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
          for (let winR = 0; winR < 10; winR++) {
            for (let winC = 0; winC < 4; winC++) {
              if ((winR + winC + i) % 2 === 0) {
                ctx.fillRect(atX + 315 + winC * 24, 180 + winR * 26, 12, 14);
              }
            }
          }
        }
      }

      ctx.restore();

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Render Platforms
      platforms.forEach((plat) => {
        // Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(plat.x + 4, plat.y + 4, plat.w, plat.h);

        // Platform Body
        const pGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
        pGrad.addColorStop(0, '#334155');
        pGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = pGrad;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Top Grass / Marble Cap
        ctx.fillStyle = selectedLevel.themeColor;
        ctx.fillRect(plat.x, plat.y, plat.w, 4);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Render Hazards
      hazards.forEach((h) => {
        ctx.fillStyle = '#ef4444';
        const spikes = Math.floor(h.w / 16);
        for (let s = 0; s < spikes; s++) {
          const sx = h.x + s * 16;
          ctx.beginPath();
          ctx.moveTo(sx, h.y + h.h);
          ctx.lineTo(sx + 8, h.y);
          ctx.lineTo(sx + 16, h.y + h.h);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Render Relics (Laurel, Jade, Inti, Gem, Euro Star)
      relics.forEach((r) => {
        if (!r.collected) {
          const floatY = r.y + Math.sin(time * 0.005 + r.id) * 6;

          // Glow Halo
          ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
          ctx.beginPath();
          ctx.arc(r.x, floatY, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(selectedLevel.relicIcon, r.x, floatY);
        }
      });

      // Render Exit Gate
      ctx.fillStyle = collectedCount >= selectedLevel.requiredRelics ? '#10b981' : '#64748b';
      ctx.fillRect(exitGate.x, exitGate.y, exitGate.w, exitGate.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(exitGate.x, exitGate.y, exitGate.w, exitGate.h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(collectedCount >= selectedLevel.requiredRelics ? '🚪' : '🔒', exitGate.x + exitGate.w / 2, exitGate.y + exitGate.h / 2);

      // Render Player Character with Customization
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);

      // 3D Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, p.h / 2 + 2, p.w * 0.45, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cube / Runner Body
      ctx.fillStyle = customization.primaryColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 6);
      ctx.fill();
      ctx.stroke();

      // Face direction indicator
      ctx.fillStyle = customization.secondaryColor;
      const eyeX = p.facing === 1 ? 4 : -12;
      ctx.fillRect(eyeX, -8, 8, 8);
      ctx.fillRect(eyeX + 10 * p.facing, -8, 8, 8);

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedLevel, isVictory, isGameOver, customization, onUpdateStats]);

  const handlePlayerHit = () => {
    soundEngine.playDeathSound();
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setIsGameOver(true);
      } else {
        // Respawn at starting position
        playerRef.current.x = 80;
        playerRef.current.y = 380;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
      }
      return next;
    });
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#070b16] text-white flex flex-col justify-between select-none overflow-hidden">
      {/* LEVEL SELECT SCREEN */}
      {!selectedLevel ? (
        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-between p-4 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <button
              id="platformer-back-to-menu-btn"
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/20 transition-all cursor-pointer font-orbitron text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>VOLVER AL MENÚ</span>
            </button>

            <div className="text-center">
              <h1 className="text-xl sm:text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-red-400 flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span>MODO PLATAFORMA: IMPERIOS & DINASTÍAS</span>
              </h1>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Control Total con <strong>W, A, S, D</strong> (o Flechas). ¡Explora 5 Grandes Imperios de la Historia!
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-yellow-500/40">
              <span className="text-xs font-mono text-yellow-400 font-bold">5 NIVELES ÉPICOS</span>
            </div>
          </div>

          {/* Level Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
            {EMPIRE_LEVELS.map((level, idx) => (
              <div
                key={level.id}
                onClick={() => {
                  soundEngine.playOrbSound('yellow');
                  setSelectedLevel(level);
                  setupLevel(level);
                }}
                className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-white/15 hover:border-amber-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
              >
                {/* Accent glow corner */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-20 group-hover:opacity-40 transition-all rounded-full blur-2xl pointer-events-none"
                  style={{ background: level.themeColor }}
                />

                <div className="flex items-start justify-between gap-2 z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{level.flag}</span>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        {level.era} • {level.location}
                      </span>
                      <h3 className="font-orbitron font-black text-lg text-white group-hover:text-amber-300 transition-colors">
                        {level.empireName}
                      </h3>
                    </div>
                  </div>
                  <span className="font-orbitron font-bold text-xs bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                    #{idx + 1}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 my-4 leading-relaxed z-10">{level.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 z-10">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300">
                    <span>{level.relicIcon}</span>
                    <span>5 {level.relicName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-orbitron font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>JUGAR</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls Reminder Box */}
          <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 rounded bg-black/80 border border-white/20 font-bold text-yellow-400">W</kbd>
              <span>/ Espacio = Salto & Doble Salto</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 rounded bg-black/80 border border-white/20 font-bold text-cyan-400">A</kbd>
              <kbd className="px-2.5 py-1 rounded bg-black/80 border border-white/20 font-bold text-cyan-400">D</kbd>
              <span>= Mover Izquierda / Derecha</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 rounded bg-black/80 border border-white/20 font-bold text-emerald-400">S</kbd>
              <span>= Bajar / Agacharse</span>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE PLATFORMER GAMEPLAY VIEW */
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Top HUD */}
          <div className="absolute top-0 inset-x-0 p-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                id="platformer-exit-level-btn"
                onClick={() => setSelectedLevel(null)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/20 text-xs font-orbitron font-bold cursor-pointer backdrop-blur-md"
              >
                <ArrowLeft size={16} />
                <span>Salir</span>
              </button>

              <div className="flex items-center gap-2 bg-black/70 px-3.5 py-1.5 rounded-xl border border-white/20 backdrop-blur-md">
                <span className="text-xl">{selectedLevel.flag}</span>
                <span className="font-orbitron font-bold text-sm text-white">{selectedLevel.empireName}</span>
              </div>
            </div>

            {/* Lives & Relics Stats */}
            <div className="flex items-center gap-3 pointer-events-auto">
              {/* Relics collected */}
              <div className="flex items-center gap-2 bg-black/70 px-3.5 py-1.5 rounded-xl border border-yellow-500/40 backdrop-blur-md">
                <span className="text-lg">{selectedLevel.relicIcon}</span>
                <span className="font-orbitron font-bold text-sm text-yellow-300">
                  {relicsCollected} / {selectedLevel.requiredRelics}
                </span>
              </div>

              {/* 5 Hearts */}
              <div className="flex items-center gap-1 bg-black/70 px-3 py-1.5 rounded-xl border border-rose-500/40 backdrop-blur-md">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Heart
                    key={idx}
                    size={16}
                    className={idx < lives ? 'text-rose-500 fill-rose-500' : 'text-zinc-600'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="w-full flex-1 relative bg-black flex items-center justify-center">
            <canvas ref={canvasRef} width={1000} height={600} className="w-full h-full max-h-[600px] object-contain" />
          </div>

          {/* Virtual Controls for Mobile / Touch */}
          <div className="absolute bottom-4 inset-x-0 px-4 sm:px-8 flex justify-between items-center pointer-events-none z-30 select-none touch-none">
            {/* Left / Right buttons */}
            <div className="flex gap-3 pointer-events-auto">
              <button
                id="platformer-mobile-left"
                onPointerDown={(e) => {
                  e.preventDefault();
                  playerRef.current.keys.left = true;
                  playerRef.current.facing = -1;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  playerRef.current.keys.left = false;
                }}
                onPointerLeave={() => {
                  playerRef.current.keys.left = false;
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/80 active:bg-cyan-600 border border-cyan-500/40 text-cyan-300 font-bold text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                ◀
              </button>
              <button
                id="platformer-mobile-right"
                onPointerDown={(e) => {
                  e.preventDefault();
                  playerRef.current.keys.right = true;
                  playerRef.current.facing = 1;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  playerRef.current.keys.right = false;
                }}
                onPointerLeave={() => {
                  playerRef.current.keys.right = false;
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/80 active:bg-cyan-600 border border-cyan-500/40 text-cyan-300 font-bold text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                ▶
              </button>
            </div>

            {/* Jump button */}
            <button
              id="platformer-mobile-jump"
              onPointerDown={(e) => {
                e.preventDefault();
                handleJump();
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 active:from-amber-400 active:to-yellow-300 border-2 border-white/80 text-black font-black text-2xl flex items-center justify-center shadow-xl active:scale-95 pointer-events-auto transition-transform cursor-pointer"
            >
              ⬆
            </button>
          </div>

          {/* VICTORY MODAL */}
          {isVictory && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center flex flex-col items-center gap-4 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-3xl">
                  🏆
                </div>

                <h2 className="font-orbitron font-black text-2xl text-emerald-400">¡NIVEL COMPLETADO!</h2>
                <p className="text-xs text-zinc-300">
                  Has reunido todas las reliquias históricas del <strong>{selectedLevel.empireName}</strong> y cruzado la gran puerta.
                </p>

                <div className="flex gap-4 my-2">
                  <div className="bg-black/60 px-4 py-2 rounded-xl border border-yellow-500/40">
                    <span className="text-[10px] text-zinc-400 block font-mono">RECOMPENSA</span>
                    <span className="font-orbitron font-bold text-yellow-300 text-lg">+250 Monedas</span>
                  </div>
                  <div className="bg-black/60 px-4 py-2 rounded-xl border border-blue-400/40">
                    <span className="text-[10px] text-zinc-400 block font-mono">BONUS</span>
                    <span className="font-orbitron font-bold text-blue-300 text-lg">+5 Diamantes 💎</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setupLevel(selectedLevel)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-orbitron text-xs font-bold cursor-pointer transition-all border border-white/20"
                  >
                    REPETIR
                  </button>
                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold cursor-pointer transition-all shadow-lg"
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER MODAL */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center flex flex-col items-center gap-4 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-3xl">
                  💀
                </div>

                <h2 className="font-orbitron font-black text-2xl text-rose-400">FIN DE LA EXPEDICIÓN</h2>
                <p className="text-xs text-zinc-300">
                  Te has quedado sin corazones en el <strong>{selectedLevel.empireName}</strong>.
                </p>

                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-orbitron text-xs font-bold cursor-pointer transition-all border border-white/20"
                  >
                    SALIR
                  </button>
                  <button
                    onClick={() => setupLevel(selectedLevel)}
                    className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-orbitron text-xs font-bold cursor-pointer transition-all shadow-lg"
                  >
                    REINTENTAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

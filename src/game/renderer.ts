/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GAME_CONSTANTS } from './proceduralLevelGenerator';
import { Checkpoint, LandmarkType, Obstacle, ObstacleType, PlayerCustomization, PlayerState, VehicleType } from '../types';
import { ParticleSystem } from './particles';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
  }

  public render(
    player: PlayerState,
    obstacles: Obstacle[],
    particles: ParticleSystem,
    themeColor: string,
    secondaryColor: string,
    customization: PlayerCustomization,
    audioFrequencyData: Uint8Array,
    beatPulse: number, // 0.0 to 1.0 peak
    cameraOffset: number,
    checkpoints: Checkpoint[],
    isPracticeMode: boolean,
    progressPercent: number,
    landmark?: LandmarkType,
    synthStyle?: string
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. SKY & CELESTIAL ATMOSPHERE (Layer 0 - Slowest Parallax)
    this.drawCitySky(width, height, landmark, themeColor, secondaryColor, beatPulse);

    // 2. DEEP PARALLAX: Distant Mountains, Horizons & Skyline Silhouettes with Atmospheric Haze (Layer 1: 0.035x)
    this.drawDistantCitySkyline(width, height, cameraOffset, landmark, themeColor, secondaryColor, audioFrequencyData, beatPulse);

    // 3. MIDGROUND PARALLAX: Architectural City Blocks & Buildings with Windows (Layer 2: 0.08x)
    this.drawMidgroundCityscape(width, height, cameraOffset, landmark, themeColor, secondaryColor, beatPulse);

    // 4. LANDMARK PARALLAX: Main City Cultural Monument (Layer 3: 0.18x)
    this.drawCityLandmark(width, height, cameraOffset, landmark, themeColor, secondaryColor, beatPulse);

    // 5. ATMOSPHERIC DEPTH SEPARATION VEIL (Separates background city layers from the active gameplay plane)
    this.drawDepthSeparationVeil(width, height, themeColor);

    // 6. CITY ROAD & PAVEMENT (Asphalt, Cobblestones, Copacabana Wave Mosaic, Sandstone)
    this.drawCityGroundAndCeiling(width, height, cameraOffset, landmark, themeColor, secondaryColor, beatPulse);

    // Atmospheric particle emitter updates
    if (synthStyle === 'sakura') {
      particles.emitAtmosphericPetals(width, height, 'sakura');
    } else if (synthStyle === 'samba' || synthStyle === 'cumbia') {
      particles.emitAtmosphericPetals(width, height, 'confetti');
    } else if (synthStyle === 'darkwave' || synthStyle === 'cyberpunk' || synthStyle === 'techno') {
      particles.emitAtmosphericPetals(width, height, 'ember');
    }

    // Apply Camera Translation for Level Gameplay Elements
    ctx.save();
    ctx.translate(-cameraOffset, 0);

    // 7. CHECKPOINTS (Practice Mode)
    if (isPracticeMode) {
      this.drawCheckpoints(checkpoints, beatPulse);
    }

    // 8. OBSTACLES (Solid, crisp, 3D beveled obstacles with realistic drop-shadows & contact shadows)
    this.drawObstacles(obstacles, cameraOffset, width, themeColor, secondaryColor, beatPulse);

    // 9. PARTICLES & TRAIL
    this.drawParticlesAndTrail(particles, customization);

    // 10. WAVE POLYLINE (If wave vehicle)
    if (player.vehicle === VehicleType.WAVE && player.wavePoints && player.wavePoints.length > 1) {
      this.drawWavePath(player, customization, beatPulse);
    }

    // 11. PLAYER (With 3D drop-shadow & ground contact shadow)
    if (!player.isDead) {
      this.drawPlayerVehicle(player, customization, beatPulse);
    }

    ctx.restore(); // Restore Camera

    // 12. FOREGROUND STREET CURBS & NEAR PARALLAX (Layer 7: 1.15x fast parallax in the extreme near plane)
    this.drawForegroundNearElements(width, height, cameraOffset);

    // 13. NATURAL VIGNETTE & SUBTLE CINEMATIC LIGHTING
    this.drawAtmosphericOverlay(width, height, beatPulse, themeColor);
  }

  // ==========================================
  // 1. SKY & ATMOSPHERE (Layer 0)
  // ==========================================
  private drawCitySky(
    w: number,
    h: number,
    landmark?: LandmarkType,
    themeColor: string = '#3b82f6',
    secondaryColor: string = '#f59e0b',
    beatPulse: number = 0
  ) {
    const ctx = this.ctx;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.FLOOR_Y);

    switch (landmark) {
      case 'obelisk_buenos_aires': {
        // Buenos Aires Dusk: Celeste cielo argentino, sol dorado y horizonte rosado
        skyGrad.addColorStop(0, '#0f2b48');
        skyGrad.addColorStop(0.45, '#1e4d79');
        skyGrad.addColorStop(0.75, '#5c768d');
        skyGrad.addColorStop(1, '#d97736');
        break;
      }
      case 'favelas_rio':
      case 'cristo_redentor': {
        // Rio de Janeiro Tropical Sunset: Océano Atlántico y cielo cálido
        skyGrad.addColorStop(0, '#0c2e3d');
        skyGrad.addColorStop(0.4, '#1b536b');
        skyGrad.addColorStop(0.75, '#ea580c');
        skyGrad.addColorStop(1, '#facc15');
        break;
      }
      case 'sagrada_familia': {
        // Barcelona Mediterranean Sunset: Ámbar, terracota y cielo ibérico
        skyGrad.addColorStop(0, '#1c1b3a');
        skyGrad.addColorStop(0.45, '#4a2545');
        skyGrad.addColorStop(0.8, '#c2410c');
        skyGrad.addColorStop(1, '#fb923c');
        break;
      }
      case 'eiffel': {
        // Paris Twilight: Azul profundo parisino, lavanda y luces doradas
        skyGrad.addColorStop(0, '#111827');
        skyGrad.addColorStop(0.5, '#2e294e');
        skyGrad.addColorStop(0.85, '#6b4c6e');
        skyGrad.addColorStop(1, '#e0a96d');
        break;
      }
      case 'fuji_torii':
      case 'torii': {
        // Tokyo / Japan Evening: Azul noche con degradé rosa sakura suave
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.45, '#251e3e');
        skyGrad.addColorStop(0.8, '#833ab4');
        skyGrad.addColorStop(1, '#fd1d1d');
        break;
      }
      case 'statue_liberty': {
        // New York Manhattan Twilight: Azul acero y horizonte ámbar
        skyGrad.addColorStop(0, '#0b132b');
        skyGrad.addColorStop(0.5, '#1c2541');
        skyGrad.addColorStop(0.85, '#3a506b');
        skyGrad.addColorStop(1, '#e07a5f');
        break;
      }
      case 'colosseum':
      case 'parthenon': {
        // Roma / Italia Golden Hour: Terracota cálido y violeta suave
        skyGrad.addColorStop(0, '#1a1423');
        skyGrad.addColorStop(0.45, '#3d2645');
        skyGrad.addColorStop(0.8, '#832161');
        skyGrad.addColorStop(1, '#da4167');
        break;
      }
      case 'big_ben': {
        // London Atmospheric Twilight: Azul marino real y farolas inglesas
        skyGrad.addColorStop(0, '#0a1128');
        skyGrad.addColorStop(0.5, '#1c2d5a');
        skyGrad.addColorStop(0.85, '#3e517a');
        skyGrad.addColorStop(1, '#d4af37');
        break;
      }
      case 'pyramid':
      case 'mayan_pyramid': {
        // Cairo / Maya Sunset: Ocre desértico, arena dorada y cielo crepuscular
        skyGrad.addColorStop(0, '#1c100b');
        skyGrad.addColorStop(0.45, '#451a03');
        skyGrad.addColorStop(0.8, '#9a3412');
        skyGrad.addColorStop(1, '#f59e0b');
        break;
      }
      case 'machu_picchu': {
        // Cusco / Andes: Azul andino profundo y cumbres nevadas
        skyGrad.addColorStop(0, '#082f49');
        skyGrad.addColorStop(0.5, '#075985');
        skyGrad.addColorStop(0.85, '#0284c7');
        skyGrad.addColorStop(1, '#f59e0b');
        break;
      }
      case 'seoul_tower': {
        // Seoul Twilight: Índigo y resplandor metropolitano
        skyGrad.addColorStop(0, '#0b112c');
        skyGrad.addColorStop(0.5, '#1f2041');
        skyGrad.addColorStop(0.85, '#4b3f72');
        skyGrad.addColorStop(1, '#ffc857');
        break;
      }
      case 'sydney_opera': {
        // Sydney Harbor: Azul océano y puesta de sol austral
        skyGrad.addColorStop(0, '#0c2340');
        skyGrad.addColorStop(0.5, '#1d4e89');
        skyGrad.addColorStop(0.85, '#00b4d8');
        skyGrad.addColorStop(1, '#f77f00');
        break;
      }
      default: {
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.6, '#1e293b');
        skyGrad.addColorStop(1, '#334155');
        break;
      }
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Natural Sun / Moon / Sol de Mayo in the Sky
    const sunX = w * 0.78;
    const sunY = GAME_CONSTANTS.FLOOR_Y * 0.30;
    const sunRadius = 38 + beatPulse * 4;

    ctx.save();
    if (landmark === 'obelisk_buenos_aires') {
      // Sol de Mayo de la Bandera Argentina
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rayos solares clásicos
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      for (let r = 0; r < 16; r++) {
        const angle = (r * Math.PI) / 8;
        const len = r % 2 === 0 ? 18 : 10;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * (sunRadius + 2), sunY + Math.sin(angle) * (sunRadius + 2));
        ctx.lineTo(sunX + Math.cos(angle) * (sunRadius + 2 + len), sunY + Math.sin(angle) * (sunRadius + 2 + len));
        ctx.stroke();
      }
    } else if (landmark === 'fuji_torii' || landmark === 'torii') {
      // Sol naciente japonés
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius + 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sol/Luna natural con gradiente suave
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, sunRadius);
      sunGradient.addColorStop(0, '#fffbeb');
      sunGradient.addColorStop(0.4, '#fde68a');
      sunGradient.addColorStop(0.9, '#fb923c');
      sunGradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft drifting clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let c = 0; c < 4; c++) {
      const cx = (w * 0.25 + c * 240) % w;
      const cy = 55 + (c % 3) * 35;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 65, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 25, cy - 6, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // 2. DISTANT PARALLAX SKYLINE (Layer 1: 0.035x)
  // ==========================================
  private drawDistantCitySkyline(
    w: number,
    h: number,
    camX: number,
    landmark?: LandmarkType,
    themeColor: string = '#3b82f6',
    secondaryColor: string = '#f59e0b',
    freqData: Uint8Array = new Uint8Array(),
    beatPulse: number = 0
  ) {
    const ctx = this.ctx;
    const horizonY = GAME_CONSTANTS.FLOOR_Y;
    const farOffset = (camX * 0.035) % 900;

    ctx.save();
    ctx.globalAlpha = 0.85; // Atmospheric depth aerial tint

    // Distant mountain ranges or mega-skyline silhouettes
    if (landmark === 'fuji_torii') {
      // Mount Fuji Silhouette with Snow Cap
      const fujiX = w * 0.45 - (camX * 0.02) % (w * 1.5);
      const fujiW = 280;
      const fujiH = 140;
      const fujiBaseY = horizonY;

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(fujiX - fujiW / 2, fujiBaseY);
      ctx.lineTo(fujiX - 35, fujiBaseY - fujiH);
      ctx.lineTo(fujiX + 35, fujiBaseY - fujiH);
      ctx.lineTo(fujiX + fujiW / 2, fujiBaseY);
      ctx.closePath();
      ctx.fill();

      // Snow peak
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.moveTo(fujiX - 45, fujiBaseY - fujiH + 35);
      ctx.lineTo(fujiX - 35, fujiBaseY - fujiH);
      ctx.lineTo(fujiX + 35, fujiBaseY - fujiH);
      ctx.lineTo(fujiX + 45, fujiBaseY - fujiH + 35);
      ctx.lineTo(fujiX + 20, fujiBaseY - fujiH + 28);
      ctx.lineTo(fujiX, fujiBaseY - fujiH + 38);
      ctx.lineTo(fujiX - 20, fujiBaseY - fujiH + 28);
      ctx.closePath();
      ctx.fill();
    } else if (landmark === 'favelas_rio' || landmark === 'cristo_redentor') {
      // Sugarloaf Mountain (Pão de Açúcar) in Guanabara Bay
      const pãoX = w * 0.25 - (camX * 0.02) % (w * 1.5);
      ctx.fillStyle = '#06282d';
      ctx.beginPath();
      ctx.ellipse(pãoX, horizonY - 40, 95, 110, 0, Math.PI, 0);
      ctx.fill();
    } else if (landmark === 'machu_picchu') {
      // Huayna Picchu Andean peak
      const andesX = w * 0.35 - (camX * 0.02) % (w * 1.5);
      ctx.fillStyle = '#0f384c';
      ctx.beginPath();
      ctx.moveTo(andesX - 140, horizonY);
      ctx.lineTo(andesX - 20, horizonY - 150);
      ctx.lineTo(andesX + 30, horizonY - 110);
      ctx.lineTo(andesX + 160, horizonY);
      ctx.closePath();
      ctx.fill();
    }

    // Distant City Skyline (Silhouettes with aerial perspective)
    const buildingWidths = [45, 60, 35, 70, 50, 40, 65, 80, 55, 30, 75, 45];
    const buildingHeights = [110, 160, 85, 140, 175, 125, 95, 150, 130, 90, 165, 105];

    let currentX = -farOffset;
    for (let i = 0; i < 24; i++) {
      const bw = buildingWidths[i % buildingWidths.length];
      const bh = buildingHeights[i % buildingHeights.length];
      const by = horizonY - bh;

      // Solid building silhouette with aerial haze
      ctx.fillStyle = i % 2 === 0 ? '#131b2e' : '#1a2238';
      ctx.fillRect(currentX, by, bw, bh);

      // Spires / Antennas on tall towers
      if (bh > 145) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(currentX + bw / 2, by);
        ctx.lineTo(currentX + bw / 2, by - 22);
        ctx.stroke();

        if (Date.now() % 1000 < 500) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(currentX + bw / 2, by - 22, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Lit city windows
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      for (let wy = by + 12; wy < horizonY - 10; wy += 14) {
        for (let wx = currentX + 6; wx < currentX + bw - 6; wx += 10) {
          if ((wx * 7 + wy * 13) % 5 > 1) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }

      currentX += bw + 8;
    }

    ctx.restore();
  }

  // ==========================================
  // 3. MIDGROUND ARCHITECTURAL CITYSCAPE (Layer 2: 0.08x)
  // ==========================================
  private drawMidgroundCityscape(
    w: number,
    h: number,
    camX: number,
    landmark?: LandmarkType,
    themeColor: string = '#3b82f6',
    secondaryColor: string = '#f59e0b',
    beatPulse: number = 0
  ) {
    const ctx = this.ctx;
    const horizonY = GAME_CONSTANTS.FLOOR_Y;
    const midOffset = (camX * 0.08) % 1100;

    ctx.save();

    let startX = -midOffset;
    for (let i = 0; i < 18; i++) {
      const bw = 70 + ((i * 37) % 50);
      const bh = 75 + ((i * 53) % 70);
      const by = horizonY - bh;

      // Base building facade
      ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#161e2e';
      ctx.fillRect(startX, by, bw, bh);
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, by, bw, bh);

      // Roof details per city
      if (landmark === 'eiffel' || landmark === 'obelisk_buenos_aires') {
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.moveTo(startX, by);
        ctx.lineTo(startX + 12, by - 18);
        ctx.lineTo(startX + bw - 12, by - 18);
        ctx.lineTo(startX + bw, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#4b5563';
        ctx.fillRect(startX + 16, by - 26, 8, 8);
        ctx.fillRect(startX + bw - 24, by - 26, 8, 8);
      } else if (landmark === 'sagrada_familia' || landmark === 'colosseum') {
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.moveTo(startX - 4, by);
        ctx.lineTo(startX + bw / 2, by - 14);
        ctx.lineTo(startX + bw + 4, by);
        ctx.closePath();
        ctx.fill();
      } else if (landmark === 'fuji_torii' || landmark === 'pagoda') {
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(startX - 10, by + 4);
        ctx.quadraticCurveTo(startX + bw / 2, by - 12, startX + bw + 10, by + 4);
        ctx.lineTo(startX + bw + 4, by);
        ctx.quadraticCurveTo(startX + bw / 2, by - 8, startX - 4, by);
        ctx.closePath();
        ctx.fill();
      } else if (landmark === 'statue_liberty') {
        if (i % 3 === 0) {
          const tx = startX + bw / 2 - 10;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(tx, by - 22, 20, 16);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(tx + 2, by);
          ctx.lineTo(tx + 4, by - 6);
          ctx.moveTo(tx + 18, by);
          ctx.lineTo(tx + 16, by - 6);
          ctx.stroke();
        }
      }

      // Windows with warm realistic interior lighting
      for (let wy = by + 12; wy < horizonY - 12; wy += 18) {
        for (let wx = startX + 8; wx < startX + bw - 10; wx += 16) {
          const isLit = (wx * 11 + wy * 17) % 7 !== 0;
          ctx.fillStyle = isLit ? 'rgba(253, 224, 71, 0.6)' : '#0f172a';
          ctx.fillRect(wx, wy, 8, 11);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx, wy, 8, 11);
        }
      }

      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? '#991b1b' : '#166534';
        ctx.fillRect(startX + 4, horizonY - 18, bw - 8, 6);
      }

      startX += bw + 12;
    }

    ctx.restore();
  }

  // ==========================================
  // 4. MAIN CULTURAL LANDMARK (Layer 3: 0.18x)
  // ==========================================
  private drawCityLandmark(
    w: number,
    h: number,
    camX: number,
    landmark?: LandmarkType,
    primaryColor: string = '#3b82f6',
    secondaryColor: string = '#f59e0b',
    beatPulse: number = 0
  ) {
    const ctx = this.ctx;
    const horizonY = GAME_CONSTANTS.FLOOR_Y;
    const landmarkInterval = 1400;
    const lx = ((landmarkInterval * 2 - ((camX * 0.18) % (landmarkInterval * 2))) % landmarkInterval) + 80;

    ctx.save();

    switch (landmark) {
      case 'obelisk_buenos_aires': {
        // Obelisco de Buenos Aires en la Plaza de la República
        const ow = 28;
        const oh = 175;
        const oy = horizonY - oh;

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(lx - 24, horizonY - 16, 48, 16);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx - 24, horizonY - 16, 48, 16);

        const shaftGrad = ctx.createLinearGradient(lx - ow / 2, 0, lx + ow / 2, 0);
        shaftGrad.addColorStop(0, '#f8fafc');
        shaftGrad.addColorStop(0.5, '#e2e8f0');
        shaftGrad.addColorStop(1, '#94a3b8');

        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.moveTo(lx - ow / 2, horizonY - 16);
        ctx.lineTo(lx - (ow * 0.4) / 2, oy + 24);
        ctx.lineTo(lx, oy);
        ctx.lineTo(lx + (ow * 0.4) / 2, oy + 24);
        ctx.lineTo(lx + ow / 2, horizonY - 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx - 3, oy + 12, 6, 4);

        ctx.fillStyle = '#15803d';
        ctx.fillRect(lx - 65, horizonY - 6, 130, 6);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(lx - 45, horizonY - 24, 4, 18);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(lx - 43, horizonY - 30, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.fillRect(lx + 41, horizonY - 24, 4, 18);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(lx + 43, horizonY - 30, 14, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'favelas_rio':
      case 'cristo_redentor': {
        // Cerro del Corcovado con el Cristo Redentor & Favelas
        const hillW = 220;
        const hillH = 140;

        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.moveTo(lx - hillW / 2, horizonY);
        ctx.quadraticCurveTo(lx, horizonY - hillH, lx + hillW / 2, horizonY);
        ctx.fill();

        const favelaColors = ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#f97316', '#ec4899', '#8b5cf6'];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5; c++) {
            const hx = lx - 70 + c * 26 + (r % 2) * 8;
            const hy = horizonY - 20 - r * 22;
            const houseW = 20;
            const houseH = 16;

            ctx.fillStyle = favelaColors[(r * 5 + c) % favelaColors.length];
            ctx.fillRect(hx, hy, houseW, houseH);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.strokeRect(hx, hy, houseW, houseH);

            ctx.fillStyle = '#9a3412';
            ctx.fillRect(hx - 2, hy - 3, houseW + 4, 3);

            ctx.fillStyle = '#fef08a';
            ctx.fillRect(hx + 4, hy + 4, 4, 4);
            ctx.fillRect(hx + 11, hy + 4, 4, 4);
          }
        }

        const cx = lx;
        const cy = horizonY - hillH + 10;

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 8, cy - 8, 16, 8);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 8);
        ctx.lineTo(cx - 7, cy - 42);
        ctx.lineTo(cx + 7, cy - 42);
        ctx.lineTo(cx + 5, cy - 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillRect(cx - 26, cy - 38, 52, 6);

        ctx.beginPath();
        ctx.arc(cx, cy - 46, 5, 0, Math.PI * 2);
        ctx.fill();

        for (let p = -1; p <= 1; p += 2) {
          const px = lx + p * 90;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px, horizonY);
          ctx.quadraticCurveTo(px + p * 6, horizonY - 25, px + p * 10, horizonY - 45);
          ctx.stroke();

          ctx.fillStyle = '#22c55e';
          for (let f = 0; f < 5; f++) {
            const angle = (f * Math.PI) / 4 - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(px + p * 10 + Math.cos(angle) * 12, horizonY - 45 + Math.sin(angle) * 8, 12, 4, angle, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }

      case 'sagrada_familia': {
        const sw = 130;
        const sh = 160;
        const sy = horizonY;

        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;

        ctx.fillRect(lx - sw / 2 + 15, sy - 70, sw - 30, 70);
        ctx.strokeRect(lx - sw / 2 + 15, sy - 70, sw - 30, 70);

        const spireXOffsets = [-38, -14, 14, 38];
        const spireHeights = [135, 155, 155, 135];

        for (let s = 0; s < 4; s++) {
          const sx = lx + spireXOffsets[s];
          const sph = spireHeights[s];
          const spTop = sy - sph;

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(sx - 10, sy - 50);
          ctx.lineTo(sx - 5, spTop + 14);
          ctx.lineTo(sx, spTop);
          ctx.lineTo(sx + 5, spTop + 14);
          ctx.lineTo(sx + 10, sy - 50);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fde047';
          ctx.fillRect(sx - 3, spTop - 8, 6, 8);
          ctx.fillRect(sx - 7, spTop - 5, 14, 3);

          ctx.fillStyle = '#451a03';
          for (let p = spTop + 24; p < sy - 55; p += 12) {
            ctx.fillRect(sx - 4, p, 8, 4);
          }
        }

        for (let a = -1; a <= 1; a++) {
          const ax = lx + a * 24;
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(ax, sy - 24, 9, Math.PI, 0);
          ctx.lineTo(ax + 9, sy);
          ctx.lineTo(ax - 9, sy);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'eiffel': {
        const ew = 75;
        const eh = 175;
        const ey = horizonY;

        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(lx - ew / 2, ey);
        ctx.lineTo(lx - ew / 2 + 12, ey - 45);
        ctx.quadraticCurveTo(lx, ey - 32, lx + ew / 2 - 12, ey - 45);
        ctx.lineTo(lx + ew / 2, ey);
        ctx.stroke();

        ctx.fillRect(lx - ew / 2 + 10, ey - 48, ew - 20, 6);
        ctx.fillRect(lx - ew / 2 + 18, ey - 92, ew - 36, 5);

        ctx.beginPath();
        ctx.moveTo(lx - ew / 2 + 12, ey - 48);
        ctx.lineTo(lx - ew / 2 + 20, ey - 92);
        ctx.lineTo(lx - 4, ey - eh + 20);
        ctx.lineTo(lx, ey - eh);
        ctx.lineTo(lx + 4, ey - eh + 20);
        ctx.lineTo(lx + ew / 2 - 20, ey - 92);
        ctx.lineTo(lx + ew / 2 - 12, ey - 48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.moveTo(lx, ey - eh);
        ctx.lineTo(lx + 80, ey - eh - 40);
        ctx.lineTo(lx + 90, ey - eh - 15);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'fuji_torii':
      case 'torii': {
        const tw = 85;
        const th = 90;
        const ty = horizonY - th;

        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;

        ctx.fillRect(lx - tw / 2 + 12, ty + 12, 10, th - 12);
        ctx.fillRect(lx + tw / 2 - 22, ty + 12, 10, th - 12);

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(lx - tw / 2 - 8, ty + 4);
        ctx.quadraticCurveTo(lx, ty - 6, lx + tw / 2 + 8, ty + 4);
        ctx.lineTo(lx + tw / 2 + 6, ty + 10);
        ctx.quadraticCurveTo(lx, ty, lx - tw / 2 - 6, ty + 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(lx - tw / 2 + 4, ty + 24, tw - 8, 8);
        ctx.strokeRect(lx - tw / 2 + 4, ty + 24, tw - 8, 8);

        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(lx - 5, ty + 10, 10, 14);

        ctx.fillStyle = '#64748b';
        ctx.fillRect(lx - tw / 2 + 9, horizonY - 6, 16, 6);
        ctx.fillRect(lx + tw / 2 - 25, horizonY - 6, 16, 6);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(lx + tw / 2 + 12, horizonY - 50, 4, 50);
        ctx.fillStyle = '#f472b6';
        for (let s = 0; s < 6; s++) {
          ctx.beginPath();
          ctx.arc(lx + tw / 2 + 8 + (s % 3) * 10, horizonY - 60 + Math.floor(s / 3) * 14, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'colosseum':
      case 'parthenon': {
        const cw = 140;
        const ch = 85;
        const cy = horizonY - ch;

        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;

        ctx.fillRect(lx - cw / 2, cy, cw, ch);
        ctx.strokeRect(lx - cw / 2, cy, cw, ch);

        for (let tier = 0; tier < 3; tier++) {
          const ty = cy + 8 + tier * 24;
          for (let col = 0; col < 7; col++) {
            const ax = lx - cw / 2 + 10 + col * 17;
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(ax + 5, ty + 8, 6, Math.PI, 0);
            ctx.lineTo(ax + 11, ty + 20);
            ctx.lineTo(ax - 1, ty + 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(lx + cw / 2 + 25, horizonY);
        ctx.lineTo(lx + cw / 2 + 25, horizonY - 55);
        ctx.stroke();

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(lx + cw / 2 + 25, horizonY - 65, 26, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'big_ben': {
        const bw = 38;
        const bh = 160;
        const by = horizonY - bh;

        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;

        ctx.fillRect(lx - bw / 2, by + 28, bw, bh - 28);
        ctx.strokeRect(lx - bw / 2, by + 28, bw, bh - 28);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(lx - bw / 2 - 2, by + 28);
        ctx.lineTo(lx, by);
        ctx.lineTo(lx + bw / 2 + 2, by + 28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const clockY = by + 48;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(lx, clockY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(lx, clockY);
        ctx.lineTo(lx, clockY - 7);
        ctx.moveTo(lx, clockY);
        ctx.lineTo(lx + 5, clockY);
        ctx.stroke();

        ctx.fillStyle = '#92400e';
        ctx.fillRect(lx + bw / 2, horizonY - 50, 70, 50);
        ctx.strokeRect(lx + bw / 2, horizonY - 50, 70, 50);
        break;
      }

      case 'brandenburg_gate': {
        const gw = 120;
        const gh = 75;
        const gy = horizonY - gh;

        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;

        ctx.fillRect(lx - gw / 2, gy + 16, gw, 16);
        ctx.strokeRect(lx - gw / 2, gy + 16, gw, 16);

        for (let c = 0; c < 6; c++) {
          const cx = lx - gw / 2 + 8 + c * 20;
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cx, gy + 32, 9, gh - 32);
          ctx.strokeRect(cx, gy + 32, 9, gh - 32);
        }

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(lx - 16, gy + 16);
        ctx.lineTo(lx - 10, gy - 8);
        ctx.lineTo(lx, gy - 14);
        ctx.lineTo(lx + 10, gy - 8);
        ctx.lineTo(lx + 16, gy + 16);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'statue_liberty': {
        const sw = 32;
        const sh = 135;
        const sy = horizonY - sh;

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(lx - 20, horizonY - 45, 40, 45);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(lx - 20, horizonY - 45, 40, 45);

        ctx.fillStyle = '#0d9488';
        ctx.beginPath();
        ctx.moveTo(lx - 12, horizonY - 45);
        ctx.lineTo(lx - 8, sy + 30);
        ctx.lineTo(lx + 8, sy + 30);
        ctx.lineTo(lx + 12, horizonY - 45);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(lx + 6, sy + 32);
        ctx.lineTo(lx + 18, sy + 6);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(lx + 19, sy + 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0d9488';
        ctx.beginPath();
        ctx.arc(lx, sy + 22, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'pyramid':
      case 'mayan_pyramid': {
        const pw = 150;
        const ph = 100;
        const py = horizonY;

        const pyrGrad = ctx.createLinearGradient(lx - pw / 2, 0, lx + pw / 2, 0);
        pyrGrad.addColorStop(0, '#f59e0b');
        pyrGrad.addColorStop(0.6, '#d97706');
        pyrGrad.addColorStop(1, '#78350f');

        ctx.fillStyle = pyrGrad;
        ctx.beginPath();
        ctx.moveTo(lx, py - ph);
        ctx.lineTo(lx + pw / 2, py);
        ctx.lineTo(lx - pw / 2, py);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        for (let t = 1; t <= 6; t++) {
          const stepY = py - (ph / 7) * t;
          const halfW = (pw / 2) * (1 - t / 7);
          ctx.beginPath();
          ctx.moveTo(lx - halfW, stepY);
          ctx.lineTo(lx + halfW, stepY);
          ctx.stroke();
        }
        break;
      }

      case 'machu_picchu': {
        const mw = 180;
        const mh = 110;

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(lx - mw / 2, horizonY);
        ctx.lineTo(lx - 30, horizonY - mh);
        ctx.lineTo(lx + 30, horizonY - mh * 0.7);
        ctx.lineTo(lx + mw / 2, horizonY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        for (let t = 0; t < 5; t++) {
          const ty = horizonY - 12 - t * 18;
          ctx.beginPath();
          ctx.moveTo(lx - 50 + t * 8, ty);
          ctx.lineTo(lx + 50 - t * 6, ty);
          ctx.stroke();
        }
        break;
      }

      case 'seoul_tower': {
        const sw = 22;
        const sh = 150;
        const sy = horizonY - sh;

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(lx - 90, horizonY);
        ctx.quadraticCurveTo(lx, horizonY - 45, lx + 90, horizonY);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(lx - 6, sy + 30, 12, sh - 75);

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.ellipse(lx, sy + 35, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, sy + 26);
        ctx.lineTo(lx, sy);
        ctx.stroke();
        break;
      }

      case 'sydney_opera': {
        const ow = 130;
        const oh = 65;
        const oy = horizonY;

        ctx.fillStyle = '#0369a1';
        ctx.fillRect(lx - ow / 2 - 20, oy - 12, ow + 40, 12);

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;

        for (let shell = 0; shell < 3; shell++) {
          const sx = lx - ow / 2 + shell * 28;
          const shh = oh - shell * 8;
          ctx.beginPath();
          ctx.moveTo(sx, oy - 12);
          ctx.quadraticCurveTo(sx + 18, oy - 12 - shh, sx + 42, oy - 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case 'windmill': {
        const ww = 44;
        const wh = 85;
        const wy = horizonY - wh;

        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(lx - ww / 2, horizonY);
        ctx.lineTo(lx - ww / 3, wy + 16);
        ctx.lineTo(lx + ww / 3, wy + 16);
        ctx.lineTo(lx + ww / 2, horizonY);
        ctx.closePath();
        ctx.fill();

        const rot = Date.now() * 0.0018;
        const cx = lx;
        const cy = wy + 20;
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;

        for (let b = 0; b < 4; b++) {
          const angle = rot + (b * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * 32, cy + Math.sin(angle) * 32);
          ctx.stroke();
        }
        break;
      }

      case 'taj_mahal': {
        const tw = 120;
        const th = 85;
        const ty = horizonY - th;

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;

        ctx.fillRect(lx - tw / 2 + 15, ty + 25, tw - 30, th - 25);
        ctx.strokeRect(lx - tw / 2 + 15, ty + 25, tw - 30, th - 25);

        ctx.beginPath();
        ctx.arc(lx, ty + 25, 20, Math.PI, 0);
        ctx.lineTo(lx, ty);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        for (let m of [-tw / 2 + 6, tw / 2 - 6]) {
          ctx.fillRect(lx + m - 4, ty + 8, 8, th - 8);
          ctx.strokeRect(lx + m - 4, ty + 8, 8, th - 8);
        }
        break;
      }

      default: {
        ctx.fillStyle = '#334155';
        ctx.fillRect(lx - 25, horizonY - 80, 50, 80);
        break;
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 5. ATMOSPHERIC DEPTH SEPARATION VEIL
  // ==========================================
  private drawDepthSeparationVeil(w: number, h: number, themeColor: string) {
    const ctx = this.ctx;
    const floorY = GAME_CONSTANTS.FLOOR_Y;
    const ceilingY = GAME_CONSTANTS.CEILING_Y;

    ctx.save();
    // Creates a depth-fog / soft shadow veil behind the gameplay plane
    // This allows foreground obstacles and the player to pop out in front of the background
    const depthGrad = ctx.createLinearGradient(0, ceilingY, 0, floorY);
    depthGrad.addColorStop(0, 'rgba(3, 7, 18, 0.45)');
    depthGrad.addColorStop(0.3, 'rgba(3, 7, 18, 0.25)');
    depthGrad.addColorStop(0.75, 'rgba(3, 7, 18, 0.35)');
    depthGrad.addColorStop(1, 'rgba(3, 7, 18, 0.65)');

    ctx.fillStyle = depthGrad;
    ctx.fillRect(0, ceilingY, w, floorY - ceilingY);
    ctx.restore();
  }

  // ==========================================
  // 6. CITY GROUND & CEILING
  // ==========================================
  private drawCityGroundAndCeiling(
    w: number,
    h: number,
    camX: number,
    landmark?: LandmarkType,
    themeColor: string = '#3b82f6',
    secondaryColor: string = '#f59e0b',
    beatPulse: number = 0
  ) {
    const ctx = this.ctx;
    const floorY = GAME_CONSTANTS.FLOOR_Y;
    const ceilingY = GAME_CONSTANTS.CEILING_Y;

    // Floor Base (Asphalt / City Street)
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
    floorGrad.addColorStop(0, '#1e293b');
    floorGrad.addColorStop(0.2, '#0f172a');
    floorGrad.addColorStop(1, '#020617');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Ceiling Base
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, ceilingY);
    ceilGrad.addColorStop(0, '#020617');
    ceilGrad.addColorStop(0.8, '#0f172a');
    ceilGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, w, ceilingY);

    // Solid Curb / Road Border Line with 3D Bevel Shadow
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, floorY - 3, w, 4);
    ctx.fillRect(0, ceilingY - 1, w, 4);

    // Road Markings / Pavement Patterns
    if (landmark === 'favelas_rio' || landmark === 'cristo_redentor') {
      // Iconic Copacabana Wave Mosaic
      const wavePeriod = 60;
      const offsetX = (camX * 0.95) % wavePeriod;
      ctx.fillStyle = '#f8fafc';
      for (let x = -offsetX; x < w + wavePeriod; x += wavePeriod) {
        ctx.beginPath();
        ctx.moveTo(x, floorY + 15);
        ctx.quadraticCurveTo(x + 15, floorY + 5, x + 30, floorY + 15);
        ctx.quadraticCurveTo(x + 45, floorY + 25, x + 60, floorY + 15);
        ctx.lineTo(x + 60, floorY + 25);
        ctx.quadraticCurveTo(x + 45, floorY + 35, x + 30, floorY + 25);
        ctx.quadraticCurveTo(x + 15, floorY + 15, x, floorY + 25);
        ctx.closePath();
        ctx.fill();
      }
    } else if (landmark === 'eiffel' || landmark === 'sagrada_familia' || landmark === 'colosseum') {
      // European Stone Cobblestones
      const cobbleW = 28;
      const cobbleH = 14;
      const offsetX = (camX * 0.95) % cobbleW;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let r = 0; r < 5; r++) {
        const ry = floorY + 6 + r * cobbleH;
        const rowShift = (r % 2) * (cobbleW / 2);
        for (let x = -offsetX - cobbleW + rowShift; x < w + cobbleW; x += cobbleW) {
          ctx.strokeRect(x, ry, cobbleW - 2, cobbleH - 2);
        }
      }
    } else {
      // Standard Asphalt City Avenue with Dashed White Lane Lines
      const dashW = 40;
      const gapW = 35;
      const totalDash = dashW + gapW;
      const offsetX = (camX * 0.95) % totalDash;

      ctx.fillStyle = '#f8fafc';
      for (let x = -offsetX; x < w + totalDash; x += totalDash) {
        ctx.fillRect(x, floorY + 22, dashW, 4);
      }

      ctx.fillStyle = '#facc15';
      for (let x = -offsetX + 20; x < w + totalDash; x += totalDash * 2) {
        ctx.fillRect(x, floorY + 4, 4, 3);
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 8. OBSTACLES (Solid Arcade Geometry with Realistic 3D Drop-Shadows)
  // ==========================================
  private drawObstacles(
    obstacles: Obstacle[],
    camX: number,
    viewWidth: number,
    themeColor: string,
    secondaryColor: string,
    beatPulse: number
  ) {
    const ctx = this.ctx;
    const floorY = GAME_CONSTANTS.FLOOR_Y;

    for (const obs of obstacles) {
      if (obs.x + obs.width < camX - 100 || obs.x > camX + viewWidth + 100) {
        continue;
      }

      ctx.save();

      // Ground Contact Shadow (Ambience occlusion beneath obstacles resting on the floor)
      if (obs.y + obs.height >= floorY - 6) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, floorY - 1, obs.width * 0.55, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Depth Cast Shadow onto Background Plane
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;
      ctx.shadowBlur = 6;

      switch (obs.type) {
        case ObstacleType.SPIKE:
        case ObstacleType.DOUBLE_SPIKE:
        case ObstacleType.TRIPLE_SPIKE: {
          const count =
            obs.type === ObstacleType.TRIPLE_SPIKE ? 3 : obs.type === ObstacleType.DOUBLE_SPIKE ? 2 : 1;
          const singleW = obs.width / count;

          for (let i = 0; i < count; i++) {
            const sx = obs.x + i * singleW;
            const sy = obs.y;

            // 3D Beveled Hazard Spike
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(sx, sy + obs.height);
            ctx.lineTo(sx + singleW / 2, sy);
            ctx.lineTo(sx + singleW, sy + obs.height);
            ctx.closePath();
            ctx.fill();

            // Right shaded face
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(sx + singleW / 2, sy);
            ctx.lineTo(sx + singleW, sy + obs.height);
            ctx.lineTo(sx + singleW / 2, sy + obs.height);
            ctx.closePath();
            ctx.fill();

            // Left highlighted face
            ctx.fillStyle = '#312e81';
            ctx.beginPath();
            ctx.moveTo(sx, sy + obs.height);
            ctx.lineTo(sx + singleW / 2, sy);
            ctx.lineTo(sx + singleW / 2, sy + obs.height);
            ctx.closePath();
            ctx.fill();

            // Outline & Hazard edge
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy + obs.height);
            ctx.lineTo(sx + singleW / 2, sy);
            ctx.lineTo(sx + singleW, sy + obs.height);
            ctx.closePath();
            ctx.stroke();

            // Center spine shine
            ctx.strokeStyle = '#fecaca';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx + singleW / 2, sy + 3);
            ctx.lineTo(sx + singleW / 2, sy + obs.height - 2);
            ctx.stroke();
          }
          break;
        }

        case ObstacleType.HANGING_SPIKE: {
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width, obs.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }

        case ObstacleType.STEP_PLATFORM:
        case ObstacleType.BLOCK:
        case ObstacleType.PILLAR:
        case ObstacleType.FLOATING_BLOCK: {
          // Polished Architectural Block with 3D Bevels
          const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y + obs.height);
          grad.addColorStop(0, '#334155');
          grad.addColorStop(0.5, '#1e293b');
          grad.addColorStop(1, '#0f172a');

          ctx.fillStyle = grad;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

          // Top highlight bevel
          ctx.fillStyle = '#64748b';
          ctx.fillRect(obs.x, obs.y, obs.width, 3);
          ctx.fillRect(obs.x, obs.y, 3, obs.height);

          // Bottom shadow bevel
          ctx.fillStyle = '#020617';
          ctx.fillRect(obs.x, obs.y + obs.height - 3, obs.width, 3);
          ctx.fillRect(obs.x + obs.width - 3, obs.y, 3, obs.height);

          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

          // Corner Rivets
          ctx.fillStyle = '#94a3b8';
          if (obs.width >= 30 && obs.height >= 30) {
            ctx.fillRect(obs.x + 5, obs.y + 5, 3, 3);
            ctx.fillRect(obs.x + obs.width - 8, obs.y + 5, 3, 3);
            ctx.fillRect(obs.x + 5, obs.y + obs.height - 8, 3, 3);
            ctx.fillRect(obs.x + obs.width - 8, obs.y + obs.height - 8, 3, 3);
          }
          break;
        }

        case ObstacleType.SAW_BLADE: {
          const cx = obs.x + obs.width / 2;
          const cy = obs.y + obs.height / 2;
          const r = obs.radius || 27;
          obs.rotation = (obs.rotation || 0) + 0.08;

          ctx.translate(cx, cy);
          ctx.rotate(obs.rotation);

          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;

          const teeth = 8;
          ctx.beginPath();
          for (let t = 0; t < teeth; t++) {
            const angle = (t / teeth) * Math.PI * 2;
            const nextAngle = ((t + 1) / teeth) * Math.PI * 2;
            const midAngle = angle + (nextAngle - angle) * 0.5;

            ctx.lineTo(Math.cos(angle) * (r * 0.72), Math.sin(angle) * (r * 0.72));
            ctx.lineTo(Math.cos(midAngle) * r, Math.sin(midAngle) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ObstacleType.JUMP_ORB_YELLOW:
        case ObstacleType.JUMP_ORB_PINK:
        case ObstacleType.JUMP_ORB_CYAN: {
          const cx = obs.x + obs.width / 2;
          const cy = obs.y + obs.height / 2;
          const baseColor =
            obs.type === ObstacleType.JUMP_ORB_YELLOW
              ? '#f59e0b'
              : obs.type === ObstacleType.JUMP_ORB_PINK
              ? '#ec4899'
              : '#06b6d4';

          const r = (obs.radius || 24) * (1 + beatPulse * 0.12);

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          const orbGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r * 0.7);
          orbGrad.addColorStop(0, '#ffffff');
          orbGrad.addColorStop(0.3, baseColor);
          orbGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ObstacleType.JUMP_PAD_YELLOW:
        case ObstacleType.JUMP_PAD_CYAN: {
          const padColor = obs.type === ObstacleType.JUMP_PAD_YELLOW ? '#f59e0b' : '#06b6d4';

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = padColor;
          ctx.fillRect(obs.x + 2, obs.y + 2, obs.width - 4, 3);

          ctx.fillStyle = padColor;
          const midX = obs.x + obs.width / 2;
          ctx.beginPath();
          ctx.moveTo(midX, obs.y + 3);
          ctx.lineTo(midX - 8, obs.y + obs.height - 3);
          ctx.lineTo(midX + 8, obs.y + obs.height - 3);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case ObstacleType.GRAVITY_PORTAL_UP:
        case ObstacleType.GRAVITY_PORTAL_DOWN: {
          const isUp = obs.type === ObstacleType.GRAVITY_PORTAL_UP;
          const portalColor = isUp ? '#06b6d4' : '#f59e0b';

          ctx.strokeStyle = portalColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = `${portalColor}33`;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          const pcx = obs.x + obs.width / 2;
          const pcy = obs.y + obs.height / 2;
          ctx.beginPath();
          if (isUp) {
            ctx.moveTo(pcx, pcy - 12);
            ctx.lineTo(pcx - 8, pcy + 8);
            ctx.lineTo(pcx + 8, pcy + 8);
          } else {
            ctx.moveTo(pcx, pcy + 12);
            ctx.lineTo(pcx - 8, pcy - 8);
            ctx.lineTo(pcx + 8, pcy - 8);
          }
          ctx.closePath();
          ctx.fill();
          break;
        }

        case ObstacleType.VEHICLE_PORTAL_CUBE:
        case ObstacleType.VEHICLE_PORTAL_SHIP:
        case ObstacleType.VEHICLE_PORTAL_WAVE:
        case ObstacleType.VEHICLE_PORTAL_BALL:
        case ObstacleType.VEHICLE_PORTAL_UFO:
        case ObstacleType.VEHICLE_PORTAL_ROBOT:
        case ObstacleType.VEHICLE_PORTAL_SPIDER: {
          let portalColor = '#10b981';
          let portalIcon = '🟩';
          let portalName = 'CUBE';

          if (obs.type === ObstacleType.VEHICLE_PORTAL_SHIP) {
            portalColor = '#ec4899';
            portalIcon = '🚀';
            portalName = 'SHIP';
          } else if (obs.type === ObstacleType.VEHICLE_PORTAL_WAVE) {
            portalColor = '#06b6d4';
            portalIcon = '⚡';
            portalName = 'WAVE';
          } else if (obs.type === ObstacleType.VEHICLE_PORTAL_BALL) {
            portalColor = '#f97316';
            portalIcon = '⚽';
            portalName = 'BALL';
          } else if (obs.type === ObstacleType.VEHICLE_PORTAL_UFO) {
            portalColor = '#facc15';
            portalIcon = '🛸';
            portalName = 'UFO';
          } else if (obs.type === ObstacleType.VEHICLE_PORTAL_ROBOT) {
            portalColor = '#38bdf8';
            portalIcon = '🤖';
            portalName = 'ROBOT';
          } else if (obs.type === ObstacleType.VEHICLE_PORTAL_SPIDER) {
            portalColor = '#a855f7';
            portalIcon = '🕷️';
            portalName = 'SPIDER';
          }

          const pcx = obs.x + obs.width / 2;
          const pcy = obs.y + obs.height / 2;

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(pcx, pcy, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `${portalColor}44`;
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(portalIcon, pcx, pcy - 10);

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = portalColor;
          ctx.fillText(portalName, pcx, pcy + 16);
          break;
        }

        case ObstacleType.NEON_COIN: {
          if (!obs.collected) {
            const cx = obs.x + obs.width / 2;
            const cy = obs.y + obs.height / 2 + Math.sin(Date.now() * 0.005) * 4;

            const coinGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 14);
            coinGrad.addColorStop(0, '#fef08a');
            coinGrad.addColorStop(0.5, '#eab308');
            coinGrad.addColorStop(1, '#a16207');

            ctx.fillStyle = coinGrad;
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', cx, cy);
          }
          break;
        }

        case ObstacleType.FINISH_GATE: {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

          ctx.fillStyle = '#ffffff';
          for (let y = obs.y; y < obs.y + obs.height; y += 20) {
            ctx.fillRect(obs.x + 4, y, obs.width - 8, 8);
          }
          break;
        }
      }

      ctx.restore();
    }
  }

  // ==========================================
  // 9. PARTICLES & TRAIL
  // ==========================================
  private drawParticlesAndTrail(particles: ParticleSystem, customization: PlayerCustomization) {
    const ctx = this.ctx;

    const trailNodes = particles.getTrailNodes();
    for (let i = 0; i < trailNodes.length; i++) {
      const node = trailNodes[i];
      ctx.save();
      ctx.fillStyle = node.color;
      ctx.globalAlpha = node.alpha * 0.8;

      if (customization.trailType === 'sakura') {
        ctx.beginPath();
        ctx.ellipse(node.x, node.y, node.size * 0.7, node.size * 0.4, i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (customization.trailType === 'rainbow') {
        const hue = (Date.now() * 0.2 + i * 20) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const activeParticles = particles.getParticles();
    for (const p of activeParticles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha ?? Math.max(0, p.life / p.maxLife);

      ctx.beginPath();
      if (p.shape === 'square') {
        ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'sakura' || p.shape === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ==========================================
  // 10. WAVE PATH
  // ==========================================
  private drawWavePath(player: PlayerState, customization: PlayerCustomization, beatPulse: number) {
    if (!player.wavePoints || player.wavePoints.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = customization.primaryColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(player.wavePoints[0].x, player.wavePoints[0].y);
    for (let i = 1; i < player.wavePoints.length; i++) {
      ctx.lineTo(player.wavePoints[i].x, player.wavePoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================
  // 11. PLAYER & VEHICLES
  // ==========================================
  private drawPlayerVehicle(player: PlayerState, customization: PlayerCustomization, beatPulse: number) {
    const ctx = this.ctx;
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const size = player.width;
    const vehicle = player.vehicle || VehicleType.CUBE;
    const floorY = GAME_CONSTANTS.FLOOR_Y;

    // Player Ground Contact Shadow (Depth cue on the road)
    const distToFloor = floorY - (player.y + player.height);
    if (distToFloor >= 0 && distToFloor < 140) {
      const shadowAlpha = Math.max(0.1, 0.55 * (1 - distToFloor / 140));
      const shadowWidth = Math.max(10, size * (1 - distToFloor / 220));

      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, floorY - 2, shadowWidth * 0.65, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(player.rotation);

    // 3D Drop Shadow behind player vehicle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 6;

    switch (vehicle) {
      case VehicleType.SHIP: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(size / 2 + 4, 0);
        ctx.lineTo(-size / 2, -size / 2 + 4);
        ctx.lineTo(-size / 2 + 8, 0);
        ctx.lineTo(-size / 2, size / 2 - 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = customization.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (player.isHoldingJump) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-size / 2 + 8, -3);
          ctx.lineTo(-size / 2 - 12, 0);
          ctx.lineTo(-size / 2 + 8, 3);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case VehicleType.WAVE: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(size / 2 + 4, 0);
        ctx.lineTo(-size / 2 + 4, -size / 2 + 6);
        ctx.lineTo(-size / 4, 0);
        ctx.lineTo(-size / 2 + 4, size / 2 - 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = customization.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case VehicleType.BALL: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = customization.secondaryColor;
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, size / 2 - 4, angle - 0.25, angle + 0.25);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case VehicleType.UFO: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.ellipse(0, 4, size / 2 + 2, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = customization.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -2, size / 3, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case VehicleType.ROBOT: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 2.5;

        ctx.strokeRect(-12, -size / 2, 24, 14);
        ctx.fillRect(-12, -size / 2, 24, 14);

        ctx.fillStyle = customization.secondaryColor;
        ctx.fillRect(-8, -size / 2 + 3, 16, 6);

        ctx.fillStyle = '#1e293b';
        ctx.strokeRect(-14, -size / 2 + 16, 28, 18);
        ctx.fillRect(-14, -size / 2 + 16, 28, 18);
        break;
      }

      case VehicleType.SPIDER: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.ellipse(0, 0, size / 2.4, size / 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = customization.secondaryColor;
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.arc(4, -4, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case VehicleType.CUBE:
      default: {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = customization.primaryColor;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 2, size, size, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = customization.secondaryColor;
        if (customization.skinId === 'cyborg') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-size / 2 + 6, -6, size - 12, 10);
        } else if (customization.skinId === 'ninja') {
          ctx.beginPath();
          ctx.moveTo(-size / 2 + 8, -4);
          ctx.lineTo(size / 2 - 8, -4);
          ctx.lineTo(size / 2 - 14, 6);
          ctx.lineTo(-size / 2 + 14, 6);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-size / 4 - 3, -size / 4, 6, 6);
          ctx.fillRect(size / 4 - 3, -size / 4, 6, 6);
          ctx.fillRect(-size / 4, size / 6, size / 2, 4);
        }
        break;
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 12. FOREGROUND NEAR PASSING ELEMENTS (Layer 7: 1.15x Near Parallax)
  // ==========================================
  private drawForegroundNearElements(w: number, h: number, camX: number) {
    const ctx = this.ctx;
    const floorY = GAME_CONSTANTS.FLOOR_Y;
    const nearOffset = (camX * 1.15) % 800;

    ctx.save();
    ctx.globalAlpha = 0.45; // Soft near silhouette

    // Passing streetlight poles in the extreme foreground
    for (let i = 0; i < 3; i++) {
      const lx = (800 + i * 400 - nearOffset) % (w + 400) - 100;
      if (lx > -50 && lx < w + 50) {
        // Foreground Lamppost head passing quickly
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx, floorY - 60, 6, 90);
        ctx.fillRect(lx - 12, floorY - 65, 24, 6);

        // Soft Warm Lamp glow
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.beginPath();
        ctx.arc(lx, floorY - 58, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 13. CHECKPOINTS & OVERLAYS
  // ==========================================
  private drawCheckpoints(checkpoints: Checkpoint[], beatPulse: number) {
    const ctx = this.ctx;
    for (const cp of checkpoints) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(cp.x + 20, cp.y + 20, 10 + beatPulse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CP', cp.x + 20, cp.y + 24);
      ctx.restore();
    }
  }

  private drawAtmosphericOverlay(w: number, h: number, beatPulse: number, color: string) {
    const ctx = this.ctx;

    if (beatPulse > 0.05) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = beatPulse * 0.03;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Natural clean vignette
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.4, w / 2, h / 2, w * 0.75);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

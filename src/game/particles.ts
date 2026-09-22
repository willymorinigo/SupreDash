/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Particle, TrailNode } from '../types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public trails: TrailNode[] = [];

  public update(dt: number) {
    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vRot) {
        p.rotation = (p.rotation || 0) + p.vRot * dt;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update trail nodes
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.alpha -= dt * 3.5;
      if (t.alpha <= 0) {
        this.trails.splice(i, 1);
      }
    }
  }

  public addTrailNode(x: number, y: number, color: string, size: number = 36) {
    this.trails.push({
      x,
      y,
      alpha: 0.85,
      color,
      size
    });
    if (this.trails.length > 30) {
      this.trails.shift();
    }
  }

  public emitJumpSparks(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * (0.1 + Math.random() * 0.8);
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: -Math.cos(angle) * speed - 60,
        vy: Math.sin(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        color,
        size: 3 + Math.random() * 4,
        shape: 'spark'
      });
    }
  }

  public emitGroundSlide(x: number, y: number, color: string) {
    if (Math.random() < 0.4) {
      this.particles.push({
        x,
        y,
        vx: -150 - Math.random() * 100,
        vy: (Math.random() - 0.5) * 40,
        life: 0.2,
        maxLife: 0.2,
        color,
        size: 2 + Math.random() * 3,
        shape: 'spark'
      });
    }
  }

  public emitOrbRing(x: number, y: number, color: string) {
    // Expanding ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.4,
      maxLife: 0.4,
      color,
      size: 20,
      shape: 'ring'
    });

    // Burst sparks
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 150 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45,
        color,
        size: 3 + Math.random() * 3,
        shape: 'spark'
      });
    }
  }

  public emitDeathShatter(x: number, y: number, primaryColor: string, secondaryColor: string) {
    // 25 exploding square shards and glowing sparks
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 350;
      const color = Math.random() > 0.5 ? primaryColor : secondaryColor;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        color,
        size: 5 + Math.random() * 9,
        shape: 'square',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 15
      });
    }

    // Huge shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.6,
      maxLife: 0.6,
      color: '#ffffff',
      size: 15,
      shape: 'ring'
    });
  }

  public emitPortalFlash(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const vy = (Math.random() - 0.5) * 250;
      const vx = (Math.random() - 0.5) * 120 + 80;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 60,
        vx,
        vy,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
        size: 3 + Math.random() * 4,
        shape: 'spark'
      });
    }
  }

  public emitCoinSparkle(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = 120 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color: '#facc15',
        size: 4 + Math.random() * 3,
        shape: 'spark'
      });
    }
  }

  public emitShipExhaust(x: number, y: number, color: string = '#f97316') {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 6,
        vx: -180 - Math.random() * 120,
        vy: (Math.random() - 0.5) * 60,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        color: Math.random() > 0.5 ? color : '#facc15',
        size: 3 + Math.random() * 4,
        shape: 'spark',
      });
    }
  }

  public emitUFOFlap(x: number, y: number, color: string = '#eab308') {
    // Ring beneath UFO
    this.particles.push({
      x,
      y: y + 10,
      vx: 0,
      vy: 40,
      life: 0.3,
      maxLife: 0.3,
      color,
      size: 16,
      shape: 'ring',
    });
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + 12,
        vx: (Math.random() - 0.5) * 80 - 40,
        vy: 90 + Math.random() * 80,
        life: 0.25,
        maxLife: 0.25,
        color,
        size: 3 + Math.random() * 3,
        shape: 'spark',
      });
    }
  }

  public emitRobotBooster(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + 18,
      vx: -100 - Math.random() * 60,
      vy: 140 + Math.random() * 80,
      life: 0.2,
      maxLife: 0.2,
      color: '#38bdf8',
      size: 4 + Math.random() * 3,
      shape: 'spark',
    });
  }

  public emitSpiderTeleport(x: number, fromY: number, toY: number) {
    // Vertical lightning flash
    for (let i = 0; i < 16; i++) {
      const interpY = fromY + ((toY - fromY) * i) / 16;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: interpY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        life: 0.35,
        maxLife: 0.35,
        color: '#c084fc',
        size: 4 + Math.random() * 4,
        shape: 'spark',
      });
    }
    // Rings at source and dest
    this.particles.push({
      x,
      y: fromY,
      vx: 0,
      vy: 0,
      life: 0.35,
      maxLife: 0.35,
      color: '#a855f7',
      size: 22,
      shape: 'ring',
    });
    this.particles.push({
      x,
      y: toY,
      vx: 0,
      vy: 0,
      life: 0.35,
      maxLife: 0.35,
      color: '#c084fc',
      size: 22,
      shape: 'ring',
    });
  }

  public emitAtmosphericPetals(w: number, h: number, type: string) {
    if (this.particles.length > 120) return;
    if (Math.random() > 0.3) return;

    if (type === 'sakura') {
      this.particles.push({
        x: Math.random() * w + 200,
        y: -10,
        vx: -60 - Math.random() * 40,
        vy: 40 + Math.random() * 30,
        life: 5.0,
        maxLife: 5.0,
        color: Math.random() > 0.5 ? '#f472b6' : '#fda4af',
        size: 5 + Math.random() * 4,
        shape: 'sakura',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2,
      });
    } else if (type === 'confetti') {
      const colors = ['#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#facc15'];
      this.particles.push({
        x: Math.random() * w + 100,
        y: -10,
        vx: -50 - Math.random() * 50,
        vy: 50 + Math.random() * 50,
        life: 4.5,
        maxLife: 4.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 4,
        shape: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4,
      });
    } else if (type === 'ember') {
      this.particles.push({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 30 - 30,
        vy: -40 - Math.random() * 40,
        life: 4.0,
        maxLife: 4.0,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        size: 3 + Math.random() * 3,
        shape: 'ember',
      });
    }
  }

  public clear() {
    this.particles = [];
    this.trails = [];
  }

  public getTrailNodes(): TrailNode[] {
    return this.trails;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }
}

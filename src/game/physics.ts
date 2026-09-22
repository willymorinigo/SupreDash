/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GAME_CONSTANTS } from './proceduralLevelGenerator';
import { Obstacle, ObstacleType, PlayerState, VehicleType } from '../types';
import { soundEngine } from '../audio/soundEngine';

export class PhysicsEngine {
  /**
   * Updates player movement, gravity, rotation and jumps for delta time (dt) across all vehicle types
   */
  public static updatePlayer(
    player: PlayerState,
    dt: number,
    baseSpeed: number,
    obstacles: Obstacle[],
    onHitObstacle: (obstacle: Obstacle) => void,
    onCollectCoin: (coin: Obstacle) => void
  ) {
    if (player.isDead) return;

    // Cap delta time to prevent tunneling on frame lag spikes
    const safeDt = Math.min(dt, 0.033);

    // 1. HORIZONTAL VELOCITY & POSITION
    player.vx = baseSpeed * player.speedMultiplier;
    player.x += player.vx * safeDt;

    const floorY = GAME_CONSTANTS.FLOOR_Y - player.height;
    const ceilingY = GAME_CONSTANTS.CEILING_Y;

    // Flash timer for Spider teleportation
    if (player.spiderTeleportFlash && player.spiderTeleportFlash > 0) {
      player.spiderTeleportFlash -= safeDt;
    }

    // 2. VEHICLE SPECIFIC DYNAMICS
    const vehicle = player.vehicle || VehicleType.CUBE;

    switch (vehicle) {
      case VehicleType.SHIP: {
        // Ship mechanics: Hold to fly upward, release to descend
        const shipThrust = 1150;
        const shipGravity = 850;

        if (player.isHoldingJump) {
          player.vy -= shipThrust * player.gravity * safeDt;
        } else {
          player.vy += shipGravity * player.gravity * safeDt;
        }

        // Clamp ship vertical velocity
        const maxShipVy = 380;
        player.vy = Math.max(-maxShipVy, Math.min(maxShipVy, player.vy));
        player.y += player.vy * safeDt;

        // Ship tilt matches vertical velocity angle
        const targetShipRot = Math.atan2(player.vy * player.gravity, player.vx) * 0.75 * player.gravity;
        player.rotation = targetShipRot;

        // Boundaries
        if (player.y >= floorY) {
          player.y = floorY;
          player.vy = Math.min(0, player.vy);
          player.isGrounded = true;
        } else if (player.y <= ceilingY) {
          player.y = ceilingY;
          player.vy = Math.max(0, player.vy);
          player.isGrounded = true;
        } else {
          player.isGrounded = false;
        }
        break;
      }

      case VehicleType.WAVE: {
        // Wave mechanics: 45-degree zig-zag up/down
        const waveSpeed = player.vx * 1.05;

        if (player.isHoldingJump) {
          player.vy = -waveSpeed * player.gravity;
          player.rotation = (-Math.PI / 4) * player.gravity;
        } else {
          player.vy = waveSpeed * player.gravity;
          player.rotation = (Math.PI / 4) * player.gravity;
        }

        player.y += player.vy * safeDt;
        player.isGrounded = false;

        // Wave tracking trail points
        if (!player.wavePoints) player.wavePoints = [];
        player.wavePoints.push({ x: player.x, y: player.y + player.height / 2 });
        if (player.wavePoints.length > 50) {
          player.wavePoints.shift();
        }

        // Wave dies if it hits ceiling or floor directly
        if (player.y >= floorY || player.y <= ceilingY) {
          player.isDead = true;
          onHitObstacle({
            id: 'wave_boundary_crash',
            type: ObstacleType.SPIKE,
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height,
          });
          return;
        }
        break;
      }

      case VehicleType.BALL: {
        // Ball mechanics: Rolls on surface; jump inverts gravity
        player.vy += GAME_CONSTANTS.GRAVITY * 1.1 * player.gravity * safeDt;
        if (player.gravity === 1) {
          player.vy = Math.min(player.vy, GAME_CONSTANTS.TERMINAL_VELOCITY);
        } else {
          player.vy = Math.max(player.vy, -GAME_CONSTANTS.TERMINAL_VELOCITY);
        }

        player.y += player.vy * safeDt;

        // Boundaries
        if (player.gravity === 1) {
          if (player.y >= floorY) {
            player.y = floorY;
            player.vy = 0;
            player.isGrounded = true;
            player.lastGroundedY = floorY;
          } else {
            player.isGrounded = false;
          }
        } else {
          if (player.y <= ceilingY) {
            player.y = ceilingY;
            player.vy = 0;
            player.isGrounded = true;
            player.lastGroundedY = ceilingY;
          } else {
            player.isGrounded = false;
          }
        }

        // Rolling rotation
        player.rotation += (player.vx * 0.015) * player.gravity * (safeDt * 60);

        // Check Ball jump flip
        if (player.jumpBufferTime > 0 && player.isGrounded) {
          player.gravity = player.gravity === 1 ? -1 : 1;
          player.vy = 420 * player.gravity;
          player.isGrounded = false;
          player.jumpBufferTime = 0;
          soundEngine.playGravityFlipSound();
        }
        break;
      }

      case VehicleType.UFO: {
        // UFO mechanics: Mid-air flaps on jump press
        player.vy += GAME_CONSTANTS.GRAVITY * 0.85 * player.gravity * safeDt;
        player.vy = Math.max(-GAME_CONSTANTS.TERMINAL_VELOCITY, Math.min(GAME_CONSTANTS.TERMINAL_VELOCITY, player.vy));
        player.y += player.vy * safeDt;

        // Boundaries
        if (player.gravity === 1) {
          if (player.y >= floorY) {
            player.y = floorY;
            player.vy = 0;
            player.isGrounded = true;
          } else {
            player.isGrounded = false;
          }
        } else {
          if (player.y <= ceilingY) {
            player.y = ceilingY;
            player.vy = 0;
            player.isGrounded = true;
          } else {
            player.isGrounded = false;
          }
        }

        // Slight hover wobble
        player.rotation = Math.sin(player.x * 0.04) * 0.08;

        // UFO flap
        if (player.jumpBufferTime > 0) {
          player.vy = -450 * player.gravity;
          player.jumpBufferTime = 0;
          player.isGrounded = false;
          soundEngine.playUFOThrustSound();
        }
        break;
      }

      case VehicleType.ROBOT: {
        // Robot mechanics: Holding jump gives variable high leaps
        if (player.isHoldingJump && player.robotBoostTimer && player.robotBoostTimer > 0) {
          player.robotBoostTimer -= safeDt;
          player.vy -= 1400 * player.gravity * safeDt;
        } else {
          player.vy += GAME_CONSTANTS.GRAVITY * player.gravity * safeDt;
        }

        if (player.gravity === 1) {
          player.vy = Math.min(player.vy, GAME_CONSTANTS.TERMINAL_VELOCITY);
        } else {
          player.vy = Math.max(player.vy, -GAME_CONSTANTS.TERMINAL_VELOCITY);
        }

        player.y += player.vy * safeDt;

        if (player.gravity === 1) {
          if (player.y >= floorY) {
            player.y = floorY;
            player.vy = 0;
            player.isGrounded = true;
            player.lastGroundedY = floorY;
            player.robotBoostTimer = 0;
          } else {
            player.isGrounded = false;
          }
        } else {
          if (player.y <= ceilingY) {
            player.y = ceilingY;
            player.vy = 0;
            player.isGrounded = true;
            player.lastGroundedY = ceilingY;
            player.robotBoostTimer = 0;
          } else {
            player.isGrounded = false;
          }
        }

        // Ground snap or upright pose
        if (player.isGrounded) {
          player.rotation = 0;
        } else {
          player.rotation = Math.max(-0.35, Math.min(0.35, player.vy * 0.0006));
        }

        if (player.jumpBufferTime > 0 && player.isGrounded) {
          player.vy = -560 * player.gravity;
          player.robotBoostTimer = 0.28; // Up to 280ms extended thruster
          player.isGrounded = false;
          player.jumpBufferTime = 0;
          soundEngine.playJumpSound(1.2);
        }
        break;
      }

      case VehicleType.SPIDER: {
        // Spider mechanics: Instantly teleports to opposite surface (ceiling / floor / platform)
        player.vy += GAME_CONSTANTS.GRAVITY * player.gravity * safeDt;
        player.y += player.vy * safeDt;

        if (player.gravity === 1) {
          if (player.y >= floorY) {
            player.y = floorY;
            player.vy = 0;
            player.isGrounded = true;
          } else {
            player.isGrounded = false;
          }
        } else {
          if (player.y <= ceilingY) {
            player.y = ceilingY;
            player.vy = 0;
            player.isGrounded = true;
          } else {
            player.isGrounded = false;
          }
        }

        // Spider crawling animation rotation
        player.rotation = 0;

        if (player.jumpBufferTime > 0 && player.isGrounded) {
          // Find target opposite surface
          const targetGrav = player.gravity === 1 ? -1 : 1;
          const fromY = player.y;
          let targetY = targetGrav === 1 ? floorY : ceilingY;

          // Check if any platform lies in between
          for (const obs of obstacles) {
            if (
              (obs.type === ObstacleType.BLOCK ||
                obs.type === ObstacleType.STEP_PLATFORM ||
                obs.type === ObstacleType.FLOATING_BLOCK) &&
              player.x + player.width > obs.x &&
              player.x < obs.x + obs.width
            ) {
              if (targetGrav === -1 && obs.y + obs.height < fromY && obs.y + obs.height > targetY) {
                targetY = obs.y + obs.height;
              } else if (targetGrav === 1 && obs.y > fromY && obs.y - player.height < targetY) {
                targetY = obs.y - player.height;
              }
            }
          }

          player.gravity = targetGrav;
          player.y = targetY;
          player.vy = 0;
          player.isGrounded = true;
          player.spiderTeleportFlash = 0.25;
          player.jumpBufferTime = 0;
          soundEngine.playSpiderTeleportSound();
        }
        break;
      }

      case VehicleType.CUBE:
      default: {
        // Standard Cube Jump Mechanics
        player.vy += GAME_CONSTANTS.GRAVITY * player.gravity * safeDt;

        if (player.gravity === 1) {
          if (player.vy > GAME_CONSTANTS.TERMINAL_VELOCITY) {
            player.vy = GAME_CONSTANTS.TERMINAL_VELOCITY;
          }
        } else {
          if (player.vy < -GAME_CONSTANTS.TERMINAL_VELOCITY) {
            player.vy = -GAME_CONSTANTS.TERMINAL_VELOCITY;
          }
        }

        player.y += player.vy * safeDt;

        if (player.gravity === 1) {
          if (player.y >= floorY) {
            player.y = floorY;
            player.vy = 0;
            player.isGrounded = true;
            player.lastGroundedY = floorY;
          } else {
            player.isGrounded = false;
          }
        } else {
          if (player.y <= ceilingY) {
            player.y = ceilingY;
            player.vy = 0;
            player.isGrounded = true;
            player.lastGroundedY = ceilingY;
          } else {
            player.isGrounded = false;
          }
        }

        // Solid blocks collision
        this.checkSolidBlockCollisions(player, obstacles);

        // Jump buffer consumption
        if (player.jumpBufferTime > 0) {
          player.jumpBufferTime -= safeDt * 1000;
          if (player.isGrounded) {
            this.executeJump(player);
            player.jumpBufferTime = 0;
          } else {
            this.checkJumpOrbInteraction(player, obstacles);
          }
        }

        // Cube Rotation
        if (!player.isGrounded) {
          const rotSpeed = Math.PI * 3.8 * player.gravity;
          player.rotation += rotSpeed * safeDt;
        } else {
          const targetAngle = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
          const diff = targetAngle - player.rotation;
          if (Math.abs(diff) > 0.01) {
            player.rotation += diff * Math.min(1, safeDt * 22);
          } else {
            player.rotation = targetAngle;
          }
        }
        break;
      }
    }

    // 3. SOLID BLOCKS COLLISION (For non-cube vehicles as well)
    if (vehicle !== VehicleType.CUBE) {
      this.checkSolidBlockCollisions(player, obstacles);
    }

    // 4. HAZARD & PORTAL & COIN INTERACTIONS
    this.checkInteractiveAndHazardCollisions(player, obstacles, onHitObstacle, onCollectCoin);
  }

  /**
   * Executes a standard jump from ground or platform
   */
  public static executeJump(player: PlayerState) {
    player.vy = GAME_CONSTANTS.JUMP_FORCE * player.gravity;
    player.isGrounded = false;
    soundEngine.playJumpSound(player.gravity === 1 ? 1.0 : 1.15);
  }

  /**
   * Handles interactive orbs when jump is pressed in mid-air
   */
  private static checkJumpOrbInteraction(player: PlayerState, obstacles: Obstacle[]): boolean {
    for (const obs of obstacles) {
      if (
        (obs.type === ObstacleType.JUMP_ORB_YELLOW ||
          obs.type === ObstacleType.JUMP_ORB_PINK ||
          obs.type === ObstacleType.JUMP_ORB_CYAN) &&
        obs.active
      ) {
        const orbRadius = (obs.radius || 28) + 14;
        const orbCenterX = obs.x + obs.width / 2;
        const orbCenterY = obs.y + obs.height / 2;

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const dist = Math.hypot(orbCenterX - playerCenterX, orbCenterY - playerCenterY);

        if (dist <= orbRadius + player.width / 2) {
          // Trigger Orb Jump
          obs.active = false;
          obs.pulseScale = 2.2;
          player.orbsHit++;

          if (obs.type === ObstacleType.JUMP_ORB_YELLOW) {
            player.vy = GAME_CONSTANTS.ORB_YELLOW_FORCE * player.gravity;
            soundEngine.playOrbSound('yellow');
          } else if (obs.type === ObstacleType.JUMP_ORB_PINK) {
            player.vy = GAME_CONSTANTS.ORB_PINK_FORCE * player.gravity;
            soundEngine.playOrbSound('pink');
          } else if (obs.type === ObstacleType.JUMP_ORB_CYAN) {
            player.gravity = player.gravity === 1 ? -1 : 1;
            player.vy = GAME_CONSTANTS.ORB_CYAN_FORCE * player.gravity;
            soundEngine.playGravityFlipSound();
            soundEngine.playOrbSound('cyan');
          }

          player.isGrounded = false;
          player.jumpBufferTime = 0;
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Collision detection against solid blocks and platforms
   */
  private static checkSolidBlockCollisions(player: PlayerState, obstacles: Obstacle[]) {
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    for (const obs of obstacles) {
      if (
        obs.type === ObstacleType.STEP_PLATFORM ||
        obs.type === ObstacleType.BLOCK ||
        obs.type === ObstacleType.PILLAR ||
        obs.type === ObstacleType.FLOATING_BLOCK
      ) {
        if (
          px + pw > obs.x + 4 &&
          px < obs.x + obs.width - 4 &&
          py + ph > obs.y &&
          py < obs.y + obs.height
        ) {
          if (player.gravity === 1) {
            const previousY = py - player.vy * 0.02;
            if (previousY + ph <= obs.y + 16 && player.vy >= 0) {
              player.y = obs.y - ph;
              player.vy = 0;
              player.isGrounded = true;
              player.lastGroundedY = player.y;
            }
          } else {
            const previousY = py - player.vy * 0.02;
            if (previousY >= obs.y + obs.height - 16 && player.vy <= 0) {
              player.y = obs.y + obs.height;
              player.vy = 0;
              player.isGrounded = true;
              player.lastGroundedY = player.y;
            }
          }
        }
      }
    }
  }

  /**
   * Collision detection against hazards, portals, jump pads, and coins
   */
  private static checkInteractiveAndHazardCollisions(
    player: PlayerState,
    obstacles: Obstacle[],
    onHitObstacle: (obstacle: Obstacle) => void,
    onCollectCoin: (coin: Obstacle) => void
  ) {
    const px = player.x + 5;
    const py = player.y + 5;
    const pw = player.width - 10;
    const ph = player.height - 10;

    for (const obs of obstacles) {
      if (obs.x > player.x + 200 || obs.x + obs.width < player.x - 100) {
        continue;
      }

      // 1. COIN COLLECTION
      if (obs.type === ObstacleType.NEON_COIN && !obs.collected) {
        if (px < obs.x + obs.width && px + pw > obs.x && py < obs.y + obs.height && py + ph > obs.y) {
          obs.collected = true;
          player.coins++;
          soundEngine.playCoinSound();
          onCollectCoin(obs);
        }
        continue;
      }

      // 2. AUTO JUMP PADS (Single-touch trigger per crossing)
      if (obs.type === ObstacleType.JUMP_PAD_YELLOW || obs.type === ObstacleType.JUMP_PAD_CYAN) {
        if (!obs.collected && px < obs.x + obs.width + 4 && px + pw > obs.x - 4 && py < obs.y + obs.height + 6 && py + ph > obs.y - 6) {
          obs.collected = true; // Mark as triggered so it does not rapidly flip every consecutive frame
          obs.pulseScale = 2.0;

          if (obs.type === ObstacleType.JUMP_PAD_YELLOW) {
            player.vy = GAME_CONSTANTS.PAD_YELLOW_FORCE * player.gravity;
            player.isGrounded = false;
            soundEngine.playPadSound('yellow');
          } else if (obs.type === ObstacleType.JUMP_PAD_CYAN) {
            player.gravity = player.gravity === 1 ? -1 : 1;
            player.vy = GAME_CONSTANTS.PAD_CYAN_FORCE * player.gravity;
            player.isGrounded = false;
            soundEngine.playGravityFlipSound();
            soundEngine.playPadSound('cyan');
          }
        }
        continue;
      }

      // 3. GRAVITY PORTALS
      if (
        obs.type === ObstacleType.GRAVITY_PORTAL_UP ||
        obs.type === ObstacleType.GRAVITY_PORTAL_DOWN
      ) {
        if (px < obs.x + obs.width && px + pw > obs.x && py < obs.y + obs.height && py + ph > obs.y) {
          const targetGravity = obs.type === ObstacleType.GRAVITY_PORTAL_UP ? -1 : 1;
          if (player.gravity !== targetGravity) {
            player.gravity = targetGravity;
            player.vy *= 0.5;
            soundEngine.playPortalSound();
            soundEngine.playGravityFlipSound();
          }
        }
        continue;
      }

      // 4. SPEED PORTALS
      if (
        obs.type === ObstacleType.SPEED_PORTAL_SLOW ||
        obs.type === ObstacleType.SPEED_PORTAL_NORMAL ||
        obs.type === ObstacleType.SPEED_PORTAL_FAST ||
        obs.type === ObstacleType.SPEED_PORTAL_SONIC
      ) {
        if (px < obs.x + obs.width && px + pw > obs.x && py < obs.y + obs.height && py + ph > obs.y) {
          let multiplier = 1.0;
          if (obs.type === ObstacleType.SPEED_PORTAL_SLOW) multiplier = 0.85;
          if (obs.type === ObstacleType.SPEED_PORTAL_NORMAL) multiplier = 1.0;
          if (obs.type === ObstacleType.SPEED_PORTAL_FAST) multiplier = 1.25;
          if (obs.type === ObstacleType.SPEED_PORTAL_SONIC) multiplier = 1.5;

          if (player.speedMultiplier !== multiplier) {
            player.speedMultiplier = multiplier;
            soundEngine.playPortalSound();
          }
        }
        continue;
      }

      // 5. VEHICLE PORTALS (Transformation)
      if (
        obs.type === ObstacleType.VEHICLE_PORTAL_CUBE ||
        obs.type === ObstacleType.VEHICLE_PORTAL_SHIP ||
        obs.type === ObstacleType.VEHICLE_PORTAL_WAVE ||
        obs.type === ObstacleType.VEHICLE_PORTAL_BALL ||
        obs.type === ObstacleType.VEHICLE_PORTAL_UFO ||
        obs.type === ObstacleType.VEHICLE_PORTAL_ROBOT ||
        obs.type === ObstacleType.VEHICLE_PORTAL_SPIDER
      ) {
        if (px < obs.x + obs.width && px + pw > obs.x && py < obs.y + obs.height && py + ph > obs.y) {
          let targetVehicle = VehicleType.CUBE;
          if (obs.type === ObstacleType.VEHICLE_PORTAL_SHIP) targetVehicle = VehicleType.SHIP;
          if (obs.type === ObstacleType.VEHICLE_PORTAL_WAVE) targetVehicle = VehicleType.WAVE;
          if (obs.type === ObstacleType.VEHICLE_PORTAL_BALL) targetVehicle = VehicleType.BALL;
          if (obs.type === ObstacleType.VEHICLE_PORTAL_UFO) targetVehicle = VehicleType.UFO;
          if (obs.type === ObstacleType.VEHICLE_PORTAL_ROBOT) targetVehicle = VehicleType.ROBOT;
          if (obs.type === ObstacleType.VEHICLE_PORTAL_SPIDER) targetVehicle = VehicleType.SPIDER;

          if (player.vehicle !== targetVehicle) {
            player.vehicle = targetVehicle;
            if (targetVehicle === VehicleType.WAVE) {
              player.wavePoints = [{ x: player.x, y: player.y + player.height / 2 }];
            }
            soundEngine.playPortalSound();
            soundEngine.playVehicleTransformSound(targetVehicle);
          }
        }
        continue;
      }

      // 6. FINISH GATE
      if (obs.type === ObstacleType.FINISH_GATE) {
        if (px < obs.x + obs.width && px + pw > obs.x) {
          onHitObstacle(obs);
          return;
        }
        continue;
      }

      // 7. DEADLY HAZARDS (Spikes, Saws, Solid Wall Faces)
      if (
        obs.type === ObstacleType.SPIKE ||
        obs.type === ObstacleType.DOUBLE_SPIKE ||
        obs.type === ObstacleType.TRIPLE_SPIKE ||
        obs.type === ObstacleType.HANGING_SPIKE ||
        obs.type === ObstacleType.SAW_BLADE ||
        obs.type === ObstacleType.HAZARD_LASER
      ) {
        if (this.checkHazardIntersection(player, obs)) {
          player.isDead = true;
          onHitObstacle(obs);
          return;
        }
      }

      // 8. CRASH INTO SIDE FACE OF SOLID BLOCK/PILLAR
      if (
        obs.type === ObstacleType.STEP_PLATFORM ||
        obs.type === ObstacleType.BLOCK ||
        obs.type === ObstacleType.PILLAR
      ) {
        const sideHitboxX = obs.x;
        const sideHitboxW = 10;
        if (
          px + pw > sideHitboxX &&
          px < sideHitboxX + sideHitboxW &&
          py + ph > obs.y + 12 &&
          py < obs.y + obs.height - 12
        ) {
          player.isDead = true;
          onHitObstacle(obs);
          return;
        }
      }
    }
  }

  /**
   * Precise triangle and circular hitboxes for spikes and saw blades
   */
  private static checkHazardIntersection(player: PlayerState, obs: Obstacle): boolean {
    const px = player.x + 6;
    const py = player.y + 6;
    const pw = player.width - 12;
    const ph = player.height - 12;

    if (obs.type === ObstacleType.SAW_BLADE) {
      const radius = (obs.radius || 25) * 0.8;
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;

      const closestX = Math.max(px, Math.min(cx, px + pw));
      const closestY = Math.max(py, Math.min(cy, py + ph));
      const dist = Math.hypot(cx - closestX, cy - closestY);
      return dist < radius;
    }

    // Precise triangular bounding for spikes
    const spikeMarginX = 6;
    const spikeMarginY = 8;
    return (
      px < obs.x + obs.width - spikeMarginX &&
      px + pw > obs.x + spikeMarginX &&
      py < obs.y + obs.height - spikeMarginY &&
      py + ph > obs.y + spikeMarginY
    );
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export const RotatingEarth: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotationAngle = 0;

    // Generate static stars once
    const starsCount = 180;
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    // Simplified continent polygon paths on a equirectangular map (longitude -180 to 180, latitude -90 to 90)
    const continents: { name: string; points: [number, number][] }[] = [
      // South America
      {
        name: 'South America',
        points: [
          [-80, 10], [-75, 12], [-60, 5], [-50, -2], [-35, -5], [-35, -15],
          [-40, -22], [-48, -28], [-53, -34], [-65, -45], [-70, -55], [-75, -45],
          [-72, -30], [-76, -15], [-81, -5], [-80, 5],
        ],
      },
      // North America
      {
        name: 'North America',
        points: [
          [-165, 65], [-140, 70], [-120, 72], [-80, 75], [-60, 60], [-65, 45],
          [-75, 35], [-80, 25], [-90, 30], [-97, 26], [-88, 20], [-80, 10],
          [-85, 15], [-105, 20], [-115, 30], [-124, 40], [-125, 50], [-140, 60],
          [-160, 55],
        ],
      },
      // Africa
      {
        name: 'Africa',
        points: [
          [-15, 35], [10, 37], [32, 32], [42, 12], [50, 10], [42, 0],
          [40, -10], [35, -25], [28, -34], [18, -34], [12, -18], [8, 4],
          [-5, 5], [-17, 15], [-15, 30],
        ],
      },
      // Europe
      {
        name: 'Europe',
        points: [
          [-10, 36], [0, 43], [5, 47], [10, 55], [25, 60], [30, 70],
          [40, 65], [35, 50], [25, 42], [20, 38], [15, 40], [5, 38],
        ],
      },
      // Asia
      {
        name: 'Asia',
        points: [
          [35, 50], [50, 60], [70, 72], [110, 75], [170, 68], [160, 50],
          [140, 45], [130, 35], [120, 30], [105, 20], [100, 5], [90, 15],
          [80, 10], [75, 22], [60, 25], [50, 30], [40, 35],
        ],
      },
      // Australia
      {
        name: 'Australia',
        points: [
          [115, -22], [125, -15], [135, -12], [145, -15], [152, -25],
          [150, -35], [140, -38], [130, -32], [118, -35],
        ],
      },
    ];

    const render = () => {
      if (!canvas) return;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 600);

      ctx.clearRect(0, 0, w, h);

      // 1. Deep Space Canvas Background
      const spaceGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
      spaceGrad.addColorStop(0, '#040714');
      spaceGrad.addColorStop(0.5, '#02030a');
      spaceGrad.addColorStop(1, '#000000');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Twinkling Stars
      const time = Date.now() * 0.001;
      for (let s of stars) {
        const sx = (s.x / 1000) * w;
        const sy = (s.y / 1000) * h;
        const starAlpha = Math.sin(time * s.speed * 20 + s.x) * 0.3 + 0.7;

        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * s.alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Planet Earth Configuration
      const earthRadius = Math.min(w, h) * 0.38;
      const earthX = w / 2;
      const earthY = h / 2;
      rotationAngle += 0.004; // Continuous smooth rotation

      ctx.save();
      ctx.translate(earthX, earthY);
      ctx.rotate((-23.5 * Math.PI) / 180); // Real Earth axial tilt

      // Outer Atmospheric Glow
      const atmosGlow = ctx.createRadialGradient(0, 0, earthRadius * 0.95, 0, 0, earthRadius * 1.25);
      atmosGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmosGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.2)');
      atmosGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = atmosGlow;
      ctx.beginPath();
      ctx.arc(0, 0, earthRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Earth Globe Clip Path
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, earthRadius, 0, Math.PI * 2);
      ctx.clip();

      // Base Ocean (Deep Pacific/Atlantic Blue)
      const oceanGrad = ctx.createRadialGradient(-earthRadius * 0.3, -earthRadius * 0.3, 10, 0, 0, earthRadius);
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(0.6, '#0369a1');
      oceanGrad.addColorStop(1, '#075985');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(-earthRadius, -earthRadius, earthRadius * 2, earthRadius * 2);

      // Render Continents with Spherical Orthographic Projection
      ctx.fillStyle = '#15803d'; // Green landmass
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1.5;

      continents.forEach((continent) => {
        // Project polygon
        const projectedPoints: [number, number, number][] = [];

        continent.points.forEach(([lonDeg, latDeg]) => {
          // Adjust longitude by continuous rotation
          const currentLon = (((lonDeg + (rotationAngle * 180) / Math.PI + 180) % 360) - 180) * (Math.PI / 180);
          const lat = (latDeg * Math.PI) / 180;

          // Spherical 3D Coordinates
          const x3d = Math.cos(lat) * Math.sin(currentLon);
          const y3d = -Math.sin(lat);
          const z3d = Math.cos(lat) * Math.cos(currentLon);

          if (z3d > -0.2) {
            // Visible on front side of sphere
            const px = x3d * earthRadius;
            const py = y3d * earthRadius;
            projectedPoints.push([px, py, z3d]);
          }
        });

        if (projectedPoints.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(projectedPoints[0][0], projectedPoints[0][1]);
          for (let i = 1; i < projectedPoints.length; i++) {
            ctx.lineTo(projectedPoints[i][0], projectedPoints[i][1]);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Mountain & Desert Shading on Land
          ctx.fillStyle = 'rgba(217, 119, 6, 0.4)';
          ctx.beginPath();
          for (let i = 0; i < projectedPoints.length; i += 2) {
            const pt = projectedPoints[i];
            ctx.arc(pt[0] * 0.9, pt[1] * 0.9, 8, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.fillStyle = '#15803d';
        }
      });

      // Drifting White Atmospheric Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let c = 0; c < 8; c++) {
        const cloudLon = (((c * 45 + (rotationAngle * 1.2 * 180) / Math.PI + 180) % 360) - 180) * (Math.PI / 180);
        const cloudLat = (((c % 5) - 2) * 25 * Math.PI) / 180;
        const cx3d = Math.cos(cloudLat) * Math.sin(cloudLon);
        const cy3d = -Math.sin(cloudLat);
        const cz3d = Math.cos(cloudLat) * Math.cos(cloudLon);

        if (cz3d > 0.05) {
          const cpx = cx3d * earthRadius;
          const cpy = cy3d * earthRadius;
          ctx.beginPath();
          ctx.ellipse(cpx, cpy, 35 * cz3d, 12 * cz3d, c * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Day / Night Sun Terminator & Shadow Gradient (Sun light coming from upper-left)
      const sunLighting = ctx.createRadialGradient(
        -earthRadius * 0.45,
        -earthRadius * 0.45,
        earthRadius * 0.1,
        earthRadius * 0.2,
        earthRadius * 0.2,
        earthRadius * 1.15
      );
      sunLighting.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      sunLighting.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
      sunLighting.addColorStop(0.75, 'rgba(0, 0, 0, 0.65)');
      sunLighting.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

      ctx.fillStyle = sunLighting;
      ctx.fillRect(-earthRadius, -earthRadius, earthRadius * 2, earthRadius * 2);

      // Night Side Golden City Cluster Lights (on the shadow side)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
      for (let n = 0; n < 15; n++) {
        const nLon = (((n * 24 + (rotationAngle * 180) / Math.PI + 180) % 360) - 180) * (Math.PI / 180);
        const nLat = (((n % 7) - 3) * 15 * Math.PI) / 180;
        const nx3d = Math.cos(nLat) * Math.sin(nLon);
        const ny3d = -Math.sin(nLat);
        const nz3d = Math.cos(nLat) * Math.cos(nLon);

        // If on the dark right side of the globe
        if (nz3d > 0 && nx3d > 0.15) {
          const px = nx3d * earthRadius;
          const py = ny3d * earthRadius;
          ctx.fillRect(px, py, 3, 3);
          ctx.fillRect(px + 4, py + 2, 2, 2);
        }
      }

      ctx.restore(); // Restore Earth Clip

      // Planet Rim Specular Highlight
      const rimHighlight = ctx.createRadialGradient(0, 0, earthRadius * 0.92, 0, 0, earthRadius);
      rimHighlight.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rimHighlight.addColorStop(0.8, 'rgba(56, 189, 248, 0.3)');
      rimHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, earthRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
};

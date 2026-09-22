/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface AudioVisualizerBarProps {
  themeColor: string;
  secondaryColor: string;
}

export const AudioVisualizerBar: React.FC<AudioVisualizerBarProps> = ({ themeColor, secondaryColor }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = soundEngine.getFrequencyData();
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const barCount = 32;
      const gap = 3;
      const barWidth = (w - (barCount - 1) * gap) / barCount;

      for (let i = 0; i < barCount; i++) {
        const val = data[i] || 0;
        const barH = (val / 255) * h;
        const x = i * (barWidth + gap);
        const y = h - barH;

        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, themeColor);
        grad.addColorStop(1, secondaryColor);

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barH);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [themeColor, secondaryColor]);

  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
      <canvas ref={canvasRef} width={160} height={20} className="w-28 sm:w-36 h-4 opacity-90" />
    </div>
  );
};

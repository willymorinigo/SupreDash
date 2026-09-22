/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, Dices, Play } from 'lucide-react';
import { Difficulty } from '../types';

interface CustomSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchCustomLevel: (seed: number, bpm: number, difficulty: Difficulty, speed: number) => void;
}

export const CustomSeedModal: React.FC<CustomSeedModalProps> = ({
  isOpen,
  onClose,
  onLaunchCustomLevel,
}) => {
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 999999));
  const [bpm, setBpm] = useState<number>(140);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  if (!isOpen) return null;

  const handleRandomize = () => {
    setSeed(Math.floor(Math.random() * 999999));
  };

  const handleLaunch = () => {
    const baseSpeed = 420 * speedMultiplier;
    onLaunchCustomLevel(seed, bpm, difficulty, baseSpeed);
  };

  const difficulties: { key: Difficulty; label: string }[] = [
    { key: 'EASY', label: 'FÁCIL' },
    { key: 'NORMAL', label: 'NORMAL' },
    { key: 'HARD', label: 'DIFÍCIL' },
    { key: 'INSANE', label: 'EXTREMO' },
    { key: 'DEMON', label: 'DEMONIO' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="bg-[#0b0818] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-bold font-orbitron text-white">GENERADOR PROCEDURAL</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Controls */}
        <div className="flex flex-col gap-4">
          {/* Seed Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-cyan-300 font-semibold uppercase">Semilla de Generación</label>
            <div className="flex gap-2">
              <input
                id="custom-seed-input"
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="flex-1 bg-black/50 border border-white/20 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none"
              />
              <button
                id="randomize-seed-btn"
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold font-orbitron border border-white/10 transition-all cursor-pointer"
                title="Semilla Aleatoria"
              >
                <Dices size={16} /> ALEATORIO
              </button>
            </div>
          </div>

          {/* BPM Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-300 font-semibold uppercase">TEMPO (BPM): {bpm}</span>
              <span className="text-zinc-400">{bpm < 130 ? 'Tranquilo' : bpm < 160 ? 'Rápido' : 'Hiper'}</span>
            </div>
            <input
              id="custom-bpm-slider"
              type="range"
              min={110}
              max={200}
              step={2}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Speed Multiplier */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-300 font-semibold uppercase">VELOCIDAD: {speedMultiplier}x</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.8, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                    speedMultiplier === s
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Tier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-cyan-300 font-semibold uppercase">Densidad y Dificultad</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {difficulties.map((diff) => (
                <button
                  key={diff.key}
                  onClick={() => setDifficulty(diff.key)}
                  className={`py-2 rounded-lg text-xs font-bold font-orbitron transition-all cursor-pointer border ${
                    difficulty === diff.key
                      ? 'bg-pink-500/20 text-pink-300 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <button
          id="launch-custom-level-btn"
          onClick={handleLaunch}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold font-orbitron text-sm tracking-wider shadow-lg shadow-cyan-500/30 active:scale-98 transition-all cursor-pointer mt-2"
        >
          <Play size={18} fill="white" /> GENERAR Y JUGAR
        </button>
      </div>
    </div>
  );
};

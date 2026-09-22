/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Palette, ArrowLeft, Check, Flame, Zap, CircleDot } from 'lucide-react';
import { PlayerCustomization } from '../types';

interface SkinCustomizerProps {
  customization: PlayerCustomization;
  onUpdateCustomization: (custom: PlayerCustomization) => void;
  onBack: () => void;
}

const SKINS = [
  { id: 'classic', name: 'Classic Pulse', icon: '✦', desc: 'The iconic glowing cyber runner cube.' },
  { id: 'cyborg', name: 'Cyborg Visor', icon: '■', desc: 'Robotic sensor visor with laser scanline.' },
  { id: 'ninja', name: 'Shadow Shinobi', icon: '▲', desc: 'Stealth combat plate with sleek headband.' },
  { id: 'demon', name: 'Vortex Fiend', icon: '◈', desc: 'Sharp angular cyber horns and demon eyes.' },
];

const NEON_COLORS = [
  { name: 'Cyan Blast', hex: '#06b6d4' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Electric Emerald', hex: '#10b981' },
  { name: 'Solar Yellow', hex: '#eab308' },
  { name: 'Ultra Violet', hex: '#a855f7' },
  { name: 'Crimson Fury', hex: '#ef4444' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Pure White', hex: '#ffffff' },
];

const TRAILS = [
  { id: 'glow', name: 'Neon Glow', icon: CircleDot },
  { id: 'rainbow', name: 'Chroma Rainbow', icon: Sparkles },
  { id: 'particles', name: 'Spark Storm', icon: Zap },
  { id: 'fire', name: 'Plasma Jet', icon: Flame },
];

export const SkinCustomizer: React.FC<SkinCustomizerProps> = ({
  customization,
  onUpdateCustomization,
  onBack,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#080514] overflow-y-auto animate-fade-in p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <button
          id="skin-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-orbitron font-bold border border-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> BACK TO MENU
        </button>
        <h1 className="text-2xl sm:text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400">
          CYBER GARAGE
        </h1>
        <div className="w-24" />
      </div>

      <div className="max-w-4xl w-full mx-auto py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Preview Column */}
        <div className="flex flex-col items-center justify-center bg-black/60 border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 neon-grid-pattern opacity-30" />
          <div className="text-xs font-mono text-cyan-300 tracking-widest uppercase mb-6 relative z-10">
            HOLOGRAPHIC PREVIEW
          </div>

          {/* Glowing Animated Cube Box */}
          <div
            className="w-28 h-28 rounded-2xl relative flex items-center justify-center transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: customization.primaryColor,
              boxShadow: `0 0 35px ${customization.primaryColor}, inset 0 0 15px rgba(255,255,255,0.4)`
            }}
          >
            {/* Inner plate */}
            <div
              className="w-20 h-20 rounded-xl relative flex items-center justify-center"
              style={{ backgroundColor: customization.secondaryColor }}
            >
              {/* Face Details */}
              {customization.skinId === 'cyborg' && (
                <div className="w-10 h-3 bg-cyan-300 rounded shadow-[0_0_10px_#06b6d4]" />
              )}
              {customization.skinId === 'demon' && (
                <div className="flex gap-3">
                  <div className="w-3 h-5 bg-white transform -rotate-12" />
                  <div className="w-3 h-5 bg-white transform rotate-12" />
                </div>
              )}
              {customization.skinId === 'ninja' && (
                <div className="w-14 h-4 bg-zinc-900 rounded flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
              {customization.skinId === 'classic' && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 bg-white rounded-sm" />
                    <div className="w-3.5 h-3.5 bg-white rounded-sm" />
                  </div>
                  <div className="w-7 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center relative z-10">
            <div className="font-orbitron font-bold text-lg text-white">
              {SKINS.find((s) => s.id === customization.skinId)?.name}
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Trail: {TRAILS.find((t) => t.id === customization.trailType)?.name}
            </p>
          </div>
        </div>

        {/* Options Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Skin Type */}
          <div>
            <h3 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3">
              1. CUBE AVATAR ICON
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => onUpdateCustomization({ ...customization, skinId: skin.id })}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                    customization.skinId === skin.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl mb-1">{skin.icon}</span>
                  <span className="font-orbitron text-xs font-bold">{skin.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <h3 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3">
              2. PRIMARY NEON HUE
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {NEON_COLORS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => onUpdateCustomization({ ...customization, primaryColor: col.hex })}
                  className="w-full aspect-square rounded-xl border-2 transition-all transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-md"
                  style={{
                    backgroundColor: col.hex,
                    borderColor: customization.primaryColor === col.hex ? '#ffffff' : 'transparent',
                    boxShadow: customization.primaryColor === col.hex ? `0 0 15px ${col.hex}` : 'none'
                  }}
                  title={col.name}
                >
                  {customization.primaryColor === col.hex && <Check size={16} className="text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <h3 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3">
              3. SECONDARY ACCENT HUE
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {NEON_COLORS.map((col) => (
                <button
                  key={`sec-${col.hex}`}
                  onClick={() => onUpdateCustomization({ ...customization, secondaryColor: col.hex })}
                  className="w-full aspect-square rounded-xl border-2 transition-all transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-md"
                  style={{
                    backgroundColor: col.hex,
                    borderColor: customization.secondaryColor === col.hex ? '#ffffff' : 'transparent',
                    boxShadow: customization.secondaryColor === col.hex ? `0 0 15px ${col.hex}` : 'none'
                  }}
                  title={col.name}
                >
                  {customization.secondaryColor === col.hex && <Check size={16} className="text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Trail Type */}
          <div>
            <h3 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3">
              4. MOTION TRAIL FX
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRAILS.map((trail) => {
                const Icon = trail.icon;
                return (
                  <button
                    key={trail.id}
                    onClick={() => onUpdateCustomization({ ...customization, trailType: trail.id as any })}
                    className={`p-3 rounded-xl border flex items-center gap-2 justify-center text-xs font-orbitron font-bold transition-all cursor-pointer ${
                      customization.trailType === trail.id
                        ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{trail.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

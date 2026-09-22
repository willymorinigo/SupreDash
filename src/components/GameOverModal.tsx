/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Map, Shield, TrendingUp, Heart, ShoppingBag } from 'lucide-react';
import { Difficulty } from '../types';

interface GameOverModalProps {
  percentage: number;
  bestPercentage: number;
  attempt: number;
  difficulty: Difficulty;
  isPracticeMode: boolean;
  onRestart: () => void;
  onExitToMenu: () => void;
  onOpenStore: () => void;
  onTogglePracticeMode: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  percentage,
  bestPercentage,
  attempt,
  difficulty,
  isPracticeMode,
  onRestart,
  onExitToMenu,
  onOpenStore,
  onTogglePracticeMode,
}) => {
  const isNewBest = percentage > bestPercentage && !isPracticeMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="bg-[#11071d] border border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_45px_rgba(244,63,94,0.35)] flex flex-col items-center gap-5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-mono tracking-widest uppercase mb-1">
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            <span>{isPracticeMode ? 'IMPACTO EN PRÁCTICA' : 'VIDAS AGOTADAS'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-pink-500">
            {isPracticeMode ? 'INTENTA DE NUEVO' : 'FIN DE PARTIDA'}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            ¡Tus 5 vidas se recargarán al reiniciar sin costo de monedas!
          </p>
        </div>

        {/* Progress Percentage Display */}
        <div className="flex flex-col items-center justify-center bg-black/50 border border-white/10 rounded-2xl p-4 w-full">
          <div className="text-5xl font-black font-orbitron text-white tracking-tight">
            {Math.floor(percentage)}%
          </div>
          {isNewBest && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 mt-1 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-orbitron">
              <TrendingUp size={12} /> ¡NUEVO RÉCORD!
            </div>
          )}
          {!isNewBest && !isPracticeMode && (
            <div className="text-xs text-zinc-400 mt-1 font-mono">
              Mejor Marca: {Math.floor(bestPercentage)}%
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col">
            <span className="text-zinc-400">INTENTO</span>
            <span className="text-white font-bold text-base font-orbitron">{attempt}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col">
            <span className="text-zinc-400">DIFICULTAD</span>
            <span className="text-cyan-300 font-bold text-base font-orbitron">{difficulty}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="gameover-retry-btn"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold font-orbitron text-sm tracking-wider shadow-lg shadow-rose-500/30 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw size={18} />
            REINTENTAR (5 VIDAS)
          </button>

          <button
            id="gameover-practice-btn"
            onClick={onTogglePracticeMode}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wider border transition-all cursor-pointer ${
              isPracticeMode
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Shield size={15} />
            {isPracticeMode ? 'MODO PRÁCTICA ACTIVO' : 'CAMBIAR A MODO PRÁCTICA'}
          </button>

          <div className="flex items-center gap-2 w-full">
            <button
              id="gameover-store-btn"
              onClick={onOpenStore}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-xs font-bold font-orbitron border border-purple-500/30 transition-all cursor-pointer"
            >
              <ShoppingBag size={14} />
              TIENDA
            </button>

            <button
              id="gameover-menu-btn"
              onClick={onExitToMenu}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold font-orbitron border border-white/10 transition-all cursor-pointer"
            >
              <Map size={14} />
              MAPAMUNDI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

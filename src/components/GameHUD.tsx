/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Pause, Plus, Trash2, Shield, Heart, Disc3, Home, Maximize2, Minimize2, Smartphone } from 'lucide-react';
import { AudioTrack, Difficulty } from '../types';
import { AudioVisualizerBar } from './AudioVisualizerBar';

interface GameHUDProps {
  progressPercent: number;
  attempt: number;
  coins: number;
  maxCoins: number;
  lives: number;
  maxLives: number;
  track: AudioTrack;
  difficulty: Difficulty;
  isPracticeMode: boolean;
  checkpointsCount: number;
  bpm: number;
  onPause: () => void;
  onExitToMenu: () => void;
  onPlaceCheckpoint: () => void;
  onDeleteCheckpoint: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  progressPercent,
  attempt,
  coins,
  maxCoins,
  lives,
  maxLives,
  track,
  difficulty,
  isPracticeMode,
  checkpointsCount,
  bpm,
  onPause,
  onExitToMenu,
  onPlaceCheckpoint,
  onDeleteCheckpoint,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      // Try locking screen orientation to landscape if available
      try {
        (window.screen.orientation as any)?.lock?.('landscape')?.catch(() => {});
      } catch {}
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };
  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'EASY':
        return (
          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-orbitron uppercase">
            Fácil
          </span>
        );
      case 'NORMAL':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-orbitron uppercase">
            Normal
          </span>
        );
      case 'HARD':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-orbitron uppercase">
            Difícil
          </span>
        );
      case 'INSANE':
        return (
          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-orbitron uppercase">
            Extremo
          </span>
        );
      case 'DEMON':
        return (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-orbitron uppercase">
            Demonio
          </span>
        );
      case 'ENDLESS':
        return (
          <span className="bg-pink-500/20 text-pink-400 border border-pink-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-orbitron uppercase">
            Infinito
          </span>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Track Info & Country Flag */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
            {track.flagEmoji && <span className="text-lg">{track.flagEmoji}</span>}
            <div className="flex items-center gap-1.5">
              <Disc3
                className="w-4 h-4 text-pink-400 animate-spin"
                style={{ animationDuration: `${(60 / bpm) * 2}s` }}
              />
              <span className="font-orbitron text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-none">
                {track.title}
              </span>
            </div>
            <div className="text-xs text-cyan-300 font-mono hidden sm:inline-block font-semibold">
              {bpm} BPM
            </div>
            {getDifficultyBadge(difficulty)}
            {isPracticeMode && (
              <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase flex items-center gap-1">
                <Shield size={12} /> Práctica
              </span>
            )}
          </div>

          {/* Audio Visualizer, Exit/Home Button, Fullscreen/Landscape & Pause Button */}
          <div className="flex items-center gap-2">
            <AudioVisualizerBar themeColor={track.themeColor} secondaryColor={track.secondaryColor} />

            <button
              id="fullscreen-landscape-btn"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white border border-white/20 transition-all shadow-md backdrop-blur-md pointer-events-auto cursor-pointer font-orbitron text-xs font-bold"
              title="Modo Horizontal / Pantalla Completa"
            >
              {isFullscreen ? <Minimize2 size={15} className="text-cyan-400" /> : <Maximize2 size={15} className="text-cyan-400" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Ventana' : 'Horizontal'}</span>
            </button>
            
            <button
              id="exit-level-btn"
              onClick={onExitToMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white border border-white/20 transition-all shadow-md backdrop-blur-md pointer-events-auto cursor-pointer font-orbitron text-xs font-bold"
              title="Salir del Nivel y Volver al Mapa/Inicio"
            >
              <Home size={15} className="text-blue-400" />
              <span className="hidden sm:inline">Salir</span>
            </button>

            <button
              id="pause-game-btn"
              onClick={onPause}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-white border border-white/20 transition-all shadow-md backdrop-blur-md pointer-events-auto cursor-pointer"
              title="Pausar Juego (ESC)"
            >
              <Pause size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar with Percentage */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 bg-black/70 backdrop-blur-md rounded-full h-3 sm:h-3.5 p-0.5 border border-white/20 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-75 relative"
              style={{
                width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                background: `linear-gradient(90deg, ${track.themeColor}, ${track.secondaryColor})`,
                boxShadow: `0 0 10px ${track.themeColor}`,
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full opacity-80" />
            </div>
          </div>
          <div className="font-orbitron font-bold text-xs sm:text-sm text-white drop-shadow min-w-[45px] text-right">
            {Math.floor(progressPercent)}%
          </div>
        </div>
      </div>

      {/* Bottom HUD Bar: 5 Lives Indicator & Attempt Stats */}
      <div className="flex justify-between items-end pointer-events-auto">
        {/* Left Side: 5 Lives System + Level Coins + Attempt */}
        <div className="flex flex-col gap-1.5 bg-black/65 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs font-mono shadow-xl">
          {/* 5 Hearts Lives Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold text-[11px]">VIDAS:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: maxLives }).map((_, i) => {
                const isAlive = i < lives;
                return (
                  <Heart
                    key={i}
                    size={18}
                    className={`transition-all duration-200 ${
                      isAlive
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-100'
                        : 'text-zinc-600 fill-transparent scale-90 opacity-40'
                    } ${lives === 1 && isAlive ? 'animate-pulse text-red-400 fill-red-400' : ''}`}
                  />
                );
              })}
            </div>
            <span className="font-orbitron font-bold text-xs text-rose-400 ml-1">
              {lives}/{maxLives}
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-300 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">INTENTO:</span>
              <span className="font-bold text-white font-orbitron text-xs">{attempt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400">★ MONEDAS:</span>
              <span className="font-bold text-yellow-300 font-orbitron text-xs">
                {coins} / {maxCoins}
              </span>
            </div>
          </div>
        </div>

        {/* Practice Mode Controls Overlay */}
        {isPracticeMode && (
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-green-500/40 shadow-xl">
            <button
              id="hud-place-checkpoint"
              onClick={onPlaceCheckpoint}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              title="Colocar Checkpoint (Tecla Z)"
            >
              <Plus size={16} />
              <span>Punto [Z]</span>
            </button>
            <button
              id="hud-delete-checkpoint"
              onClick={onDeleteCheckpoint}
              disabled={checkpointsCount === 0}
              className="flex items-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              title="Borrar Último Checkpoint (Tecla X)"
            >
              <Trash2 size={16} />
              <span>Deshacer [X] ({checkpointsCount})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

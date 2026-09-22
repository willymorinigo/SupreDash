/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Globe,
  ShoppingBag,
  Infinity,
  Volume2,
  VolumeX,
  KeyRound,
  Sparkles,
  Trophy,
  Coins,
  Cpu,
  Gem,
  Factory,
  Crown,
  User,
  Swords,
} from 'lucide-react';
import { GameStats, PlayerCustomization } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { RotatingEarth } from './RotatingEarth';

interface MainMenuProps {
  stats: GameStats;
  customization: PlayerCustomization;
  onOpenWorldMap: () => void;
  onOpenPlatformer: () => void;
  onOpenStore: () => void;
  onOpenTycoon: () => void;
  onPlayEndless: () => void;
  onOpenSeedModal: () => void;
  onOpenProfile: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  customization,
  onOpenWorldMap,
  onOpenPlatformer,
  onOpenStore,
  onOpenTycoon,
  onPlayEndless,
  onOpenSeedModal,
  onOpenProfile,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [isBattleMusicActive, setIsBattleMusicActive] = useState<boolean>(true);

  // Start medieval battle music upon entering menu
  useEffect(() => {
    soundEngine.startMenuBattleMusic();
    setIsBattleMusicActive(true);

    return () => {
      soundEngine.stopMenuBattleMusic();
    };
  }, []);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const handleToggleBattleMusic = () => {
    const active = soundEngine.toggleMenuBattleMusic();
    setIsBattleMusicActive(active);
  };

  const floor1Machines = stats.tycoon?.floor1PurchasedMachines?.length || 0;
  const floor2Machines = stats.tycoon?.floor2PurchasedMachines?.length || 0;
  const coinsRate = floor1Machines * 5;
  const diamondsRate = floor2Machines * 1;

  const profile = stats.userProfile || {
    username: 'Comandante Dash',
    avatarIcon: '👑',
    rankTitle: 'Conquistador',
    countryFlag: '🌎',
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#03060f] text-white flex flex-col justify-between p-3 sm:p-8 select-none overflow-y-auto">
      {/* 3D ROTATING PLANET EARTH IN SPACE WITH TWINKLING STARS */}
      <RotatingEarth />

      {/* Top Bar: Profile Badge, Coins, Diamonds & Audio Toggles */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Player Profile Button */}
          <button
            id="menu-profile-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 active:scale-95 px-3.5 py-1.5 rounded-2xl border border-cyan-500/40 shadow-lg backdrop-blur-md transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-base shadow">
              {profile.avatarIcon}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="font-orbitron font-bold text-xs text-white truncate max-w-[110px] sm:max-w-[150px]">
                  {profile.username}
                </span>
                <span className="text-xs">{profile.countryFlag}</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-300 truncate max-w-[110px] sm:max-w-[150px]">
                {profile.rankTitle}
              </span>
            </div>
          </button>

          {/* Coins Badge */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-yellow-500/40 shadow-lg backdrop-blur-md">
            <Coins className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-400 font-mono">MONEDAS</span>
              <span className="font-orbitron font-bold text-yellow-300 text-xs sm:text-sm leading-tight">
                {stats.coinsBalance}
              </span>
            </div>
          </div>

          {/* Diamonds Badge */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-blue-400/40 shadow-lg backdrop-blur-md">
            <Gem className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-400 font-mono">DIAMANTES</span>
              <span className="font-orbitron font-bold text-blue-300 text-xs sm:text-sm leading-tight">
                {stats.diamondsBalance}
              </span>
            </div>
          </div>
        </div>

        {/* Audio / Medieval Music Buttons */}
        <div className="flex items-center gap-2">
          {/* Medieval Battle Music Toggle */}
          <button
            id="mainmenu-battle-music-btn"
            onClick={handleToggleBattleMusic}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border transition-all cursor-pointer text-xs font-mono font-bold backdrop-blur-md active:scale-95 ${
              isBattleMusicActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
                : 'bg-slate-900/60 border-white/10 text-zinc-400'
            }`}
            title="Música de Batalla Medieval del Menú"
          >
            <Swords size={16} className={isBattleMusicActive ? 'text-amber-400 animate-pulse' : 'text-zinc-400'} />
            <span className="hidden sm:inline">Música Medieval</span>
          </button>

          {/* Global Mute Toggle */}
          <button
            id="mainmenu-mute-btn"
            onClick={handleToggleMute}
            className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 active:scale-95 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md backdrop-blur-md"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-blue-400" />}
          </button>
        </div>
      </div>

      {/* Center Hero & Logo */}
      <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center gap-4 sm:gap-5 my-auto z-10 py-3 sm:py-6">
        {/* Planet Cultural Arcade Badge */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-widest text-blue-200 uppercase bg-blue-950/80 border border-blue-400/30 px-3.5 py-1 rounded-full shadow-md backdrop-blur-md">
          <Sparkles size={13} className="text-yellow-400" />
          <span>WORLD RHYTHM & EMPIRES ARCADE</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-7xl md:text-8xl font-black font-orbitron text-white tracking-tight drop-shadow-2xl">
          SUPER DASH
        </h1>

        <p className="text-xs sm:text-sm font-mono text-zinc-200 max-w-lg drop-shadow-md bg-black/40 p-2.5 rounded-xl backdrop-blur-xs border border-white/10">
          Viaja por el planeta Tierra y sus ciudades culturales con música auténtica, o juega el nuevo Modo Plataforma de Imperios con controles táctiles o W, A, S, D.
        </p>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-1 sm:mt-2">
          {/* Main Campaign: Mapamundi */}
          <button
            id="menu-worldmap-btn"
            onClick={onOpenWorldMap}
            className="flex items-center justify-center gap-3 py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black font-orbitron text-sm sm:text-base tracking-wider shadow-xl active:scale-98 transition-all cursor-pointer border border-blue-400/40"
          >
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>MAPAMUNDI (PAÍSES)</span>
          </button>

          {/* Brand New: Platformer Mode */}
          <button
            id="menu-platformer-btn"
            onClick={onOpenPlatformer}
            className="flex items-center justify-center gap-3 py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-orange-500 text-white font-black font-orbitron text-sm sm:text-base tracking-wider shadow-xl active:scale-98 transition-all cursor-pointer border border-amber-400/40"
          >
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
            <span>MODO PLATAFORMA</span>
          </button>

          {/* Zona Abandonada / Tycoon Mode Button */}
          <button
            id="menu-tycoon-btn"
            onClick={onOpenTycoon}
            className="sm:col-span-2 flex items-center justify-between py-3 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-amber-950/70 to-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-white font-bold font-orbitron text-xs sm:text-sm tracking-wide shadow-lg transition-all active:scale-98 cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-bounce" />
              <div className="text-left">
                <div className="text-amber-300 font-black">FÁBRICA ABANDONADA (TYCOON)</div>
                <div className="text-[9px] sm:text-[10px] font-mono text-zinc-300 font-normal">
                  Prende las antorchas, restaura la fábrica y genera monedas y diamantes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {coinsRate > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                  +{coinsRate} 🟡/s
                </span>
              )}
              {diamondsRate > 0 && (
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-400/40">
                  +{diamondsRate} 💎/s
                </span>
              )}
            </div>
          </button>

          {/* Supermarket Skin Store */}
          <button
            id="menu-store-btn"
            onClick={onOpenStore}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-yellow-500/40 text-yellow-300 hover:text-white font-bold font-orbitron text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-98 cursor-pointer backdrop-blur-md"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span>TIENDA SUPERMERCADO</span>
          </button>

          {/* Endless Mode */}
          <button
            id="menu-endless-btn"
            onClick={onPlayEndless}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#0d1d28]/80 hover:bg-[#14293a] border border-cyan-500/40 text-cyan-300 hover:text-white font-bold font-orbitron text-xs sm:text-sm tracking-wide shadow-lg transition-all active:scale-98 cursor-pointer backdrop-blur-md"
          >
            <Infinity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span>MODO INFINITO</span>
          </button>

          {/* Custom Seed Level Generator */}
          <button
            id="menu-seed-btn"
            onClick={onOpenSeedModal}
            className="sm:col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold font-orbitron text-[11px] sm:text-xs transition-all cursor-pointer backdrop-blur-md"
          >
            <KeyRound size={14} />
            <span>GENERAR NIVEL CON CÓDIGO DE SEMILLA</span>
          </button>
        </div>
      </div>

      {/* Footer Controls info */}
      <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-mono text-zinc-300 z-10 border-t border-white/10 pt-3">
        <div>Controles: <strong>ESPACIO / CLICK / TAP</strong> en Ritmo • <strong>W, A, S, D / Botones táctiles</strong> en Plataforma</div>
        <div>Super Dash • Móvil & Desktop • 7 Vehículos • 5 Vidas</div>
      </div>
    </div>
  );
};



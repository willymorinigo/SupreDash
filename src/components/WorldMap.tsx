/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Shield, Star, Trophy, Sparkles, Coins, ShoppingBag } from 'lucide-react';
import { ContinentData, CountryLevel, GameStats } from '../types';
import { CONTINENTS_DATA } from '../game/worldData';

interface WorldMapProps {
  stats: GameStats;
  onSelectCountry: (country: CountryLevel, isPractice: boolean) => void;
  onOpenStore: () => void;
  onBackToMenu: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  stats,
  onSelectCountry,
  onOpenStore,
  onBackToMenu,
}) => {
  const [activeContinentId, setActiveContinentId] = useState<string>('south-america');

  const activeContinent = CONTINENTS_DATA.find((c) => c.id === activeContinentId) || CONTINENTS_DATA[0];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10';
      case 'NORMAL':
        return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
      case 'HARD':
        return 'border-amber-500/50 text-amber-400 bg-amber-500/10';
      case 'INSANE':
        return 'border-purple-500/50 text-purple-400 bg-purple-500/10';
      case 'DEMON':
        return 'border-rose-500/50 text-rose-400 bg-rose-500/10';
      default:
        return 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10';
    }
  };

  const getDifficultyName = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'FÁCIL';
      case 'NORMAL':
        return 'NORMAL';
      case 'HARD':
        return 'DIFÍCIL';
      case 'INSANE':
        return 'EXTREMO';
      case 'DEMON':
        return 'DEMONIO';
      default:
        return diff;
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#070512] text-white flex flex-col overflow-y-auto select-none p-4 sm:p-6">
      {/* Top Header Bar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4 mb-6 z-10">
        <button
          id="worldmap-back-btn"
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer font-semibold text-sm"
        >
          <ArrowLeft size={18} />
          <span>Menú Principal</span>
        </button>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400 tracking-wider">
            MAPAMUNDI SUPER DASH
          </h1>
          <p className="text-xs text-zinc-400 font-mono hidden sm:block">
            6 Continentes • 30 Países • Desafíos Musicales Culturales
          </p>
        </div>

        {/* Coins Balance & Store Quick Link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 px-3.5 py-1.5 rounded-xl border border-yellow-500/40 shadow-lg">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-orbitron font-bold text-yellow-300 text-sm">{stats.coinsBalance}</span>
          </div>
          <button
            id="worldmap-store-btn"
            onClick={onOpenStore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-95 text-white font-bold text-xs font-orbitron transition-all shadow-md cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span className="hidden sm:inline">Tienda</span>
          </button>
        </div>
      </div>

      {/* Continents Navigation Tabs */}
      <div className="w-full max-w-7xl mx-auto mb-6 z-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CONTINENTS_DATA.map((continent) => {
            const isActive = continent.id === activeContinentId;
            return (
              <button
                key={continent.id}
                id={`continent-tab-${continent.id}`}
                onClick={() => setActiveContinentId(continent.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-orbitron text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-102 border border-cyan-300/40'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                <span className="text-base">{continent.icon}</span>
                <span>{continent.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-cyan-300 font-mono">
                  {continent.countries.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Continent Tagline Banner */}
      <div className="w-full max-w-7xl mx-auto mb-6 z-10">
        <div className="bg-gradient-to-r from-white/5 via-white/10 to-transparent p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeContinent.icon}</span>
              <h2 className="text-xl font-bold font-orbitron text-white">{activeContinent.name}</h2>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">{activeContinent.tagline}</p>
          </div>
          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl">
            5 Países • 5 Vidas por Nivel
          </div>
        </div>
      </div>

      {/* 5 Country Levels Grid */}
      <div className="w-full max-w-7xl mx-auto flex-1 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeContinent.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12"
          >
            {activeContinent.countries.map((country, index) => {
              const bestScore = stats.highScores[country.id] || 0;
              const isCompleted = bestScore >= 100;
              const stars = stats.levelStars[country.id] || (isCompleted ? 3 : bestScore > 50 ? 2 : bestScore > 0 ? 1 : 0);

              return (
                <div
                  key={country.id}
                  id={`country-card-${country.id}`}
                  className="bg-[#110b24]/90 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-500/50 p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.18)] group"
                  style={{
                    borderLeft: `4px solid ${country.themeColor}`,
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{country.flagEmoji}</span>
                        <div>
                          <h3 className="font-orbitron font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                            {country.countryName}
                          </h3>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Nivel {index + 1}: {country.levelName}
                          </span>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-orbitron border ${getDifficultyColor(country.difficulty)}`}>
                        {getDifficultyName(country.difficulty)}
                      </span>
                    </div>

                    {/* Cultural Theme & Rhythm description */}
                    <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 my-2">
                      <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-yellow-400" />
                        <span>{country.culturalTheme}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {country.description}
                      </p>
                    </div>

                    {/* Track Specs */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                      <span>Tempo: <strong className="text-white">{country.bpm} BPM</strong></span>
                      <span>Velocidad: <strong className="text-cyan-300">{country.baseSpeed} px/s</strong></span>
                      <span className="text-yellow-400 flex items-center gap-1">
                        <Coins size={12} /> +{country.rewardCoins}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-2.5">
                    {/* Stars and Record */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((starNum) => (
                          <Star
                            key={starNum}
                            size={16}
                            className={
                              starNum <= stars
                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                                : 'text-zinc-600'
                            }
                          />
                        ))}
                      </div>
                      <div className="text-xs font-mono font-bold">
                        {isCompleted ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Trophy size={13} /> 100% COMPLETADO
                          </span>
                        ) : bestScore > 0 ? (
                          <span className="text-cyan-300">Récord: {Math.floor(bestScore)}%</span>
                        ) : (
                          <span className="text-zinc-500">Sin Intentos</span>
                        )}
                      </div>
                    </div>

                    {/* Play Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        id={`play-btn-${country.id}`}
                        onClick={() => onSelectCountry(country, false)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-bold font-orbitron text-xs tracking-wider shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                      >
                        <Play size={14} fill="white" />
                        <span>JUGAR</span>
                      </button>

                      <button
                        id={`practice-btn-${country.id}`}
                        onClick={() => onSelectCountry(country, true)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold font-orbitron transition-all cursor-pointer"
                        title="Modo Práctica (con Checkpoints)"
                      >
                        <Shield size={14} className="text-emerald-400" />
                        <span className="hidden sm:inline">Práctica</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

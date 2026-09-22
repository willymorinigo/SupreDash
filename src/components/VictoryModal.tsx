/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Star, RotateCcw, ArrowRight, Coins, Sparkles, Map } from 'lucide-react';
import { AudioTrack, Difficulty, LevelResultReward } from '../types';

interface VictoryModalProps {
  track: AudioTrack;
  difficulty: Difficulty;
  attempt: number;
  reward: LevelResultReward;
  onReplay: () => void;
  onNextLevel: () => void;
  onExitToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  track,
  difficulty,
  attempt,
  reward,
  onReplay,
  onNextLevel,
  onExitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="bg-[#091811] border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.35)] flex flex-col items-center gap-4">
        {/* Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)]">
          <Trophy className="w-9 h-9 text-emerald-400 animate-bounce" />
        </div>

        {/* Title */}
        <div>
          <div className="text-emerald-400 text-xs font-mono tracking-widest uppercase mb-1">
            ¡NIVEL COMPLETADO 100%!
          </div>
          <h2 className="text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            ¡VICTORIA!
          </h2>
          <p className="text-zinc-300 text-xs font-mono mt-1">
            {track.flagEmoji} {track.title}
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-6 h-6 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <Star className="w-7 h-7 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <Star className="w-6 h-6 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>

        {/* Coin Rewards Breakdown Box */}
        <div className="bg-black/60 border border-yellow-500/40 rounded-2xl p-3.5 w-full flex flex-col gap-2">
          <div className="text-xs font-orbitron font-bold text-yellow-400 flex items-center justify-between pb-1 border-b border-white/10">
            <span className="flex items-center gap-1">
              <Coins size={15} /> RECOMPENSAS GANADAS
            </span>
            <span className="text-sm text-yellow-300">+{reward.totalCoinsEarned} MONEDAS</span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] font-mono text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-400">Monedas en pista:</span>
              <span className="text-yellow-400">+{reward.levelCoinsCollected * 10}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Bono por completar nivel:</span>
              <span className="text-emerald-400">+{reward.completionBonus}</span>
            </div>
            {reward.isPerfect && (
              <div className="flex justify-between items-center bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold font-orbitron text-[10px]">
                <span className="flex items-center gap-1">
                  <Sparkles size={11} /> ¡BONO PERFECT RUN!
                </span>
                <span>+{reward.perfectBonus}</span>
              </div>
            )}
            {reward.attemptBonus > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Bono primer intento:</span>
                <span className="text-cyan-300">+{reward.attemptBonus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <button
            id="victory-next-level-btn"
            onClick={onNextLevel}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold font-orbitron text-sm tracking-wider shadow-lg shadow-emerald-500/30 active:scale-98 transition-all cursor-pointer"
          >
            <span>SIGUIENTE PAÍS</span>
            <ArrowRight size={18} />
          </button>

          <button
            id="victory-replay-btn"
            onClick={onReplay}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold font-orbitron border border-white/10 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw size={15} /> REPETIR NIVEL
          </button>

          <button
            id="victory-menu-btn"
            onClick={onExitToMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold font-orbitron border border-white/10 transition-all cursor-pointer"
          >
            <Map size={15} /> MAPAMUNDI
          </button>
        </div>
      </div>
    </div>
  );
};

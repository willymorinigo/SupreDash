/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Shield, Map } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  onExitToWorldMap?: () => void;
  isPracticeMode: boolean;
  onTogglePracticeMode: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToMenu,
  onExitToWorldMap,
  isPracticeMode,
  onTogglePracticeMode,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="bg-[#0e0a1f] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col items-center gap-4">
        {/* Title */}
        <h2 className="text-3xl font-black font-orbitron tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400">
          PAUSA
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="pause-resume-btn"
            onClick={onResume}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold font-orbitron text-sm tracking-wider shadow-lg shadow-cyan-500/30 active:scale-98 transition-all cursor-pointer"
          >
            <Play size={18} fill="white" />
            CONTINUAR (ESPACIO)
          </button>

          <button
            id="pause-restart-btn"
            onClick={onRestart}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold font-orbitron text-xs tracking-wider border border-white/10 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw size={16} />
            REINICIAR (5 VIDAS)
          </button>

          <button
            id="pause-practice-toggle"
            onClick={onTogglePracticeMode}
            className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-xs font-bold font-orbitron tracking-wider border transition-all cursor-pointer ${
              isPracticeMode
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Shield size={16} />
            MODO PRÁCTICA: {isPracticeMode ? 'ACTIVADO' : 'DESACTIVADO'}
          </button>

          {/* Sound Mute */}
          <button
            id="pause-mute-btn"
            onClick={handleToggleMute}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-semibold font-orbitron border border-white/10 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-cyan-400" />}
            {isMuted ? 'ACTIVAR SONIDO' : 'SILENCIAR'}
          </button>

          {/* Navigation Options: Main Menu & Map */}
          <div className="grid grid-cols-2 gap-2 w-full pt-1">
            <button
              id="pause-mainmenu-btn"
              onClick={onExitToMenu}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold font-orbitron border border-rose-500/30 transition-all cursor-pointer min-h-[44px]"
            >
              <Home size={15} />
              MENÚ
            </button>

            <button
              id="pause-map-btn"
              onClick={onExitToWorldMap || onExitToMenu}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold font-orbitron border border-cyan-500/30 transition-all cursor-pointer min-h-[44px]"
            >
              <Map size={15} />
              MAPAMUNDI
            </button>
          </div>
        </div>

        <p className="text-zinc-400 text-xs font-mono">Presiona ESC o Barra Espaciadora para continuar</p>
      </div>
    </div>
  );
};

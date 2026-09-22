/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Trophy, Shield, Sparkles, Flag, Award, Edit3, Check, Globe2, Zap, Heart, Flame } from 'lucide-react';
import { GameStats, UserProfile } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface UserProfileModalProps {
  stats: GameStats;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
}

const AVAILABLE_FLAGS = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'EG', name: 'Egipto', flag: '🇪🇬' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
];

const AVAILABLE_AVATARS = ['⚡', '👑', '🛡️', '🦅', '🐉', '⚔️', '🦚', '🎩', '👾', '👽', '👨‍🚀', '💀', '💎', '🌟', '🎯', '🔥'];

const AVAILABLE_RANKS = [
  'Novato del Ritmo',
  'Saltador Veloz',
  'Guerrero de los Andes',
  'Conquistador de Imperios',
  'Maestro del Tango & Samba',
  'Explorador del Coliseo',
  'Leyenda Mundial Suprema',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ stats, onClose, onSaveProfile }) => {
  const current = stats.userProfile || {
    username: 'Comandante Dash',
    avatarIcon: '👑',
    rankTitle: 'Conquistador de Imperios',
    countryFlag: '🌎',
    bio: '¡Viajando por el mundo al ritmo de la música y conquistando imperios!',
    unlockedBadges: ['Primer Salto', 'Explorador Mundial'],
  };

  const [username, setUsername] = useState(current.username);
  const [avatarIcon, setAvatarIcon] = useState(current.avatarIcon);
  const [rankTitle, setRankTitle] = useState(current.rankTitle);
  const [countryFlag, setCountryFlag] = useState(current.countryFlag);
  const [bio, setBio] = useState(current.bio);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      username: username.trim() || 'Jugador Dash',
      avatarIcon,
      rankTitle,
      countryFlag,
      bio: bio.trim(),
      unlockedBadges: current.unlockedBadges || ['Primer Salto', 'Explorador Mundial'],
    };
    onSaveProfile(updated);
    soundEngine.playBuySuccessSound();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0e1726] to-[#080d1a] border border-blue-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Close Button */}
        <button
          id="close-profile-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg">
            <User size={26} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
              PERFIL DE JUGADOR
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Personaliza tu identidad, nacionalidad y revisa tus logros
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Avatar & Basic Info Card */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-blue-400/20 flex flex-col sm:flex-row items-center gap-5">
            {/* Big Avatar Display */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-white/40 flex items-center justify-center text-4xl shadow-xl">
                {avatarIcon}
              </div>
              <div className="absolute -bottom-2 -right-2 text-2xl bg-black/80 rounded-full p-1 border border-white/30">
                {countryFlag}
              </div>
            </div>

            <div className="flex-1 w-full space-y-3 text-center sm:text-left">
              <div>
                <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                  Nombre de Jugador
                </label>
                <input
                  id="profile-username-input"
                  type="text"
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu apodo de juego..."
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm font-orbitron font-bold text-white focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Rango / Título Honorífico
                </label>
                <select
                  id="profile-rank-select"
                  value={rankTitle}
                  onChange={(e) => setRankTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-semibold text-yellow-300 focus:border-yellow-400 focus:outline-none cursor-pointer"
                >
                  {AVAILABLE_RANKS.map((r, i) => (
                    <option key={i} value={r} className="bg-slate-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Select Avatar Icon */}
          <div>
            <label className="text-xs font-mono text-zinc-300 uppercase font-bold block mb-2">
              Elegir Emblema / Avatar
            </label>
            <div className="grid grid-cols-8 gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/10">
              {AVAILABLE_AVATARS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarIcon(av)}
                  className={`h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer ${
                    avatarIcon === av
                      ? 'bg-blue-600 border-2 border-white scale-110 shadow-lg'
                      : 'bg-white/5 hover:bg-white/15'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Select Nationality / Flag */}
          <div>
            <label className="text-xs font-mono text-zinc-300 uppercase font-bold block mb-2">
              Elegir Bandera / País Representado
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/10 max-h-36 overflow-y-auto">
              {AVAILABLE_FLAGS.map((f) => (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => setCountryFlag(f.flag)}
                  title={f.name}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    countryFlag === f.flag
                      ? 'bg-emerald-600/60 border-2 border-emerald-400 scale-105 shadow-md'
                      : 'bg-white/5 hover:bg-white/15'
                  }`}
                >
                  <span className="text-xl">{f.flag}</span>
                  <span className="text-[9px] font-mono text-zinc-300 truncate max-w-[50px]">{f.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio / Motto Input */}
          <div>
            <label className="text-xs font-mono text-zinc-300 uppercase font-bold block mb-1">
              Biografía / Lema de Batalla
            </label>
            <textarea
              id="profile-bio-input"
              rows={2}
              maxLength={120}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escribe tu lema o frase favorita..."
              className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-zinc-200 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          {/* Career Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
            <div className="flex flex-col items-center justify-center p-2 bg-black/40 rounded-xl">
              <span className="text-[10px] font-mono text-zinc-400">SALTOS TOTALES</span>
              <span className="text-base font-black font-orbitron text-cyan-300">{stats.jumps}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-black/40 rounded-xl">
              <span className="text-[10px] font-mono text-zinc-400">NIVELES RITMO</span>
              <span className="text-base font-black font-orbitron text-emerald-300">{stats.levelsCompleted}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-black/40 rounded-xl">
              <span className="text-[10px] font-mono text-zinc-400">MONEDAS 🪙</span>
              <span className="text-base font-black font-orbitron text-yellow-300">{stats.coinsBalance}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-black/40 rounded-xl">
              <span className="text-[10px] font-mono text-zinc-400">SKINS DESBLOQUEADAS</span>
              <span className="text-base font-black font-orbitron text-pink-300">{stats.unlockedSkins.length}</span>
            </div>
          </div>

          {/* Save & Cancel Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-bold font-orbitron text-xs transition-all cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              id="save-profile-btn"
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black font-orbitron text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              {isSaved ? <Check size={16} /> : <Edit3 size={16} />}
              <span>{isSaved ? '¡GUARDADO!' : 'GUARDAR PERFIL'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

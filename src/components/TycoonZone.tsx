/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Coins,
  Gem,
  Lock,
  Check,
  Flame,
  ShoppingBag,
  TrendingUp,
  Cpu,
  Layers,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { GameStats, PlayerCustomization, StoreItem, TycoonMachine, TycoonState } from '../types';
import {
  TYCOON_COSTS,
  TYCOON_MACHINES_FLOOR_1,
  TYCOON_MACHINES_FLOOR_2,
  DIAMOND_STORE_ITEMS,
} from '../game/tycoonData';
import { soundEngine } from '../audio/soundEngine';

interface TycoonZoneProps {
  stats: GameStats;
  customization: PlayerCustomization;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onUpdateCustomization: (newCustomization: PlayerCustomization) => void;
  onBack: () => void;
}

export const TycoonZone: React.FC<TycoonZoneProps> = ({
  stats,
  customization,
  onUpdateStats,
  onUpdateCustomization,
  onBack,
}) => {
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [showDiamondShop, setShowDiamondShop] = useState<boolean>(false);
  const [justCollectedAnim, setJustCollectedAnim] = useState<{ text: string; color: string; id: number }[]>([]);

  const tycoon = stats.tycoon;

  // Calculate current income per second
  const floor1MachinesCount = tycoon.floor1PurchasedMachines.length;
  const floor2MachinesCount = tycoon.floor2PurchasedMachines.length;
  const coinsPerSec = floor1MachinesCount * 5;
  const diamondsPerSec = floor2MachinesCount * 1;

  // Check if Floor 1 has any machines or restoration (lit factory)
  const isFloor1Lit = tycoon.floor1Restored || floor1MachinesCount > 0;

  // Check if Floor 1 is completely maxed out
  const isFloor1Complete =
    tycoon.floor1Restored &&
    TYCOON_MACHINES_FLOOR_1.every((m) => tycoon.floor1PurchasedMachines.includes(m.id));

  // Trigger floating text animation
  const triggerFloatingText = (text: string, color: string) => {
    const newId = Date.now() + Math.random();
    setJustCollectedAnim((prev) => [...prev.slice(-4), { text, color, id: newId }]);
    setTimeout(() => {
      setJustCollectedAnim((prev) => prev.filter((item) => item.id !== newId));
    }, 1200);
  };

  // Restore Floor 1 (500 coins)
  const handleRestoreFloor1 = () => {
    if (stats.coinsBalance < TYCOON_COSTS.FLOOR1_RESTORE) {
      soundEngine.playDeathSound();
      return;
    }

    soundEngine.playOrbSound('yellow');
    triggerFloatingText('¡ZONA ILUMINADA & RESTAURADA!', '#10b981');

    onUpdateStats((prev) => ({
      ...prev,
      coinsBalance: prev.coinsBalance - TYCOON_COSTS.FLOOR1_RESTORE,
      tycoon: {
        ...prev.tycoon,
        floor1Restored: true,
      },
    }));
  };

  // Buy Machine
  const handleBuyMachine = (machine: TycoonMachine) => {
    if (stats.coinsBalance < machine.cost) {
      soundEngine.playDeathSound();
      return;
    }

    soundEngine.playCoinSound();
    triggerFloatingText(`+${machine.incomePerSec} ${machine.currencyType === 'coins' ? 'Monedas/s' : 'Diamantes/s'}`, machine.glowColor);

    onUpdateStats((prev) => {
      const isFloor1 = machine.floor === 1;
      const currentList = isFloor1
        ? prev.tycoon.floor1PurchasedMachines
        : prev.tycoon.floor2PurchasedMachines;

      if (currentList.includes(machine.id)) return prev;

      return {
        ...prev,
        coinsBalance: prev.coinsBalance - machine.cost,
        tycoon: {
          ...prev.tycoon,
          floor1PurchasedMachines: isFloor1
            ? [...prev.tycoon.floor1PurchasedMachines, machine.id]
            : prev.tycoon.floor1PurchasedMachines,
          floor2PurchasedMachines: !isFloor1
            ? [...prev.tycoon.floor2PurchasedMachines, machine.id]
            : prev.tycoon.floor2PurchasedMachines,
        },
      };
    });
  };

  // Unlock Floor 2 (1500 coins)
  const handleUnlockFloor2 = () => {
    if (stats.coinsBalance < TYCOON_COSTS.FLOOR2_UNLOCK) {
      soundEngine.playDeathSound();
      return;
    }

    soundEngine.playDiamondSound();
    triggerFloatingText('¡PISO 2: LABORATORIO DE DIAMANTES DESBLOQUEADO!', '#38bdf8');

    onUpdateStats((prev) => ({
      ...prev,
      coinsBalance: prev.coinsBalance - TYCOON_COSTS.FLOOR2_UNLOCK,
      tycoon: {
        ...prev.tycoon,
        floor2Unlocked: true,
      },
    }));

    setActiveFloor(2);
  };

  // Buy Diamond Store Item
  const handleBuyDiamondItem = (item: StoreItem) => {
    const isUnlocked =
      item.category === 'skin'
        ? stats.unlockedSkins.includes(item.id)
        : item.category === 'trail'
        ? stats.unlockedTrails.includes(item.id)
        : stats.unlockedDeathEffects.includes(item.id);

    if (isUnlocked) {
      // Equip item
      soundEngine.playOrbSound('cyan');
      if (item.category === 'skin') {
        onUpdateCustomization({
          ...customization,
          skinId: item.id,
          primaryColor: item.primaryColor || customization.primaryColor,
          secondaryColor: item.secondaryColor || customization.secondaryColor,
        });
      } else if (item.category === 'trail') {
        onUpdateCustomization({
          ...customization,
          trailType: item.id as any,
        });
      } else if (item.category === 'deathEffect') {
        onUpdateCustomization({
          ...customization,
          deathEffect: item.id as any,
        });
      }
      return;
    }

    // Purchase with diamonds
    if (stats.diamondsBalance < item.price) {
      soundEngine.playDeathSound();
      return;
    }

    soundEngine.playDiamondSound();
    triggerFloatingText(`¡${item.name} DESBLOQUEADO!`, '#38bdf8');

    onUpdateStats((prev) => ({
      ...prev,
      diamondsBalance: prev.diamondsBalance - item.price,
      unlockedSkins:
        item.category === 'skin' ? [...prev.unlockedSkins, item.id] : prev.unlockedSkins,
      unlockedTrails:
        item.category === 'trail' ? [...prev.unlockedTrails, item.id] : prev.unlockedTrails,
      unlockedDeathEffects:
        item.category === 'deathEffect'
          ? [...prev.unlockedDeathEffects, item.id]
          : prev.unlockedDeathEffects,
    }));

    // Auto-equip
    if (item.category === 'skin') {
      onUpdateCustomization({
        ...customization,
        skinId: item.id,
        primaryColor: item.primaryColor || customization.primaryColor,
        secondaryColor: item.secondaryColor || customization.secondaryColor,
      });
    } else if (item.category === 'trail') {
      onUpdateCustomization({
        ...customization,
        trailType: item.id as any,
      });
    } else if (item.category === 'deathEffect') {
      onUpdateCustomization({
        ...customization,
        deathEffect: item.id as any,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#070514] text-white flex flex-col justify-between select-none overflow-y-auto">
      {/* BACKGROUND AMBIENCE: DARK ABANDONED FACTORY WALL WITH TORCHES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Brick Wall Texture & Factory Girders */}
        <div className={`absolute inset-0 transition-colors duration-1000 ${
          isFloor1Lit ? 'bg-[#18110b]' : 'bg-[#0a0c14]'
        }`}>
          {/* Brick pattern overlay */}
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] [background-size:48px_24px]" />

          {/* Heavy Steel Support Beams & Rusty Iron Pipes */}
          <div className="absolute top-0 inset-x-0 h-12 bg-slate-900 border-b-4 border-slate-700/80 flex items-center justify-around px-8">
            <div className="w-8 h-full bg-slate-800 border-x border-slate-600" />
            <div className="w-8 h-full bg-slate-800 border-x border-slate-600" />
            <div className="w-8 h-full bg-slate-800 border-x border-slate-600" />
            <div className="w-8 h-full bg-slate-800 border-x border-slate-600" />
          </div>

          {/* Wall-Mounted Industrial Torches / Sconces */}
          <div className="absolute top-20 inset-x-0 flex justify-around px-12 sm:px-24">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* Flame or Cold Ember */}
                {isFloor1Lit ? (
                  <div className="relative flex flex-col items-center">
                    {/* Fiery Torch Ambient Glow */}
                    <div className="absolute -top-10 w-40 h-40 bg-amber-500/25 rounded-full blur-3xl animate-pulse" />
                    {/* Animated Fire Flame */}
                    <div className="w-7 h-10 bg-gradient-to-t from-red-600 via-amber-400 to-yellow-200 rounded-t-full animate-bounce shadow-[0_0_20px_#f59e0b]" />
                  </div>
                ) : (
                  <div className="w-4 h-5 bg-zinc-800 rounded-t-full border-t border-zinc-600" />
                )}

                {/* Sconce Metal Holder */}
                <div className="w-6 h-10 bg-slate-800 border-x-2 border-b-2 border-slate-600 rounded-b-md shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-6 bg-slate-950" />
                </div>
                {/* Wall Bracket */}
                <div className="w-10 h-2 bg-slate-700 rounded-xs" />
              </div>
            ))}
          </div>

          {/* Warm Torch Illumination wash when lit, or dim blue moonlight when dark */}
          {isFloor1Lit ? (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-600/15 via-orange-600/10 to-transparent blur-2xl transition-opacity duration-1000" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-950/80 to-black/90 transition-opacity duration-1000" />
          )}
        </div>
      </div>

      {/* Floating Gain Notifications */}
      <div className="fixed top-20 right-6 pointer-events-none z-50 flex flex-col gap-2 items-end">
        {justCollectedAnim.map((item) => (
          <div
            key={item.id}
            className="animate-bounce font-orbitron font-bold text-sm px-3 py-1.5 rounded-xl bg-black/80 border border-white/20 shadow-2xl backdrop-blur-md"
            style={{ color: item.color }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* TOP BAR */}
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="tycoon-back-btn"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer font-orbitron text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>VOLVER</span>
          </button>

          <div>
            <h1 className="text-lg sm:text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-yellow-400" />
              <span>ZONA INDUSTRIAL TYCOON</span>
            </h1>
            <p className="text-[11px] font-mono text-zinc-400">
              Generación Pasiva de Monedas y Diamantes Neón
            </p>
          </div>
        </div>

        {/* Currency Counters & Live Incomes */}
        <div className="flex items-center gap-3">
          {/* Coins Counter */}
          <div className="flex items-center gap-2.5 bg-black/60 px-3.5 py-1.5 rounded-2xl border border-yellow-500/40 shadow-lg">
            <Coins className="w-5 h-5 text-yellow-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 font-mono">MONEDAS</span>
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-bold text-yellow-300 text-sm">
                  {stats.coinsBalance}
                </span>
                {coinsPerSec > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    (+{coinsPerSec}/s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Diamonds Counter */}
          <div className="flex items-center gap-2.5 bg-black/60 px-3.5 py-1.5 rounded-2xl border border-cyan-400/40 shadow-lg">
            <Gem className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 font-mono">DIAMANTES</span>
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-bold text-cyan-300 text-sm">
                  {stats.diamondsBalance}
                </span>
                {diamondsPerSec > 0 && (
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    (+{diamondsPerSec}/s)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOOR NAVIGATION TABS */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <button
            id="tab-floor-1"
            onClick={() => {
              setActiveFloor(1);
              setShowDiamondShop(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeFloor === 1 && !showDiamondShop
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={16} />
            <span>PISO 1: FÁBRICA DE MONEDAS</span>
          </button>

          <button
            id="tab-floor-2"
            onClick={() => {
              if (tycoon.floor2Unlocked) {
                setActiveFloor(2);
                setShowDiamondShop(false);
              }
            }}
            disabled={!tycoon.floor2Unlocked}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm transition-all ${
              !tycoon.floor2Unlocked
                ? 'opacity-50 cursor-not-allowed text-zinc-500'
                : activeFloor === 2 && !showDiamondShop
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg cursor-pointer'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer'
            }`}
          >
            {tycoon.floor2Unlocked ? <Gem size={16} className="text-cyan-300" /> : <Lock size={16} />}
            <span>PISO 2: BÓVEDA DE DIAMANTES</span>
          </button>
        </div>

        {/* Diamond Shop Access Button */}
        {tycoon.floor2Unlocked && (
          <button
            id="open-diamond-shop-btn"
            onClick={() => setShowDiamondShop(!showDiamondShop)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
              showDiamondShop
                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                : 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/60'
            }`}
          >
            <ShoppingBag size={16} />
            <span>TIENDA DE DIAMANTES</span>
            <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              💎 EXCLUSIVA
            </span>
          </button>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center z-10">
        {/* DIAMOND SHOP OVERLAY/VIEW */}
        {showDiamondShop ? (
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-r from-purple-950/80 via-blue-950/80 to-purple-950/80 border border-purple-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/30 rounded-2xl border border-purple-400/50">
                    <Gem className="w-7 h-7 text-cyan-300 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300">
                      TIENDA EXCLUSIVA DE DIAMANTES (PISO 2)
                    </h2>
                    <p className="text-xs font-mono text-purple-200">
                      Consigue los íconos de jugador más legendarios y exclusivos forjados con energía pura.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-2xl border border-cyan-400/50">
                  <Gem className="w-5 h-5 text-cyan-400" />
                  <span className="font-orbitron font-bold text-cyan-300 text-lg">
                    {stats.diamondsBalance} Diamantes
                  </span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DIAMOND_STORE_ITEMS.map((item) => {
                  const isUnlocked =
                    item.category === 'skin'
                      ? stats.unlockedSkins.includes(item.id)
                      : item.category === 'trail'
                      ? stats.unlockedTrails.includes(item.id)
                      : stats.unlockedDeathEffects.includes(item.id);

                  const isEquipped =
                    item.category === 'skin'
                      ? customization.skinId === item.id
                      : item.category === 'trail'
                      ? customization.trailType === item.id
                      : customization.deathEffect === item.id;

                  const canAfford = stats.diamondsBalance >= item.price;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        isEquipped
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : isUnlocked
                          ? 'bg-purple-950/40 border-purple-500/40 hover:border-purple-400'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-400/40 flex items-center justify-center text-2xl shadow-inner">
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-orbitron font-bold text-sm text-white">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
                              {item.badge || 'MÍTICO 💎'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                        {item.description}
                      </p>

                      <button
                        onClick={() => handleBuyDiamondItem(item)}
                        className={`w-full py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isEquipped
                            ? 'bg-cyan-500 text-black shadow-lg font-black'
                            : isUnlocked
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : canAfford
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check size={14} />
                            <span>EQUIPADO</span>
                          </>
                        ) : isUnlocked ? (
                          <>
                            <Sparkles size={14} />
                            <span>EQUIPAR ÍCONO</span>
                          </>
                        ) : (
                          <>
                            <Gem size={14} className="text-cyan-300" />
                            <span>COMPRAR ({item.price} 💎)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeFloor === 1 ? (
          /* PISO 1: ZONA ABANDONADA & FÁBRICA DE MONEDAS */
          <div className="flex flex-col gap-6">
            {!tycoon.floor1Restored ? (
              /* ESTADO INICIAL: ZONA ABANDONADA OSCURA */
              <div className="bg-[#10141f]/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 text-center flex flex-col items-center gap-6 shadow-2xl backdrop-blur-md">
                <div className="p-4 bg-amber-950/60 rounded-full border border-amber-500/50 text-amber-400 animate-pulse">
                  <Flame className="w-10 h-10" />
                </div>

                <div className="flex flex-col gap-2 max-w-lg">
                  <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                    FÁBRICA ABANDONADA A OSCURAS
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-orbitron text-white">
                    LAS ANTORCHAS ESTÁN APAGADAS
                  </h2>
                  <p className="text-sm font-mono text-zinc-300">
                    Esta vieja fábrica de ladrillos se encuentra en penumbras. Compra la restauración
                    para prender las antorchas de la pared, iluminar la fábrica e instalar maquinaria industrial.
                  </p>
                </div>

                {/* Primary Action Button: Restore Decor (500 Coins) */}
                <button
                  id="tycoon-restore-floor1-btn"
                  onClick={handleRestoreFloor1}
                  className={`flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-black font-orbitron text-base sm:text-lg tracking-wider transition-all shadow-xl cursor-pointer ${
                    stats.coinsBalance >= TYCOON_COSTS.FLOOR1_RESTORE
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-black hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-6 h-6 animate-bounce" />
                  <span>ENCENDER ANTORCHAS E ILUMINAR ZONA (500 MONEDAS)</span>
                </button>
              </div>
            ) : (
              /* PISO 1 RESTAURADO: COMPRA DE MÁQUINAS (5 MONEDAS/SEG) */
              <div className="flex flex-col gap-6">
                {/* Status Bar */}
                <div className="bg-[#1a120c]/80 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400 text-amber-400">
                      <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="font-orbitron font-bold text-base sm:text-lg text-amber-300">
                        Fábrica Iluminada & Operativa: {floor1MachinesCount}/4 Máquinas
                      </h2>
                      <p className="text-xs font-mono text-zinc-300">
                        Cada máquina instalada genera de forma pasiva 5 monedas por segundo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-950/80 px-4 py-2 rounded-xl border border-amber-500/50">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="font-orbitron font-bold text-amber-300 text-sm">
                      Producción: +{coinsPerSec} Monedas/s
                    </span>
                  </div>
                </div>

                {/* Grid of Machines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TYCOON_MACHINES_FLOOR_1.map((machine) => {
                    const isBought = tycoon.floor1PurchasedMachines.includes(machine.id);
                    const canAfford = stats.coinsBalance >= machine.cost;

                    return (
                      <div
                        key={machine.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 backdrop-blur-md ${
                          isBought
                            ? 'bg-[#0b1f1a]/80 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                            : 'bg-[#120a28]/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner"
                            style={{
                              backgroundColor: `${machine.glowColor}22`,
                              borderColor: machine.glowColor,
                            }}
                          >
                            {machine.icon}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono text-zinc-400 block">PRODUCE</span>
                            <span className="font-orbitron font-bold text-emerald-400 text-sm">
                              +{machine.incomePerSec} 🟡/s
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-orbitron font-bold text-sm text-white">
                            {machine.name}
                          </h3>
                          <p className="text-xs font-mono text-zinc-300 mt-1">
                            {machine.description}
                          </p>
                        </div>

                        {/* Buy or Active Status */}
                        {isBought ? (
                          <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2">
                            <Check size={16} />
                            <span>¡GENERANDO EN VIVO!</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuyMachine(machine)}
                            className={`w-full py-2.5 px-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black shadow-md active:scale-98'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                            }`}
                          >
                            <Coins size={14} />
                            <span>COMPRAR ({machine.cost} 🟡)</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Unlock Floor 2 Banner Button (Appears when all Floor 1 machines are purchased) */}
                {isFloor1Complete && !tycoon.floor2Unlocked && (
                  <div className="mt-4 bg-gradient-to-r from-cyan-950 via-blue-950 to-purple-950 border-2 border-cyan-400 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-pulse">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      <div className="p-4 bg-cyan-500/20 rounded-2xl border border-cyan-400 text-cyan-300">
                        <Gem className="w-10 h-10 animate-spin-slow" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                          ¡PISO 1 COMPLETADO AL 100%!
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black font-orbitron text-white">
                          DESBLOQUEAR PISO 2: LABORATORIO DE DIAMANTES
                        </h3>
                        <p className="text-xs font-mono text-cyan-200 mt-1">
                          Accede a generadores de Diamantes de alta pureza y desbloquea la Tienda Mítica.
                        </p>
                      </div>
                    </div>

                    <button
                      id="tycoon-unlock-floor2-btn"
                      onClick={handleUnlockFloor2}
                      className={`py-4 px-8 rounded-2xl font-black font-orbitron text-base tracking-wider whitespace-nowrap transition-all shadow-xl cursor-pointer ${
                        stats.coinsBalance >= TYCOON_COSTS.FLOOR2_UNLOCK
                          ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white hover:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                      }`}
                    >
                      <span>DESBLOQUEAR PISO 2 (1500 MONEDAS)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* PISO 2: LABORATORIO DE DIAMANTES (1 DIAMANTE/SEG) */
          <div className="flex flex-col gap-6">
            <div className="bg-[#0b132b]/80 border border-cyan-400/50 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-400 text-cyan-300">
                  <Gem className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="font-orbitron font-bold text-base sm:text-lg text-cyan-300">
                    Laboratorio de Diamantes: {floor2MachinesCount}/4 Reactores
                  </h2>
                  <p className="text-xs font-mono text-zinc-300">
                    Sintetizadores cuánticos que producen 1 diamante por segundo cada uno.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-cyan-950/80 px-4 py-2 rounded-xl border border-cyan-400/50">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span className="font-orbitron font-bold text-cyan-300 text-sm">
                  Producción: +{diamondsPerSec} Diamantes/s
                </span>
              </div>
            </div>

            {/* Diamond Machines Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TYCOON_MACHINES_FLOOR_2.map((machine) => {
                const isBought = tycoon.floor2PurchasedMachines.includes(machine.id);
                const canAfford = stats.coinsBalance >= machine.cost;

                return (
                  <div
                    key={machine.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 backdrop-blur-md ${
                      isBought
                        ? 'bg-[#091b29]/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-[#100824]/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner"
                        style={{
                          backgroundColor: `${machine.glowColor}22`,
                          borderColor: machine.glowColor,
                        }}
                      >
                        {machine.icon}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-400 block">PRODUCE</span>
                        <span className="font-orbitron font-bold text-cyan-300 text-sm">
                          +{machine.incomePerSec} 💎/s
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-orbitron font-bold text-sm text-white">
                        {machine.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-300 mt-1">
                        {machine.description}
                      </p>
                    </div>

                    {isBought ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2">
                        <Check size={16} />
                        <span>¡CRISTALIZANDO DIAMANTES!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyMachine(machine)}
                        className={`w-full py-2.5 px-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md active:scale-98'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                        }`}
                      >
                        <Coins size={14} />
                        <span>COMPRAR ({machine.cost} 🟡)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER TIPS */}
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 text-[11px] font-mono text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5 z-10">
        <div>💡 Las máquinas continúan generando monedas y diamantes en tiempo real.</div>
        <div>Super Dash Tycoon • Piso 1: 5 Monedas/s • Piso 2: 1 Diamante/s</div>
      </div>
    </div>
  );
};

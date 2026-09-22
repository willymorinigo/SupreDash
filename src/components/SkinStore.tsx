/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Lock, Sparkles, Coins, ShoppingBag, Eye, Zap, Flame, Award } from 'lucide-react';
import { GameStats, PlayerCustomization, StoreItem } from '../types';
import { STORE_ITEMS } from '../game/worldData';
import { soundEngine } from '../audio/soundEngine';

interface SkinStoreProps {
  stats: GameStats;
  customization: PlayerCustomization;
  onUpdateCustomization: (newCustomization: PlayerCustomization) => void;
  onBuyItem: (item: StoreItem) => void;
  onBack: () => void;
}

export const SkinStore: React.FC<SkinStoreProps> = ({
  stats,
  customization,
  onUpdateCustomization,
  onBuyItem,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'trail' | 'deathEffect' | 'color'>('skin');
  const [selectedItem, setSelectedItem] = useState<StoreItem>(STORE_ITEMS[0]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Filter items by category
  const filteredItems = STORE_ITEMS.filter((item) => item.category === activeTab);

  // Check ownership
  const isItemUnlocked = (item: StoreItem): boolean => {
    if (item.price === 0) return true;
    if (item.category === 'skin') return stats.unlockedSkins.includes(item.id);
    if (item.category === 'trail') return stats.unlockedTrails.includes(item.id);
    if (item.category === 'deathEffect') return stats.unlockedDeathEffects.includes(item.id);
    return true;
  };

  // Check equipped
  const isItemEquipped = (item: StoreItem): boolean => {
    if (item.category === 'skin') return customization.skinId === item.id;
    if (item.category === 'trail') return customization.trailType === item.id;
    if (item.category === 'deathEffect') return customization.deathEffect === item.id;
    return false;
  };

  // Color Palettes for 'color' tab
  const COLOR_PALETTES = [
    { name: 'Cian & Fucsia (Clásico)', primary: '#06b6d4', secondary: '#ec4899' },
    { name: 'Esmeralda & Oro Solar', primary: '#10b981', secondary: '#facc15' },
    { name: 'Rojo Carmesí & Fuego', primary: '#ef4444', secondary: '#f97316' },
    { name: 'Púrpura Neón & Cian', primary: '#a855f7', secondary: '#06b6d4' },
    { name: 'Oro Imperial & Negro', primary: '#eab308', secondary: '#ffffff' },
    { name: 'Azul Glaciar & Magenta', primary: '#38bdf8', secondary: '#f43f5e' },
  ];

  // Animated live preview on canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotation = 0;
    let trailOffset = 0;

    const renderPreview = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const size = 56;

      rotation += 0.025;
      trailOffset += 0.05;

      // Draw subtle glowing background grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw live trail simulation
      const trailType = selectedItem.category === 'trail' ? (selectedItem.id as any) : customization.trailType;
      ctx.save();
      for (let i = 1; i <= 6; i++) {
        const tx = cx - i * 22;
        const ty = cy + Math.sin(trailOffset + i * 0.5) * 6;
        const alpha = 1 - i / 7;
        const trailColor =
          trailType === 'rainbow'
            ? `hsl(${(Date.now() * 0.2 + i * 35) % 360}, 100%, 65%)`
            : trailType === 'fire'
            ? '#f97316'
            : trailType === 'sakura'
            ? '#f472b6'
            : customization.primaryColor;

        ctx.fillStyle = trailColor;
        ctx.globalAlpha = alpha * 0.7;
        ctx.shadowColor = trailColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tx, ty, (size / 2) * (1 - i / 8), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Draw Main Cube Avatar
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      const skinToRender = selectedItem.category === 'skin' ? selectedItem.id : customization.skinId;
      const primColor = customization.primaryColor;
      const secColor = customization.secondaryColor;

      ctx.shadowColor = primColor;
      ctx.shadowBlur = 20;

      // Outer Box
      ctx.fillStyle = '#100726';
      ctx.strokeStyle = primColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 8);
      ctx.fill();
      ctx.stroke();

      // Inner Skin Face
      ctx.fillStyle = secColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      if (skinToRender === 'cyborg') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-size / 2 + 8, -8, size - 16, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -5, 8, 8);
      } else if (skinToRender === 'tango_dancer') {
        // Tango Fedora Hat & Ribbon
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-size / 2 - 4, -size / 2 + 2, size + 8, 8); // Hat brim
        ctx.fillRect(-size / 2 + 6, -size / 2 - 10, size - 12, 14); // Hat top
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-size / 2 + 6, -size / 2, size - 12, 4); // Red ribbon
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, 2, 6, 6);
        ctx.fillRect(4, 2, 6, 6);
      } else if (skinToRender === 'viking') {
        // Viking Helmet & Horns
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-size / 2 + 4, -size / 2 + 4, size - 8, 14); // Helmet rim
        // Left horn
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 4, -size / 2 + 6);
        ctx.quadraticCurveTo(-size / 2 - 14, -size / 2 - 12, -size / 2 - 6, -size / 2 - 18);
        ctx.lineTo(-size / 2 + 10, -size / 2 + 6);
        ctx.fill();
        // Right horn
        ctx.beginPath();
        ctx.moveTo(size / 2 - 4, -size / 2 + 6);
        ctx.quadraticCurveTo(size / 2 + 14, -size / 2 - 12, size / 2 + 6, -size / 2 - 18);
        ctx.lineTo(size / 2 - 10, -size / 2 + 6);
        ctx.fill();
      } else if (skinToRender === 'astronaut') {
        // Astronaut Gold Visor
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Reflection glare
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -10, 8, 4);
      } else if (skinToRender === 'samba_king') {
        // Carnival Feather Crown
        const featherColors = ['#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
        for (let f = 0; f < 4; f++) {
          ctx.fillStyle = featherColors[f];
          ctx.beginPath();
          ctx.ellipse(-15 + f * 10, -size / 2 - 8, 5, 14, (f - 1.5) * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-size / 2 + 4, -size / 2 + 2, size - 8, 8); // Gold headband
      } else if (skinToRender === 'gladiator') {
        // Roman Gladiator Crest
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-6, -size / 2 - 14, 12, 18); // Red horsehair crest
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-size / 2 + 4, -size / 2 + 4, size - 8, 12); // Bronze helm
        ctx.fillStyle = '#000000';
        ctx.fillRect(-12, 0, 24, 6); // Slit
      } else if (skinToRender === 'alien') {
        // Alien Eyes & Antenna
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-2, -size / 2 - 12, 4, 14);
        ctx.beginPath();
        ctx.arc(0, -size / 2 - 14, 5, 0, Math.PI * 2);
        ctx.fill();
        // Slanted oval eyes
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.ellipse(-10, 0, 5, 9, -0.3, 0, Math.PI * 2);
        ctx.ellipse(10, 0, 5, 9, 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (skinToRender === 'pixel_knight') {
        // 16-Bit Knight Visor
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-size / 2 + 6, -10, size - 12, 20);
        ctx.fillStyle = '#020617';
        for (let b = 0; b < 4; b++) {
          ctx.fillRect(-12 + b * 7, -2, 4, 8);
        }
      } else if (skinToRender === 'cyber_phoenix') {
        // Solar Phoenix Crest
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, -size / 2 - 18);
        ctx.lineTo(14, -size / 2 + 4);
        ctx.lineTo(-14, -size / 2 + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 2, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (skinToRender === 'cyborg_golden') {
        // 24K Pure Gold Robot with Diamond Eye
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-size / 2 + 6, -10, size - 12, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (skinToRender === 'ninja') {
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 10, -5);
        ctx.lineTo(size / 2 - 10, -5);
        ctx.lineTo(size / 2 - 18, 8);
        ctx.lineTo(-size / 2 + 18, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (skinToRender === 'demon') {
        // Demon horns
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 6, -size / 2 + 8);
        ctx.lineTo(-size / 2 - 8, -size / 2 - 12);
        ctx.lineTo(-size / 2 + 16, -size / 2 + 4);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size / 2 - 6, -size / 2 + 8);
        ctx.lineTo(size / 2 + 8, -size / 2 - 12);
        ctx.lineTo(size / 2 - 16, -size / 2 + 4);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-10, -2, 6, 6);
        ctx.fillRect(4, -2, 6, 6);
      } else if (skinToRender === 'dragon') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2 + 8);
        ctx.lineTo(size / 2 - 10, size / 2 - 10);
        ctx.lineTo(0, size / 2 - 18);
        ctx.lineTo(-size / 2 + 10, size / 2 - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (skinToRender === 'skull') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-11, -5, 6, 0, Math.PI * 2);
        ctx.arc(11, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = secColor;
        ctx.fillRect(-8, 10, 16, 5);
      } else if (skinToRender === 'pharaoh') {
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const innerSize = size * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, -innerSize);
        ctx.lineTo(innerSize, 0);
        ctx.lineTo(0, innerSize);
        ctx.lineTo(-innerSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedItem, customization]);

  const handleEquip = (item: StoreItem) => {
    if (item.category === 'skin') {
      onUpdateCustomization({ ...customization, skinId: item.id });
    } else if (item.category === 'trail') {
      onUpdateCustomization({ ...customization, trailType: item.id as any });
    } else if (item.category === 'deathEffect') {
      onUpdateCustomization({ ...customization, deathEffect: item.id as any });
    }
    soundEngine.playBuySuccessSound();
  };

  const handlePurchase = (item: StoreItem) => {
    if (stats.coinsBalance >= item.price) {
      onBuyItem(item);
      handleEquip(item);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#090b14] text-white flex flex-col overflow-y-auto select-none p-3 sm:p-6">
      {/* SUPERMARKET BACKGROUND GRAPHICS (Shelves, aisle signs, fluorescent ceiling lights, checkered floor) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-35">
        {/* Ceiling Fluorescent Tubes */}
        <div className="absolute top-0 inset-x-0 h-16 flex justify-around items-start">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-24 sm:w-36 h-2.5 bg-cyan-100 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] opacity-70"
            />
          ))}
        </div>

        {/* Supermarket Aisles & Shelves with Grocery items */}
        <div className="absolute inset-0 flex justify-between px-2 sm:px-12 pt-20">
          {/* Left Aisle Shelving */}
          <div className="w-16 sm:w-28 h-full flex flex-col justify-around border-r-2 border-yellow-500/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-20 border-b border-white/20 flex flex-wrap gap-1 p-1">
                <div className="w-3 sm:w-5 h-8 bg-red-500/60 rounded-sm" />
                <div className="w-3 sm:w-5 h-8 bg-amber-500/60 rounded-sm" />
                <div className="w-3 sm:w-5 h-8 bg-blue-500/60 rounded-sm" />
                <div className="w-3 sm:w-5 h-8 bg-emerald-500/60 rounded-sm" />
                <div className="w-full text-[8px] font-mono text-yellow-300">OFERTA</div>
              </div>
            ))}
          </div>

          {/* Right Aisle Shelving */}
          <div className="w-16 sm:w-28 h-full flex flex-col justify-around border-l-2 border-yellow-500/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-20 border-b border-white/20 flex flex-wrap gap-1 p-1 justify-end">
                <div className="w-3 sm:w-5 h-8 bg-purple-500/60 rounded-sm" />
                <div className="w-3 sm:w-5 h-8 bg-pink-500/60 rounded-sm" />
                <div className="w-3 sm:w-5 h-8 bg-cyan-500/60 rounded-sm" />
                <div className="w-3 sm:w-5 h-8 bg-yellow-500/60 rounded-sm" />
                <div className="w-full text-[8px] font-mono text-right text-emerald-300">2x1</div>
              </div>
            ))}
          </div>
        </div>

        {/* Supermarket Floor Tiles Perspective Grid */}
        <div
          className="absolute bottom-0 inset-x-0 h-96 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg)',
          }}
        />
      </div>

      {/* Top Header */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 mb-4 z-10">
        <button
          id="store-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-zinc-200 hover:text-white border border-white/20 transition-all cursor-pointer font-semibold text-xs sm:text-sm backdrop-blur-md"
        >
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-[10px] font-mono font-bold text-yellow-300 mb-1">
            🛒 PASILLO PRINCIPAL - SUPERMERCADO DASH
          </div>
          <h1 className="text-xl sm:text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-emerald-400 tracking-wider flex items-center justify-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            TIENDA DE SKINS & ITEMS
          </h1>
        </div>

        {/* Coins Balance */}
        <div className="flex items-center gap-2 bg-black/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-yellow-500/50 shadow-lg backdrop-blur-md">
          <Coins className="w-5 h-5 text-yellow-400 animate-bounce" />
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-zinc-400 font-mono">SALDO</span>
            <span className="font-orbitron font-bold text-yellow-300 text-sm sm:text-base leading-tight">
              {stats.coinsBalance} 🪙
            </span>
          </div>
        </div>
      </div>

      {/* Main Store Content */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10 pb-12">
        {/* Left Side: Category Tabs & Items Grid (8 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
            <button
              id="tab-skin"
              onClick={() => setActiveTab('skin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'skin'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Avatares</span>
            </button>
            <button
              id="tab-trail"
              onClick={() => setActiveTab('trail')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'trail'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap size={14} />
              <span>Estelas</span>
            </button>
            <button
              id="tab-death"
              onClick={() => setActiveTab('deathEffect')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'deathEffect'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame size={14} />
              <span>Efectos</span>
            </button>
            <button
              id="tab-color"
              onClick={() => setActiveTab('color')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'color'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Award size={14} />
              <span>Paletas</span>
            </button>
          </div>

          {/* Items Grid or Color Selection */}
          {activeTab !== 'color' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredItems.map((item) => {
                const unlocked = isItemUnlocked(item);
                const equipped = isItemEquipped(item);
                const isSelected = selectedItem.id === item.id;
                const canAfford = stats.coinsBalance >= item.price;

                return (
                  <div
                    key={item.id}
                    id={`store-item-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    className={`bg-[#110b24]/90 backdrop-blur-md rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-[#191035]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl p-2 rounded-xl bg-white/5 border border-white/10">
                            {item.icon}
                          </span>
                          <div>
                            <h3 className="font-orbitron font-bold text-sm text-white">{item.name}</h3>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {unlocked ? (equipped ? '✓ EQUIPADO' : 'DESBLOQUEADO') : `${item.price} Monedas`}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span className="text-[9px] font-bold font-orbitron px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Action button inside card */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      {unlocked ? (
                        equipped ? (
                          <span className="text-xs font-bold font-orbitron text-emerald-400 flex items-center gap-1">
                            <Check size={14} /> EQUIPADO
                          </span>
                        ) : (
                          <button
                            id={`equip-btn-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(item);
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs font-orbitron transition-all"
                          >
                            EQUIPAR
                          </button>
                        )
                      ) : (
                        <button
                          id={`buy-btn-${item.id}`}
                          disabled={!canAfford}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(item);
                          }}
                          className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs font-orbitron flex items-center justify-center gap-1.5 transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-md cursor-pointer'
                              : 'bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed'
                          }`}
                        >
                          <Coins size={13} />
                          <span>COMPRAR ({item.price})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Color Palettes
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLOR_PALETTES.map((pal, idx) => {
                const isActive =
                  customization.primaryColor === pal.primary && customization.secondaryColor === pal.secondary;

                return (
                  <div
                    key={idx}
                    id={`color-pal-${idx}`}
                    onClick={() => {
                      onUpdateCustomization({
                        ...customization,
                        primaryColor: pal.primary,
                        secondaryColor: pal.secondary,
                      });
                      soundEngine.playBuySuccessSound();
                    }}
                    className={`bg-[#110b24]/90 rounded-2xl border p-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'border-emerald-400 bg-[#16122d] shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-6 h-6 rounded-full border border-white/20 shadow"
                          style={{ background: pal.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-white/20 shadow"
                          style={{ background: pal.secondary }}
                        />
                      </div>
                      <div>
                        <h4 className="font-orbitron font-bold text-xs text-white">{pal.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-400">Paleta Neón</span>
                      </div>
                    </div>

                    {isActive && <Check className="w-5 h-5 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Live Interactive 3D Preview Box (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#110b24]/90 backdrop-blur-md rounded-3xl border border-white/15 p-6 flex flex-col items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            {/* Top Preview Label */}
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                <Eye size={14} /> VISTA PREVIA EN VIVO
              </span>
              <span className="text-xs font-mono text-zinc-400">Física 60 FPS</span>
            </div>

            {/* Live Canvas */}
            <div className="relative w-full aspect-square max-w-[280px] bg-black/60 rounded-2xl border border-cyan-500/30 flex items-center justify-center shadow-inner overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                width={280}
                height={280}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Item Details in Preview */}
            <div className="w-full text-center">
              <h3 className="text-xl font-bold font-orbitron text-white">{selectedItem.name}</h3>
              <p className="text-xs text-zinc-300 mt-1">{selectedItem.description}</p>
            </div>

            {/* Bottom Big Action Button */}
            <div className="w-full">
              {isItemUnlocked(selectedItem) ? (
                isItemEquipped(selectedItem) ? (
                  <div className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold font-orbitron text-sm flex items-center justify-center gap-2">
                    <Check size={18} /> EQUIPADO ACTUALMENTE
                  </div>
                ) : (
                  <button
                    id="preview-equip-btn"
                    onClick={() => handleEquip(selectedItem)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-bold font-orbitron text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
                  >
                    EQUIPAR AHORA
                  </button>
                )
              ) : (
                <button
                  id="preview-buy-btn"
                  disabled={stats.coinsBalance < selectedItem.price}
                  onClick={() => handlePurchase(selectedItem)}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold font-orbitron text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                    stats.coinsBalance >= selectedItem.price
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-yellow-500/30 active:scale-98 cursor-pointer'
                      : 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <Coins size={18} />
                  <span>COMPRAR POR {selectedItem.price} MONEDAS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

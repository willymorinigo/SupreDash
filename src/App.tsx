/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AudioTrack,
  CountryLevel,
  Difficulty,
  GameStats,
  LevelData,
  LevelResultReward,
  PlayerCustomization,
  StoreItem,
} from './types';
import { TRACK_LIST } from './audio/soundEngine';
import { ProceduralLevelGenerator } from './game/proceduralLevelGenerator';
import { CONTINENTS_DATA } from './game/worldData';
import { DEFAULT_TYCOON_STATE } from './game/tycoonData';
import { MainMenu } from './components/MainMenu';
import { WorldMap } from './components/WorldMap';
import { SkinStore } from './components/SkinStore';
import { GameCanvas } from './components/GameCanvas';
import { CustomSeedModal } from './components/CustomSeedModal';
import { TycoonZone } from './components/TycoonZone';
import { PlatformerGame } from './components/PlatformerGame';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfile } from './types';

const STATS_STORAGE_KEY = 'super_dash_stats_v3';
const CUSTOM_STORAGE_KEY = 'super_dash_custom_v3';

const DEFAULT_STATS: GameStats = {
  attempts: 0,
  jumps: 0,
  deaths: 0,
  coinsCollected: 0,
  coinsBalance: 250, // Starting bonus coins to enjoy the store & tycoon!
  diamondsBalance: 0,
  diamondsCollected: 0,
  levelsCompleted: 0,
  highScores: {},
  levelStars: {},
  unlockedSkins: ['classic', 'cyborg'],
  unlockedTrails: ['glow', 'particles'],
  unlockedDeathEffects: ['shatter'],
  tycoon: DEFAULT_TYCOON_STATE,
};

const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  skinId: 'classic',
  primaryColor: '#06b6d4',
  secondaryColor: '#ec4899',
  trailType: 'glow',
  deathEffect: 'shatter',
};

export default function App() {
  const [view, setView] = useState<'MENU' | 'WORLDMAP' | 'STORE' | 'TYCOON' | 'GAME' | 'PLATFORMER'>('MENU');
  const [activeLevelData, setActiveLevelData] = useState<LevelData | null>(null);
  const [currentCountry, setCurrentCountry] = useState<CountryLevel | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Persistent Game Stats & Economy
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATS,
          ...parsed,
          tycoon: parsed.tycoon ? { ...DEFAULT_TYCOON_STATE, ...parsed.tycoon } : DEFAULT_TYCOON_STATE,
        };
      }
      return DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_STORAGE_KEY);
      return saved ? { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) } : DEFAULT_CUSTOMIZATION;
    } catch {
      return DEFAULT_CUSTOMIZATION;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Could not save stats to localStorage', e);
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customization));
    } catch (e) {
      console.warn('Could not save customization to localStorage', e);
    }
  }, [customization]);

  // TYCOON PASSIVE REAL-TIME GENERATION TICKER (Produces coins & diamonds every second)
  useEffect(() => {
    const ticker = setInterval(() => {
      setStats((prev) => {
        const f1Count = prev.tycoon?.floor1PurchasedMachines?.length || 0;
        const f2Count = prev.tycoon?.floor2PurchasedMachines?.length || 0;

        if (f1Count === 0 && f2Count === 0) return prev;

        const coinsToAdd = f1Count * 5;
        const diamondsToAdd = f2Count * 1;

        return {
          ...prev,
          coinsBalance: prev.coinsBalance + coinsToAdd,
          diamondsBalance: (prev.diamondsBalance || 0) + diamondsToAdd,
          coinsCollected: prev.coinsCollected + coinsToAdd,
        };
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Start Level from World Map Country
  const handleSelectCountry = (country: CountryLevel, isPractice: boolean) => {
    const track = ProceduralLevelGenerator.countryToAudioTrack(country);
    const level = ProceduralLevelGenerator.generateLevel(track, country.seed, country.difficulty);
    level.landmark = country.landmark;
    setCurrentCountry(country);
    setActiveLevelData(level);
    setIsPracticeMode(isPractice);
    setView('GAME');
  };

  // Start Endless Mode
  const handlePlayEndless = () => {
    const endlessTrack = TRACK_LIST.find((t) => t.id === 'track_endless') || TRACK_LIST[0];
    const level = ProceduralLevelGenerator.generateLevel(endlessTrack, 999999, 'ENDLESS');
    setCurrentCountry(null);
    setActiveLevelData(level);
    setIsPracticeMode(false);
    setView('GAME');
  };

  // Launch Custom Procedural Seed Level
  const handleLaunchCustomSeedLevel = (
    seed: number,
    bpm: number,
    difficulty: Difficulty,
    speed: number
  ) => {
    const customTrack: AudioTrack = {
      id: `custom-seed-${seed}`,
      title: `Sector #${seed % 1000}`,
      artist: 'Sintetizador Procedural',
      bpm,
      difficulty,
      themeColor: '#06b6d4',
      secondaryColor: '#ec4899',
      bgGradient: ['#0f051d', '#05192d'],
      description: `Nivel procedural #${seed} a ${bpm} BPM.`,
      baseSpeed: speed,
      synthStyle: 'synthwave',
      lengthSeconds: 65,
      seed,
    };

    const level = ProceduralLevelGenerator.generateLevel(customTrack, seed, difficulty);
    setCurrentCountry(null);
    setActiveLevelData(level);
    setIsPracticeMode(false);
    setIsSeedModalOpen(false);
    setView('GAME');
  };

  // Purchase item in standard store with coins
  const handleBuyItem = (item: StoreItem) => {
    if (stats.coinsBalance < item.price) return;

    setStats((prev) => {
      const nextBalance = prev.coinsBalance - item.price;
      const nextSkins = [...prev.unlockedSkins];
      const nextTrails = [...prev.unlockedTrails];
      const nextDeath = [...prev.unlockedDeathEffects];

      if (item.category === 'skin' && !nextSkins.includes(item.id)) {
        nextSkins.push(item.id);
      } else if (item.category === 'trail' && !nextTrails.includes(item.id)) {
        nextTrails.push(item.id);
      } else if (item.category === 'deathEffect' && !nextDeath.includes(item.id)) {
        nextDeath.push(item.id);
      }

      return {
        ...prev,
        coinsBalance: nextBalance,
        unlockedSkins: nextSkins,
        unlockedTrails: nextTrails,
        unlockedDeathEffects: nextDeath,
      };
    });
  };

  // Handle Level Complete & Reward Coin Payout
  const handleLevelComplete = (reward: LevelResultReward, statsUpdate: Partial<GameStats>) => {
    setStats((prev) => {
      const newHighScores = { ...prev.highScores, ...(statsUpdate.highScores || {}) };
      const newStars = { ...prev.levelStars, ...(statsUpdate.levelStars || {}) };

      return {
        ...prev,
        levelsCompleted: prev.levelsCompleted + (statsUpdate.levelsCompleted || 0),
        coinsCollected: prev.coinsCollected + reward.totalCoinsEarned,
        coinsBalance: prev.coinsBalance + reward.totalCoinsEarned,
        highScores: newHighScores,
        levelStars: newStars,
      };
    });
  };

  // Advance to next Country level in world map
  const handleNextCountryLevel = () => {
    const allCountries: CountryLevel[] = [];
    CONTINENTS_DATA.forEach((c) => allCountries.push(...c.countries));

    if (!currentCountry) {
      handleSelectCountry(allCountries[0], false);
      return;
    }

    const currentIndex = allCountries.findIndex((c) => c.id === currentCountry.id);
    const nextIndex = (currentIndex + 1) % allCountries.length;
    const nextCountry = allCountries[nextIndex];
    handleSelectCountry(nextCountry, false);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setStats((prev) => ({
      ...prev,
      userProfile: updatedProfile,
    }));
  };

  return (
    <div className="w-screen h-screen bg-[#070412] text-white flex flex-col overflow-hidden relative font-body select-none">
      {/* Primary Views */}
      {view === 'MENU' && (
        <MainMenu
          stats={stats}
          customization={customization}
          onOpenWorldMap={() => setView('WORLDMAP')}
          onOpenPlatformer={() => setView('PLATFORMER')}
          onOpenStore={() => setView('STORE')}
          onOpenTycoon={() => setView('TYCOON')}
          onPlayEndless={handlePlayEndless}
          onOpenSeedModal={() => setIsSeedModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}

      {view === 'PLATFORMER' && (
        <PlatformerGame
          stats={stats}
          customization={customization}
          onUpdateStats={setStats}
          onBack={() => setView('MENU')}
        />
      )}

      {view === 'WORLDMAP' && (
        <WorldMap
          stats={stats}
          onSelectCountry={handleSelectCountry}
          onOpenStore={() => setView('STORE')}
          onBackToMenu={() => setView('MENU')}
        />
      )}

      {view === 'TYCOON' && (
        <TycoonZone
          stats={stats}
          customization={customization}
          onUpdateStats={setStats}
          onUpdateCustomization={setCustomization}
          onBack={() => setView('MENU')}
        />
      )}

      {view === 'STORE' && (
        <SkinStore
          stats={stats}
          customization={customization}
          onUpdateCustomization={setCustomization}
          onBuyItem={handleBuyItem}
          onBack={() => setView(currentCountry ? 'WORLDMAP' : 'MENU')}
        />
      )}

      {view === 'GAME' && activeLevelData && (
        <GameCanvas
          levelData={activeLevelData}
          customization={customization}
          initialPracticeMode={isPracticeMode}
          onExitToMenu={() => setView('WORLDMAP')}
          onOpenStore={() => setView('STORE')}
          onLevelComplete={handleLevelComplete}
          onNextLevel={handleNextCountryLevel}
        />
      )}

      {/* Custom Procedural Seed Generator Modal */}
      <CustomSeedModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onLaunchCustomLevel={handleLaunchCustomSeedLevel}
      />

      {/* User Player Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          stats={stats}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );
}

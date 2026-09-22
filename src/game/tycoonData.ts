/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreItem, TycoonMachine, TycoonState } from '../types';

export const DEFAULT_TYCOON_STATE: TycoonState = {
  floor1Restored: false,
  floor1PurchasedMachines: [],
  floor2Unlocked: false,
  floor2PurchasedMachines: [],
  lastCollectTimestamp: Date.now(),
};

export const TYCOON_COSTS = {
  FLOOR1_RESTORE: 500, // 500 coins to restore illumination & decor
  FLOOR2_UNLOCK: 1500, // 1500 coins to unlock Floor 2
};

export const TYCOON_MACHINES_FLOOR_1: TycoonMachine[] = [
  {
    id: 'm1_quantum_miner',
    name: 'Minero Cuántico Alfa',
    cost: 200,
    incomePerSec: 5,
    currencyType: 'coins',
    floor: 1,
    description: 'Genera 5 monedas de neón por segundo mediante micro-fusión.',
    icon: '⚡',
    glowColor: '#06b6d4',
  },
  {
    id: 'm2_pulse_generator',
    name: 'Generador de Pulsos Rítmicos',
    cost: 450,
    incomePerSec: 5,
    currencyType: 'coins',
    floor: 1,
    description: 'Sincroniza beats de audio para producir 5 monedas/seg.',
    icon: '🔊',
    glowColor: '#10b981',
  },
  {
    id: 'm3_cyber_synth',
    name: 'Sintetizador Ciber-Dash',
    cost: 750,
    incomePerSec: 5,
    currencyType: 'coins',
    floor: 1,
    description: 'Refina datos de saltos en 5 monedas de alta pureza por segundo.',
    icon: '🎛️',
    glowColor: '#ec4899',
  },
  {
    id: 'm4_fusion_turbine',
    name: 'Turbina de Fusión Industrial',
    cost: 1200,
    incomePerSec: 5,
    currencyType: 'coins',
    floor: 1,
    description: 'Turbina electromagnética que aporta 5 monedas/seg al generador central.',
    icon: '🌀',
    glowColor: '#eab308',
  },
];

export const TYCOON_MACHINES_FLOOR_2: TycoonMachine[] = [
  {
    id: 'm5_antimatter_reactor',
    name: 'Reactor de Antimateria 💎',
    cost: 2500,
    incomePerSec: 1,
    currencyType: 'diamonds',
    floor: 2,
    description: 'Condensa energía oscura produciendo 1 diamante por segundo.',
    icon: '🔮',
    glowColor: '#38bdf8',
  },
  {
    id: 'm6_particle_collider',
    name: 'Colisionador de Hadrones Neón 💎',
    cost: 4500,
    incomePerSec: 1,
    currencyType: 'diamonds',
    floor: 2,
    description: 'Acelera partículas luminosas produciendo 1 diamante por segundo.',
    icon: '⚛️',
    glowColor: '#a855f7',
  },
  {
    id: 'm7_temporal_crystal',
    name: 'Sintetizador de Cristales Temporales 💎',
    cost: 7500,
    incomePerSec: 1,
    currencyType: 'diamonds',
    floor: 2,
    description: 'Cristaliza líneas de tiempo alternas en 1 diamante por segundo.',
    icon: '⏳',
    glowColor: '#f43f5e',
  },
  {
    id: 'm8_singularity_core',
    name: 'Núcleo de Singularidad Diamante 💎',
    cost: 12000,
    incomePerSec: 1,
    currencyType: 'diamonds',
    floor: 2,
    description: 'El ápice de la tecnología cuántica: genera 1 diamante por segundo.',
    icon: '🌌',
    glowColor: '#34d399',
  },
];

// Exclusive Mythic Store Items (Floor 2 Diamond Vault)
export const DIAMOND_STORE_ITEMS: StoreItem[] = [
  {
    id: 'diamond_god',
    name: 'Dios del Diamante',
    category: 'skin',
    price: 15,
    currency: 'diamonds',
    description: 'Cubo prismático con refracciones de luz hiper-dimensionales y aura celestial.',
    icon: '💠',
    badge: 'MÍTICO 💎',
    primaryColor: '#38bdf8',
    secondaryColor: '#ffffff',
  },
  {
    id: 'mecha_titan',
    name: 'Titán Mecha Neón',
    category: 'skin',
    price: 25,
    currency: 'diamonds',
    description: 'Chasis robótico de combate con visor de plasma y reactores dobles.',
    icon: '🤖',
    badge: 'MÍTICO 💎',
    primaryColor: '#f43f5e',
    secondaryColor: '#38bdf8',
  },
  {
    id: 'celestial_phoenix',
    name: 'Fénix Celestial',
    category: 'skin',
    price: 35,
    currency: 'diamonds',
    description: 'Cresta de fuego estelar mística que resplandece con fuego sagrado.',
    icon: '🦅',
    badge: 'DIVINO 💎',
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
  },
  {
    id: 'void_dragon',
    name: 'Dragón del Vacío Cuántico',
    category: 'skin',
    price: 50,
    currency: 'diamonds',
    description: 'Escamas de materia oscura y corona de dragón con pulso púrpura.',
    icon: '🐉',
    badge: 'CÓSMICO 💎',
    primaryColor: '#a855f7',
    secondaryColor: '#06b6d4',
  },
  {
    id: 'cyber_spider_king',
    name: 'Reina Araña Suprema',
    category: 'skin',
    price: 65,
    currency: 'diamonds',
    description: 'Arácnido cibernético de combate con 8 ojos láser y exoesqueleto cromado.',
    icon: '🕷️',
    badge: 'EXTREMO 💎',
    primaryColor: '#ec4899',
    secondaryColor: '#10b981',
  },
  {
    id: 'warp_trail',
    name: 'Estela Hiperespacial',
    category: 'trail',
    price: 30,
    currency: 'diamonds',
    description: 'Rastro continuo de polvo estelar y destellos de salto a la velocidad luz.',
    icon: '🌌',
    badge: 'TRAIL 💎',
  },
  {
    id: 'blackhole_death',
    name: 'Agujero de Gusano Cuántico',
    category: 'deathEffect',
    price: 45,
    currency: 'diamonds',
    description: 'Detonación de singularidad que deforma el espacio-tiempo en la derrota.',
    icon: '🕳️',
    badge: 'EFECTO 💎',
  },
];

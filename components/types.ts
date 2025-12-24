
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Treasure extends GameObject {
  color: string;
  value: number;
  angle: number;
  rotationSpeed: number;
  dy: number;
  targetY: number;
  isFalling: boolean;
}

export interface Enemy extends GameObject {
  color: string;
  dx: number;
  amplitude: number;
  frequency: number;
  offsetY: number;
  baseY: number;
  health: number;
  maxHealth: number;
  isShark: boolean;
  isCrab?: boolean;
  aggressionLevel: number;
}

export interface Crab extends GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  color: string;
  speed: number;
}

export interface OxygenBubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  oxygenAmount: number;
  offset: number;
  isLarge: boolean;
  pulse?: number;
}

export interface Harpoon {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  width: number;
  angle: number;
  lifespan: number;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  lifespan: number;
  initialLifespan: number;
}

export interface Heart extends GameObject {
  color: string;
  value: number;
  angle: number;
  rotationSpeed: number;
  dy: number;
  targetY: number;
  isFalling: boolean;
}

export interface OxygenBonus extends GameObject {
  value: number;
  angle: number;
  rotationSpeed: number;
  dy: number;
  fullyVisible: boolean;
  alpha: number;
  lifespan: number;
}

export interface Diver {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  baseSpeed: number;
  dx: number;
  dy: number;
  color: string;
  oxygenDepletionRate: number;
  size: number;
  canFire: boolean;
  weaponCooldown: number;
  weaponCooldownMax: number;
  facingDirection: 'left' | 'right';
  comboCounter: number;
  comboTimer: number;
  isShieldActive: boolean;
  shieldTimer: number;
}

export type GameMode = 'classic' | 'shark-frenzy' | 'treasure-hunt';

export interface GameInstance {
  ctx: CanvasRenderingContext2D | null;
  animationFrameId: number | null;
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
  oxygen: number;
  level: number;
  playerLives: number;
  hearts: Heart[];
  treasures: Treasure[];
  enemies: Enemy[];
  crabs: Crab[];
  oxygenBubbles: OxygenBubble[];
  harpoons: Harpoon[];
  particles: Particle[];
  oxygenBonus: OxygenBonus[];
  oxygenGenerator: { x: number, y: number, width: number, height: number };
  diver: Diver;
  keys: Record<string, boolean>;
  lastUpdateTime: number;
  gameMode: GameMode;
  treasureHuntTimer: number;
  totalTreasuresInLevel: number;
  jellyfishes: Jellyfish[];
}

export interface Jellyfish extends GameObject {
  dx: number;
  dy: number;
  speed: number;
  tentacleOffset: number;
  opacity: number;
  color: string;
}

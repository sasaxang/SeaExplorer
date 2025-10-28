"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useGameImages, drawGameImage, ImageFormat } from '@/components/GameImageLoader'
import { initSounds, playSound, stopSound, setMuted, isMuted, playBackgroundMusic } from '@/utils/sounds'

// --- Interfaces ---
interface GameObject {
  x: number
  y: number
  width: number
  height: number
}

interface Treasure extends GameObject {
  color: string
  value: number
  angle: number        // For rotation
  rotationSpeed: number
  dy: number           // Vertical speed for falling
  targetY: number      // Y position to stop falling at
  isFalling: boolean
}

// RescueDiver interface removed

interface Enemy extends GameObject {
  color: string
  dx: number
  amplitude: number
  frequency: number
  offsetY: number
  baseY: number
  health: number
  maxHealth: number
  isShark: boolean
  isCrab?: boolean // Identify if this is a crab enemy
  aggressionLevel: number // For increasing shark aggression as game progresses
}

// New Crab enemy that moves along the ocean floor
interface Crab extends GameObject {
  x: number
  y: number
  width: number
  height: number
  dx: number
  color: string
  speed: number
}

interface OxygenBubble {
  x: number
  y: number
  radius: number
  speed: number
  color: string
  oxygenAmount: number
  offset: number
  isLarge: boolean
  pulse?: number
}

interface Harpoon {
  x: number
  y: number
  dx: number
  dy: number
  length: number
  width: number
  angle: number
  lifespan: number
}

// Added Particle Interface
interface Particle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    color: string;
    lifespan: number; // In frames or ms
    initialLifespan: number;
}

// Heart interface for player lives system
interface Heart extends GameObject {
  color: string
  value: number
  angle: number
  rotationSpeed: number
  dy: number
  targetY: number
  isFalling: boolean
}

// Special oxygen bonus interface
interface OxygenBonus extends GameObject {
  value: number
  angle: number
  rotationSpeed: number
  dy: number
  fullyVisible: boolean
  alpha: number
  lifespan: number
}

// --- Constants ---
const MAX_OXYGEN = 300;
const COMBO_TIMEOUT_FRAMES = 180; // 3 seconds at 60fps
const GRAVITY = 0.02; // Reduced gravity for slower falling treasures and hearts
const PARTICLE_LIFESPAN = 60; // Frames
const RAPID_FIRE_THRESHOLD_FACTOR = 0.5; // Allow firing again when cooldown is 50% done if space held
const MAX_PLAYER_LIVES = 10;
const ENEMY_SHARK_CHANCE = 0.5; // 50% chance of shark vs regular fish

interface SeaquestGameProps {
  imageFormat?: ImageFormat;
}

export default function SeaquestGame({ imageFormat = 'png' }: SeaquestGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [restartTrigger, setRestartTrigger] = useState(0)
  const [uiGameState, setUiGameState] = useState<"start" | "playing" | "over">("start")
  const [finalScore, setFinalScore] = useState(0)
  // Sound is always on by default
  const soundMuted = false
  
  // Load game images with the specified format
  const { images, loadingComplete } = useGameImages(imageFormat)

  // --- Game State Ref ---
  const gameInstance = useRef<{
    ctx: CanvasRenderingContext2D | null
    animationFrameId: number | null
    gameStarted: boolean
    gameOver: boolean
    score: number
    oxygen: number
    level: number
    playerLives: number
    hearts: Heart[]
    treasures: Treasure[]
    // rescueDivers removed
    enemies: Enemy[]
    crabs: Crab[] // Add crabs array for crab enemies 
    oxygenBubbles: OxygenBubble[]
    harpoons: Harpoon[]
    particles: Particle[] // Added particles array
    oxygenBonus: OxygenBonus[] // Special oxygen bonus
    oxygenGenerator: { x: number, y: number, width: number, height: number }
    diver: {
      x: number
      y: number
      width: number
      height: number
      speed: number
      baseSpeed: number // Store original speed for power-ups later
      dx: number
      dy: number
      color: string
      oxygenDepletionRate: number
      size: number
      canFire: boolean
      weaponCooldown: number
      weaponCooldownMax: number
      facingDirection: 'left' | 'right'
      comboCounter: number
      comboTimer: number
      // Power-up states (placeholders for now)
      isShieldActive: boolean
      shieldTimer: number
    }
    keys: Record<string, boolean>
    lastUpdateTime: number
  } | null>(null)

  const handleRestart = useCallback(() => {
    setRestartTrigger((prev) => prev + 1)
    setUiGameState("start")
  }, [])

  // --- Main Game Effect Hook ---
  useEffect(() => {
    // Initialize sound effects
    initSounds();
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize or re-initialize game state
    if (!gameInstance.current || restartTrigger > 0) {
      console.log("Setting up game instance. Restart Trigger:", restartTrigger);
      gameInstance.current = {
        ctx: ctx,
        animationFrameId: null,
        gameStarted: false,
        gameOver: false,
        score: 0,
        oxygen: MAX_OXYGEN,
        level: 1,
        playerLives: 3, // Start with 3 lives
        hearts: [], // Initialize hearts array
        treasures: [],
        // rescueDivers removed
        enemies: [],
        crabs: [], // Initialize crabs array
        oxygenBubbles: [],
        harpoons: [],
        particles: [], // Initialize particles
        oxygenBonus: [], // Special oxygen bonus
        // Position oxygen generator at the bottom of the ocean
        oxygenGenerator: {
          x: canvas.width / 2 - 30, // Center it horizontally, with some offset
          y: canvas.height - 60,    // Position it near the bottom
          width: 60,                // Dimensions of the generator
          height: 50
        },
        diver: {
          x: canvas.width / 2,
          y: canvas.height / 2,
          width: 70, // Maximum width of 70 pixels as requested
          height: 47, // Maintain aspect ratio (2:3 for the submarine image)
          speed: 4,
          baseSpeed: 4,
          dx: 0,
          dy: 0,
          color: "#00a8ff",
          oxygenDepletionRate: 0.05,
          size: 1,
          canFire: true,
          weaponCooldown: 0,
          weaponCooldownMax: 30,
          facingDirection: 'right',
          comboCounter: 0,
          comboTimer: 0,
          isShieldActive: false,
          shieldTimer: 0,
        },
        keys: { ArrowRight: false, ArrowLeft: false, ArrowUp: false, ArrowDown: false, Space: false },
        lastUpdateTime: performance.now(),
      }
    }

    const game = gameInstance.current
    if (!game) return;

    // --- Generation Functions ---
    const generateHeart = (position: { x: number, y: number }) => {
        if (!game) return;
        
        // Don't generate if player already has max lives
        if (game.playerLives >= MAX_PLAYER_LIVES) return;
        
        const startX = position.x;
        const startY = position.y;
        const stopY = canvas.height - 25 - Math.random() * 10; // Stop near bottom
        
        game.hearts.push({
            x: Math.max(10, Math.min(canvas.width - 10, startX)), // Clamp X
            y: startY,
            width: 20, // Heart dimensions
            height: 18,
            color: "#ff3377", // Pink heart
            value: 1, // Each heart gives 1 life
            angle: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05, // Radians per frame (slower rotation)
            dy: 0.3, // Initial falling speed (slower than treasures)
            targetY: stopY,
            isFalling: true,
        });
    }
    
    const generateTreasures = (count: number, position?: { x: number, y: number }) => {
      console.log(`Generating ${count} falling treasures.`);
      for (let i = 0; i < count; i++) {
        const startX = position?.x ?? Math.random() * (canvas.width - 20);
        const startY = position?.y ?? 50; // Start near top if no position
        const stopY = canvas.height - 25 - Math.random() * 10; // Stop near bottom

        game.treasures.push({
          x: Math.max(10, Math.min(canvas.width - 10, startX)), // Clamp X
          y: startY,
          width: 16, // Diamond dimensions
          height: 20,
          color: "#ffff00", // Yellow diamond
          value: 15 + Math.floor(Math.random() * 10), // Slightly higher value
          angle: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1, // Radians per frame (adjust speed later)
          dy: 0.5, // Initial falling speed
          targetY: stopY,
          isFalling: true,
        })
      }
    }

    // Rescue diver generation removed
    const generateEnemies = (count: number) => {
        // Further reduce enemy count - only 1/5 of previous count
        if (game.enemies.length > 2 + Math.floor(game.level / 2)) {
            return;
        }
        
        for (let i = 0; i < count; i++) {
            // Determine if this is a small shark (50% chance if small size)
            const isSmallSize = Math.random() < 0.5;
            const isShark = isSmallSize && Math.random() < ENEMY_SHARK_CHANCE;
            
            // Size based on type (sharks are now bigger)
            const size = isShark ? 35 + Math.random() * 15 : (isSmallSize ? 20 + Math.random() * 10 : 30 + Math.random() * 15);
            const startY = 50 + Math.random() * (canvas.height - 150);
            
            // Health based on fish type as requested:
            // - Small fish: 1 hit
            // - Larger fish: 2 hits
            // - Sharks: 3 hits
            let maxHealth = 1; // Default for small fish
            
            if (isShark) {
                maxHealth = 3; // Sharks always take 3 hits
            } else if (!isSmallSize) {
                maxHealth = 2; // Larger fish take 2 hits
            }
            
            // Color based on type
            const color = isShark 
                ? `hsl(${Math.random() * 20 + 10}, 70%, 40%)` // Dark gray/brown for sharks 
                : `hsl(${Math.random() * 60 + 180}, 70%, 60%)`; // Blue-green for fish
            
            // Speed based on type (sharks are more aggressive)
            const baseSpeed = isShark 
                ? (1.5 + Math.random() * 1.5) 
                : (1 + Math.random() * 1);
                
            // Scale aggression with level
            const levelFactor = 1 + (game.level - 1) * 0.2; // 20% increase per level
            const aggressionLevel = isShark ? 1 + (game.level - 1) * 0.3 : 1;
            
            // Determine starting position (left or right edge)
            const startFromLeft = Math.random() < 0.5;
            
            // Set initial position and matching direction
            // Make sure direction matches the starting position (left->right, right->left)
            const xPosition = startFromLeft ? -size : canvas.width + size;
            const direction = startFromLeft ? 1 : -1; // Ensures fish move in the correct direction
                
            game.enemies.push({
                x: xPosition, 
                y: startY, 
                baseY: startY,
                width: size, 
                height: size * 0.6,
                color: color,
                dx: (baseSpeed * levelFactor) * direction, // Ensure direction matches starting position
                amplitude: 5 + Math.random() * 15, 
                frequency: 0.001 + Math.random() * 0.003,
                offsetY: Math.random() * Math.PI * 2,
                health: maxHealth,
                maxHealth: maxHealth,
                isShark: isShark,
                aggressionLevel: aggressionLevel
            });
        }
    }
    const generateOxygenBubbles = (count: number) => {
        for (let i = 0; i < count; i++) {
            // Increase bubble size (from 10-20 to 12-24)
            const radius = 12 + Math.random() * 12;
            game.oxygenBubbles.push({
                // Make bubbles come from the oxygen generator instead of random positions
                x: game.oxygenGenerator.x + (Math.random() * game.oxygenGenerator.width), 
                y: game.oxygenGenerator.y,
                radius: radius,
                // Slightly slower speed for better visibility (from 1-2.5 to 0.8-2.0)
                speed: 0.8 + Math.random() * 1.2, 
                color: "rgba(255, 255, 255, 0.7)",
                // Increase oxygen value (from 10-25 to 15-35)
                oxygenAmount: 15 + Math.random() * 20, 
                offset: Math.random() * Math.PI * 2, 
                isLarge: false,
            })
        }
    }
    const generateLargeOxygenBubble = () => {
        // Increase radius (from 25-35 to 30-45)
        const radius = 30 + Math.random() * 15;
        game.oxygenBubbles.push({
            // Make bubbles come from the oxygen generator instead of random positions
            x: game.oxygenGenerator.x + (game.oxygenGenerator.width / 2) + (Math.random() * 20 - 10), 
            y: game.oxygenGenerator.y, 
            radius: radius,
            // Slightly slower for better visibility (from 0.7-1.5 to 0.6-1.2)
            speed: 0.6 + Math.random() * 0.6, 
            color: "rgba(100, 200, 255, 0.8)",
            // Significantly increase oxygen value (from 40-60 to 60-100)
            oxygenAmount: 60 + Math.random() * 40, 
            offset: Math.random() * Math.PI * 2, 
            isLarge: true, 
            pulse: 0,
        })
    }
    
    // Generate a special oxygen bonus power-up that rises from the bottom
    const generateOxygenBonus = () => {
        if (!game) return;
        
        // Position at bottom of screen with random horizontal position
        const x = 50 + Math.random() * (canvas.width - 100);
        const y = canvas.height - 50; // Start near the bottom
        
        // Create the special oxygen bonus
        const bonus = {
            x: x,
            y: y,
            width: 50, // Slightly larger for better visibility
            height: 50,
            value: 150, // Large oxygen boost - increased from 100 to 150
            angle: 0,
            rotationSpeed: 0.01 + Math.random() * 0.02,
            dy: -0.8, // Rise upward (-0.8 instead of downward +0.2)
            fullyVisible: false, // Starts fading in
            alpha: 0, // Start invisible and fade in
            lifespan: 800, // Increased from 600 to 800 frames (about 13 seconds at 60fps)
        };
        
        // Add to game's oxygen bonus array
        game.oxygenBonus.push(bonus);
        
        // Play the hello sound when the bonus appears (not when player catches it)
        playSound('hello');
    }
    
    // Generate a crab enemy that moves along the ocean floor
    const generateCrab = () => {
        if (!game) return;
        
        // Determine starting position (left or right edge)
        const startFromLeft = Math.random() < 0.5;
        const speed = 0.8 + Math.random() * 0.4; // Slower than fish
        const direction = startFromLeft ? 1 : -1;
        
        // Dimensions for the crab
        const width = 40;
        const height = 25;
        
        // Position at the bottom of the screen
        const y = canvas.height - height - 5; // 5px from bottom
        
        // Create the crab
        game.crabs.push({
            x: startFromLeft ? -width : canvas.width,
            y: y,
            width: width,
            height: height,
            dx: speed * direction,
            color: "#ff5533", // Reddish-orange color
            speed: speed
        });
    }

    // --- Particle Explosion Function ---
    const createExplosion = (x: number, y: number, color: string) => {
        if (!game) return;
        const particleCount = 10 + Math.floor(Math.random() * 10); // 10-19 particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const radius = 1 + Math.random() * 2;
            game.particles.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: radius,
                color: color, // Use enemy color initially
                lifespan: PARTICLE_LIFESPAN,
                initialLifespan: PARTICLE_LIFESPAN,
            });
        }
    }

    // --- Initialization ---
    const init = () => {
        console.log("Initializing game...");
        if (!game) return;
        game.gameStarted = true; game.gameOver = false; game.score = 0;
        game.oxygen = MAX_OXYGEN; game.level = 1; game.lastUpdateTime = performance.now();
        game.playerLives = 3; // Initialize with 3 lives
        
        // Start playing background music when the game initializes
        playBackgroundMusic();
        // Reset diver
        game.diver.x = canvas.width / 2; game.diver.y = canvas.height / 2;
        game.diver.dx = 0; game.diver.dy = 0; game.diver.size = 1;
        game.diver.width = 70; game.diver.height = 47; game.diver.speed = game.diver.baseSpeed;
        game.diver.oxygenDepletionRate = 0.05; game.diver.canFire = true; game.diver.weaponCooldown = 0;
        game.diver.weaponCooldownMax = 30; game.diver.facingDirection = 'right';
        game.diver.comboCounter = 0; game.diver.comboTimer = 0;
        game.diver.isShieldActive = false; game.diver.shieldTimer = 0;
        // Clear arrays
        game.treasures = []; game.enemies = [];
        game.oxygenBubbles = []; game.harpoons = []; game.particles = []; 
        game.hearts = []; game.crabs = []; // Clear hearts and crabs
        game.oxygenBonus = []; // Clear oxygen bonus
        // Reset oxygen generator position
        game.oxygenGenerator = {
          x: canvas.width / 2 - 30,
          y: canvas.height - 60,
          width: 60,
          height: 50
        };
        // Generate initial objects
        generateEnemies(3); generateOxygenBubbles(2); generateLargeOxygenBubble();
        // Initialize a crab on the ocean floor
        generateCrab();
        // Start loop
        if (game.animationFrameId) cancelAnimationFrame(game.animationFrameId);
        game.animationFrameId = requestAnimationFrame(gameLoop);
        setUiGameState("playing"); setFinalScore(0);
    }

    // --- Collision Detection ---
    const isColliding = (obj1: GameObject, obj2: GameObject): boolean => {
        // For sharks, extend the hit detection area by 1 pixel beyond the visible shape
        const extraMargin = (obj2 as Enemy)?.isShark ? 1 : 0;
        
        // Adjust diver's hitbox to be 10% smaller for better gameplay
        let obj1Width = obj1.width;
        let obj1Height = obj1.height;
        let obj1X = obj1.x;
        let obj1Y = obj1.y;
        
        // Check if obj1 is the diver (submarine)
        const isDiver = obj1 === game.diver;
        
        if (isDiver) {
            // Reduce hitbox by 10%
            const widthReduction = obj1.width * 0.1;
            const heightReduction = obj1.height * 0.1;
            
            // Adjust size and position to center the hitbox
            obj1Width = obj1.width - widthReduction;
            obj1Height = obj1.height - heightReduction;
            obj1X = obj1.x + (widthReduction / 2);
            obj1Y = obj1.y + (heightReduction / 2);
        }
        
        return (
            obj1X < obj2.x + obj2.width + extraMargin &&
            obj1X + obj1Width > obj2.x - extraMargin &&
            obj1Y < obj2.y + obj2.height + extraMargin &&
            obj1Y + obj1Height > obj2.y - extraMargin
        )
     }
    const isCollidingCircle = (obj: GameObject, circle: OxygenBubble): boolean => {
        // Adjust diver's hitbox to be 10% smaller for better gameplay, like in isColliding function
        let objWidth = obj.width;
        let objHeight = obj.height;
        let objX = obj.x;
        let objY = obj.y;
        
        // Check if obj is the diver (submarine)
        const isDiver = obj === game.diver;
        
        if (isDiver) {
            // Reduce hitbox by 10%
            const widthReduction = obj.width * 0.1;
            const heightReduction = obj.height * 0.1;
            
            // Adjust size and position to center the hitbox
            objWidth = obj.width - widthReduction;
            objHeight = obj.height - heightReduction;
            objX = obj.x + (widthReduction / 2);
            objY = obj.y + (heightReduction / 2);
        }
        
        const closestX = Math.max(objX, Math.min(circle.x, objX + objWidth));
        const closestY = Math.max(objY, Math.min(circle.y, objY + objHeight));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        return distanceSquared < circle.radius * circle.radius;
     }

    // --- Update Functions ---
    const updateDiver = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
        // Apply buoyancy
        game.diver.dy -= 0.02 * scaleFactor;
        // Update horizontal velocity and facing direction
        if (game.keys.ArrowRight) { game.diver.dx = game.diver.speed; game.diver.facingDirection = 'right'; }
        else if (game.keys.ArrowLeft) { game.diver.dx = -game.diver.speed; game.diver.facingDirection = 'left'; }
        else { game.diver.dx *= Math.pow(0.9, scaleFactor); }
        // Update vertical velocity
        if (game.keys.ArrowDown) { game.diver.dy = game.diver.speed; }
        else if (game.keys.ArrowUp) { game.diver.dy = -game.diver.speed; }
        else { game.diver.dy *= Math.pow(0.9, scaleFactor); }
        // Update position
        game.diver.x += game.diver.dx * scaleFactor;
        game.diver.y += game.diver.dy * scaleFactor;
        // Keep diver within bounds
        game.diver.x = Math.max(0, Math.min(canvas.width - game.diver.width, game.diver.x));
        game.diver.y = Math.max(0, Math.min(canvas.height - game.diver.height, game.diver.y));
        // Update combo timer
        if (game.diver.comboTimer > 0) {
            game.diver.comboTimer -= scaleFactor;
            if (game.diver.comboTimer <= 0) { game.diver.comboCounter = 0; game.diver.comboTimer = 0; }
        }
        // Update Shield Timer (placeholder)
        if(game.diver.shieldTimer > 0) {
            game.diver.shieldTimer -= scaleFactor;
            if(game.diver.shieldTimer <= 0) game.diver.isShieldActive = false;
        }
    }

    const updateWeaponSystem = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60); // Normalize to 60FPS
      
        // Weapon cooldown
        if (game.diver.weaponCooldown > 0) {
            game.diver.weaponCooldown -= scaleFactor;
            if (game.diver.weaponCooldown <= 0) {
                game.diver.canFire = true;
            }
        }
      
        // Firing logic
        if ((game.keys.Space || game.keys[" "]) && 
             (game.diver.canFire || (game.diver.weaponCooldown <= game.diver.weaponCooldownMax * RAPID_FIRE_THRESHOLD_FACTOR))) {
            fireHarpoon();
            game.diver.canFire = false;
            game.diver.weaponCooldown = game.diver.weaponCooldownMax;
        }
      
        // Update existing harpoons
        game.harpoons = game.harpoons.filter(harpoon => {
            harpoon.x += harpoon.dx * scaleFactor;
            harpoon.y += harpoon.dy * scaleFactor;
            harpoon.lifespan -= scaleFactor;
          
            // Check if harpoon is still active
            return (
                harpoon.lifespan > 0 &&
                harpoon.x > -harpoon.length &&
                harpoon.x < canvas.width + harpoon.length &&
                harpoon.y > -harpoon.length &&
                harpoon.y < canvas.height + harpoon.length
            );
        });
    }
  
    const fireHarpoon = () => {
        if (!game) return;
      
        // Direction based on player facing
        const direction = game.diver.facingDirection === 'right' ? 1 : -1;
        const speed = 10;
      
        // Play harpoon firing sound
        playSound('hit');
      
        // Create a new harpoon - positioned to exit from opposite side of bubbles
        // Bubbles exit from back of submarine, so harpoons should exit from front
        game.harpoons.push({
            x: game.diver.facingDirection === 'left' ? 
                game.diver.x : 
                game.diver.x + game.diver.width,
            y: game.diver.y + game.diver.height / 2,
            dx: direction * speed,
            dy: 0,
            length: 20,
            width: 3,
            angle: direction === 1 ? 0 : Math.PI,
            lifespan: 60 // Frames of life
        });
    }

    const updateHearts = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
        
        // Update existing hearts
        for (let heart of game.hearts) {
            heart.angle += heart.rotationSpeed * scaleFactor;
            
            // Handle falling hearts - slower acceleration than treasures
            if (heart.isFalling) {
                heart.dy += (GRAVITY * 0.8) * scaleFactor; // 80% of regular gravity
                heart.y += heart.dy * scaleFactor;
                
                // Stop at target Y position
                if (heart.y >= heart.targetY) {
                    heart.y = heart.targetY;
                    heart.isFalling = false;
                    heart.dy = 0;
                }
            }
            
            // Collision with diver
            if (isColliding(game.diver, heart)) {
                // Increase player lives
                if (game.playerLives < MAX_PLAYER_LIVES) {
                    game.playerLives += heart.value;
                    
                    // Cap at maximum
                    game.playerLives = Math.min(game.playerLives, MAX_PLAYER_LIVES);
                    
                    // Add score bonus for collecting heart
                    game.score += 50 * (game.diver.comboCounter + 1);
                    
                    // Update combo
                    game.diver.comboCounter++;
                    game.diver.comboTimer = COMBO_TIMEOUT_FRAMES;
                    
                    // Fancy heart collection effect
                    createExplosion(heart.x + heart.width/2, heart.y + heart.height/2, heart.color);
                    // Add extra pink particles for more visual impact
                    createExplosion(heart.x + heart.width/2, heart.y + heart.height/2, "#ff88aa");
                }
                
                // Remove the heart
                game.hearts = game.hearts.filter(h => h !== heart);
            }
        }
    }
    
    // Update oxygen bonus items
    const updateOxygenBonus = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
        
        // Random chance to spawn oxygen bonus (rare)
        if (game.oxygenBonus.length === 0 && Math.random() < 0.0005 * scaleFactor) {
            generateOxygenBonus();
        }
        
        // Update existing oxygen bonuses
        game.oxygenBonus = game.oxygenBonus.filter(bonus => {
            // Fade in effect
            if (!bonus.fullyVisible && bonus.alpha < 1) {
                bonus.alpha += 0.02 * scaleFactor;
                if (bonus.alpha >= 1) {
                    bonus.alpha = 1;
                    bonus.fullyVisible = true;
                }
            }
            
            // Rotation and movement
            bonus.angle += bonus.rotationSpeed * scaleFactor;
            bonus.y += bonus.dy * scaleFactor;
            
            // Reduce lifespan
            bonus.lifespan -= scaleFactor;
            
            // Fade out if about to expire
            if (bonus.lifespan < 100) {
                bonus.alpha = Math.max(0, bonus.alpha - 0.02 * scaleFactor);
            }
            
            // Check if bonus has reached the surface
            if (bonus.y <= 30) {
                // Stop the hello sound
                stopSound('hello');
                
                // Bonus reached the surface safely - give player a big oxygen reward
                game.oxygen = Math.min(MAX_OXYGEN, game.oxygen + bonus.value * 1.5); // 50% extra oxygen for protecting it
                
                // Add score bonus
                game.score += 250 * (game.diver.comboCounter + 1);
                
                // Update combo
                game.diver.comboCounter++;
                game.diver.comboTimer = COMBO_TIMEOUT_FRAMES;
                
                // Create fancy effect for reaching the surface
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#88ffff");
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#ffffff");
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#ffff88");
                
                return false; // Remove this bonus
            }
            
            // Check for collisions with enemies - bonus gets destroyed if hit by enemies
            let hitByEnemy = false;
            for (const enemy of game.enemies) {
                if (isColliding(enemy, bonus)) {
                    hitByEnemy = true;
                    break;
                }
            }
            
            // If bonus was hit by an enemy, destroy it
            if (hitByEnemy) {
                // Stop the hello sound
                stopSound('hello');
                
                // Create explosion effect for the destroyed bonus
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#ff5555");
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#ffaa55");
                
                // Play explosion sound when bonus is destroyed
                playSound('explosion');
                
                return false; // Remove this bonus
            }
            
            // Collision with diver - stop hello sound when collected
            if (isColliding(game.diver, bonus)) {
                // Stop the hello sound
                stopSound('hello');
                
                // Large oxygen boost
                game.oxygen = Math.min(MAX_OXYGEN, game.oxygen + bonus.value);
                
                // Add score bonus
                game.score += 150 * (game.diver.comboCounter + 1);
                
                // Update combo
                game.diver.comboCounter++;
                game.diver.comboTimer = COMBO_TIMEOUT_FRAMES;
                
                // Create fancy collection effect
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#88ffff");
                createExplosion(bonus.x + bonus.width/2, bonus.y + bonus.height/2, "#ffff88");
                
                return false; // Remove this bonus
            }
            
            // Keep if lifespan > 0 and still visible
            return bonus.lifespan > 0 && bonus.alpha > 0;
        });
    }

    const updateTreasures = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
      
        // Update existing treasures
        for (let treasure of game.treasures) {
            treasure.angle += treasure.rotationSpeed * scaleFactor;
            
            // Handle falling treasures
            if (treasure.isFalling) {
                // Accelerate by gravity
                treasure.dy += GRAVITY * scaleFactor;
                treasure.y += treasure.dy * scaleFactor;
                
                // Stop at target Y position
                if (treasure.y >= treasure.targetY) {
                    treasure.y = treasure.targetY;
                    treasure.isFalling = false;
                    treasure.dy = 0;
                }
            }
            
            // Collision with diver
            if (isColliding(game.diver, treasure)) {
                // Add score
                game.score += treasure.value * (game.diver.comboCounter + 1);
                
                // Update combo
                game.diver.comboCounter++;
                game.diver.comboTimer = COMBO_TIMEOUT_FRAMES;
                
                // Create particles
                createExplosion(treasure.x + treasure.width/2, treasure.y + treasure.height/2, treasure.color);
                
                // Remove treasure
                game.treasures = game.treasures.filter(t => t !== treasure);
            }
        }
      
        // Disable random treasure spawning - only from sharks now
        // if (Math.random() < 0.002 * game.level * scaleFactor) {
        //     generateTreasures(1);
        // }
    }

    // Update rescue divers function removed

    const updateEnemies = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
      
        // Process each enemy
        for (let enemy of game.enemies) {
            // Update position
            enemy.x += enemy.dx * scaleFactor;
            enemy.y = enemy.baseY + Math.sin(enemy.offsetY) * enemy.amplitude;
            enemy.offsetY += enemy.frequency * scaleFactor;
            
            // Wrap around edges
            if (enemy.x < -enemy.width*2 && enemy.dx < 0) {
                enemy.x = canvas.width + enemy.width;
            } else if (enemy.x > canvas.width + enemy.width*2 && enemy.dx > 0) {
                enemy.x = -enemy.width;
            }
            
            // Collision with player (if no shield active)
            if (isColliding(game.diver, enemy) && !game.diver.isShieldActive) {
                // Player hit by enemy!
                game.oxygen = Math.max(0, game.oxygen - 30);
                
                // Create damage effect
                createExplosion(
                    game.diver.x + game.diver.width/2,
                    game.diver.y + game.diver.height/2,
                    "#ff0000"
                );
                
                // Reset combo
                game.diver.comboCounter = 0;
                game.diver.comboTimer = 0;
                
                // Push the enemy away
                enemy.dx = -enemy.dx;
                enemy.x += enemy.dx * 20;
            }
            
            // Collision with harpoons
            for (let harpoon of game.harpoons) {
                const harpoonRect = {
                    x: harpoon.x,
                    y: harpoon.y - harpoon.width/2,
                    width: harpoon.length,
                    height: harpoon.width
                };
                
                if (isColliding(harpoonRect, enemy)) {
                    // Hit!
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color);
                    
                    // Play explosion sound
                    playSound('explosion');
                    
                    // Reduce enemy health
                    enemy.health -= 1;
                    
                    // Add score for the hit (more points for final hit)
                    if (enemy.health <= 0) {
                        // Final hit score is higher
                        game.score += 25 * (game.diver.comboCounter + 1);
                    } else {
                        // Just a hit, smaller score
                        game.score += 10 * (game.diver.comboCounter + 1);
                    }
                    
                    // Update combo
                    game.diver.comboCounter++;
                    game.diver.comboTimer = COMBO_TIMEOUT_FRAMES;
                    
                    // Remove the harpoon in all cases
                    game.harpoons = game.harpoons.filter(h => h !== harpoon);
                    
                    // If enemy is dead
                    if (enemy.health <= 0) {
                        // Spawn heart if this was a shark (lower chance)
                        if (enemy.isShark && Math.random() < 0.5) {
                            generateHeart({ x: enemy.x, y: enemy.y });
                        }
                        
                        // Only spawn treasures from shark enemies
                        if (enemy.isShark && Math.random() < 0.4) {
                            generateTreasures(1, { x: enemy.x, y: enemy.y });
                        }
                        
                        // Remove the enemy
                        game.enemies = game.enemies.filter(e => e !== enemy);
                        
                        // Spawn a new enemy after a delay
                        setTimeout(() => generateEnemies(1), 1000 + Math.random() * 2000);
                    } else {
                        // Enemy still alive - push it back slightly and make it flash
                        enemy.dx *= -0.8; // Reverse direction but slower
                    }
                    
                    break;
                }
            }
        }
      
        // Random chance to spawn new enemies based on level
        if (game.enemies.length < 3 + game.level && Math.random() < 0.002 * scaleFactor) {
            generateEnemies(1);
        }
    }
    
    const updateCrabs = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
        
        // If no crabs, randomly generate one
        if (game.crabs.length === 0 && Math.random() < 0.001 * scaleFactor) {
            generateCrab();
        }
        
        // Process each crab
        for (let crab of game.crabs) {
            // Update position - crabs move horizontally along the ocean floor
            crab.x += crab.dx * scaleFactor;
            
            // Wrap around edges
            if (crab.x < -crab.width*2 && crab.dx < 0) {
                crab.x = canvas.width + crab.width;
            } else if (crab.x > canvas.width + crab.width*2 && crab.dx > 0) {
                crab.x = -crab.width;
            }
            
            // Check for collision with treasures that have hit the ocean floor
            for (let treasure of game.treasures) {
                if (!treasure.isFalling && isColliding(crab, treasure)) {
                    // Crab collects the treasure
                    createExplosion(treasure.x + treasure.width/2, treasure.y + treasure.height/2, treasure.color);
                    game.treasures = game.treasures.filter(t => t !== treasure);
                    // Small score bonus for a crab collecting treasure
                    game.score += 5;
                }
            }
            
            // Check for collision with hearts that have hit the ocean floor
            for (let heart of game.hearts) {
                if (!heart.isFalling && isColliding(crab, heart)) {
                    // Crab collects the heart
                    createExplosion(heart.x + heart.width/2, heart.y + heart.height/2, heart.color);
                    game.hearts = game.hearts.filter(h => h !== heart);
                }
            }
            
            // Collision with harpoons (although crabs don't die, they get pushed)
            for (let harpoon of game.harpoons) {
                const harpoonRect = {
                    x: harpoon.x,
                    y: harpoon.y - harpoon.width/2,
                    width: harpoon.length,
                    height: harpoon.width
                };
                
                if (isColliding(harpoonRect, crab)) {
                    // Hit causes the crab to reverse direction and be pushed back
                    crab.dx = -crab.dx;
                    crab.x += crab.dx * 10;
                    
                    // Remove the harpoon
                    game.harpoons = game.harpoons.filter(h => h !== harpoon);
                    
                    // Create a small particle effect
                    createExplosion(crab.x + crab.width/2, crab.y + crab.height/2, crab.color);
                    break;
                }
            }
        }
    }

    const updateOxygenBubbles = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
      
        // Get current oxygen level for comparison
        const prevOxygenLevel = game.oxygen;
        
        // Depth-based oxygen depletion - deeper = faster depletion
        // Calculate the depth factor (0 at top, 1 at bottom)
        const depthFactor = game.diver.y / canvas.height;
        
        // Adjust depletion rate based on depth (1.0x at top, 2.0x at bottom)
        const depthMultiplier = 1.0 + depthFactor;
        
        // Deplete player oxygen over time with depth factor
        game.oxygen = Math.max(0, game.oxygen - (game.diver.oxygenDepletionRate * depthMultiplier) * scaleFactor);
        
        // Play warning sound when oxygen drops below 20%
        const oxygenPercentage = game.oxygen / MAX_OXYGEN;
        if (oxygenPercentage <= 0.2 && prevOxygenLevel / MAX_OXYGEN > 0.2) {
            // Play warning sound when crossing the 20% threshold
            playSound('warning');
        }
        
        // Periodically play warning sound when very low (below 10%)
        if (oxygenPercentage < 0.1 && Math.random() < 0.01 * scaleFactor) {
            playSound('warning');
        }
        
        // Process each bubble
        for (let bubble of game.oxygenBubbles) {
            // Move bubble upward with a slight wave motion
            bubble.y -= bubble.speed * scaleFactor;
            bubble.x += Math.sin(bubble.offset) * 0.3 * scaleFactor;
            bubble.offset += 0.03 * scaleFactor;
            
            // Add pulse animation to large bubbles
            if (bubble.isLarge && bubble.pulse !== undefined) {
                bubble.pulse += 0.05 * scaleFactor;
                const pulseFactor = Math.sin(bubble.pulse) * 0.1 + 1;
                bubble.radius = (bubble.isLarge ? 25 : 10) * pulseFactor;
            }
            
            // Collision with player
            if (isCollidingCircle(game.diver, bubble)) {
                // Add oxygen
                game.oxygen = Math.min(MAX_OXYGEN, game.oxygen + bubble.oxygenAmount);
                
                // Create effect
                createExplosion(bubble.x, bubble.y, bubble.color);
                
                // Play bubble collection sound
                playSound('bubble');
                
                // Remove the bubble
                game.oxygenBubbles = game.oxygenBubbles.filter(b => b !== bubble);
            }
            
            // Remove bubbles that go off-screen
            if (bubble.y < -bubble.radius) {
                game.oxygenBubbles = game.oxygenBubbles.filter(b => b !== bubble);
            }
        }
      
        // Less frequent smaller oxygen bubbles (reduced from 0.01 to 0.005)
        if (Math.random() < 0.005 * scaleFactor) {
            generateOxygenBubbles(1);
        }
      
        // Less frequent large oxygen bubbles (reduced from 0.001 to 0.0007)
        if (Math.random() < 0.0007 * scaleFactor) {
            generateLargeOxygenBubble();
        }
      
        // Handle player death if oxygen depletes completely
        if (game.oxygen <= 0 && game.gameStarted && !game.gameOver) {
            // Lose a life when out of oxygen
            game.playerLives--;
            
            // Create a death effect
            createExplosion(
                game.diver.x + game.diver.width/2,
                game.diver.y + game.diver.height/2,
                "#ff0000"
            );
            
            if (game.playerLives > 0) {
                // Reset position and oxygen if still have lives
                game.diver.x = canvas.width / 2;
                game.diver.y = canvas.height / 2;
                game.oxygen = MAX_OXYGEN / 2; // Start with half oxygen on respawn
                game.diver.comboCounter = 0;
                game.diver.comboTimer = 0;
                
                // Give temporary shield/immunity
                game.diver.isShieldActive = true;
                game.diver.shieldTimer = 180; // 3 seconds of immunity
            } else {
                // Game over if no lives left
                endGame();
            }
        }
    }

    const updateParticles = (deltaTime: number) => {
        if (!game) return;
        const scaleFactor = deltaTime / (1000 / 60);
      
        // Update particle positions and lifespans
        game.particles = game.particles.filter(particle => {
            // Update position
            particle.x += particle.dx * scaleFactor;
            particle.y += particle.dy * scaleFactor;
            
            // Apply drag
            particle.dx *= 0.95;
            particle.dy *= 0.95;
            
            // Update lifespan
            particle.lifespan -= scaleFactor;
            
            // Keep if still alive
            return particle.lifespan > 0;
        });
    }

    const updateLevel = () => {
        if (!game) return;
      
        // Check if we should level up (score-based progression)
        const levelThreshold = 2000 * game.level;
        if (game.score >= levelThreshold && game.level < 5) {
            game.level++;
            
            // Difficulty increases
            game.diver.oxygenDepletionRate += 0.02;
            
            // Spawn more enemies on level up (divers removed)
            generateEnemies(game.level);
            generateOxygenBubbles(1);
            
            // Create level up effect
            createLevelUpEffect();
        }
    }

    const createLevelUpEffect = () => {
        if (!game || !ctx) return;
      
        // Create particles around the edges of the screen
        for (let i = 0; i < 40; i++) {
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            switch (edge) {
                case 0: // top
                    x = Math.random() * canvas.width;
                    y = 0;
                    break;
                case 1: // right
                    x = canvas.width;
                    y = Math.random() * canvas.height;
                    break;
                case 2: // bottom
                    x = Math.random() * canvas.width;
                    y = canvas.height;
                    break;
                case 3: // left
                    x = 0;
                    y = Math.random() * canvas.height;
                    break;
                default:
                    x = 0;
                    y = 0;
            }
            
            // Create the particle with a gold/white color
            game.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 3,
                dy: (Math.random() - 0.5) * 3,
                radius: 2 + Math.random() * 3,
                color: Math.random() < 0.5 ? "#ffff00" : "#ffffff",
                lifespan: PARTICLE_LIFESPAN * 2,
                initialLifespan: PARTICLE_LIFESPAN * 2
            });
        }
    }

    // --- Render Functions ---
    const render = () => {
        if (!game || !ctx) return;
      
        // Clear canvas
        ctx.fillStyle = "#000030"; // Deep blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background elements (waves, etc)
        drawBackground();
        
        // Draw treasures
        drawTreasures();
        
        // Draw hearts - they should appear beneath enemies
        drawHearts();
        
        // Draw enemies
        drawEnemies();
        
        // Draw crabs
        drawCrabs();
        
        // Draw oxygen generator
        drawOxygenGenerator();
        
        // Draw oxygen bubbles
        drawOxygenBubbles();
        
        // Draw special oxygen bonus
        drawOxygenBonus();
        
        // Draw harpoons
        drawHarpoons();
        
        // Draw player
        drawDiver();
        
        // Draw particles
        drawParticles();
        
        // Draw UI
        drawUI();
    }

    const drawBackground = () => {
        if (!game || !ctx) return;
      
        // Draw background image if available
        if (images.background) {
            // Draw the background image to fill the canvas
            drawGameImage(
                ctx, 
                images.background, 
                0, 
                0, 
                canvas.width, 
                canvas.height,
                'transparent' // No fallback needed as we'll draw the gradient if image fails
            );
        } else {
            // Fallback: Draw a simple gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "rgba(0, 20, 60, 1)");
            gradient.addColorStop(1, "rgba(0, 10, 30, 1)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw subtle waves
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            
            const time = performance.now() * 0.001;
            
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const amplitude = 5 - i;
                const frequency = 0.01 + i * 0.005;
                const yOffset = 50 + i * 100;
                
                for (let x = 0; x < canvas.width; x += 5) {
                    const y = yOffset + Math.sin(x * frequency + time) * amplitude;
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
        }
    }

    const drawTreasures = () => {
        if (!game || !ctx) return;
      
        for (const treasure of game.treasures) {
            ctx.save();
            
            // Translate to the center of the treasure for rotation
            ctx.translate(treasure.x + treasure.width/2, treasure.y + treasure.height/2);
            ctx.rotate(treasure.angle);
            
            // Draw the treasure using the image
            ctx.translate(-treasure.width/2, -treasure.height/2); // Move back to top-left for drawing
            
            drawGameImage(
                ctx,
                images.treasure,
                0, 
                0,
                treasure.width,
                treasure.height,
                treasure.color // Fallback color if image not loaded
            );
            
            ctx.restore();
        }
    }

    // drawRescueDivers function removed

    const drawHearts = () => {
        if (!game || !ctx) return;
        
        for (const heart of game.hearts) {
            ctx.save();
            
            // Translate to the center of the heart for rotation
            ctx.translate(heart.x + heart.width/2, heart.y + heart.height/2);
            ctx.rotate(heart.angle);
            
            // Move back to top-left for drawing
            ctx.translate(-heart.width/2, -heart.height/2);
            
            // Draw the heart using the image
            drawGameImage(
                ctx,
                images.heart,
                0,
                0,
                heart.width,
                heart.height,
                heart.color // Fallback color if image not loaded
            );
            
            ctx.restore();
        }
    }

    const drawEnemies = () => {
        if (!game || !ctx) return;
      
        for (const enemy of game.enemies) {
            // Select the appropriate image based on enemy type and direction
            let enemyImage;
            let enemyWidth = enemy.width;
            let enemyHeight = enemy.height;
            
            if (enemy.isShark) {
                // Increase shark size by 70%
                enemyWidth = enemy.width * 1.7;
                enemyHeight = enemy.height * 1.7;
                enemyImage = enemy.dx < 0 ? images.shark_left : images.shark;
            } else {
                enemyImage = enemy.dx < 0 ? images.fish_left : images.fish;
            }
            
            // Draw the enemy image
            drawGameImage(
                ctx,
                enemyImage,
                enemy.x,
                enemy.y,
                enemyWidth,  // Use the adjusted width for sharks
                enemyHeight, // Use the adjusted height for sharks
                enemy.color  // Use enemy color as fallback
            );
            
            // Removed health indicator dots as requested
        }
    }
    
    const drawCrabs = () => {
        if (!game || !ctx) return;
        
        // Draw each crab
        for (const crab of game.crabs) {
            // Draw the crab using the crab image
            drawGameImage(
                ctx,
                images.crab,
                crab.x,
                crab.y,
                crab.width,
                crab.height,
                crab.color // Fallback color if image not loaded
            );
        }
    }
    
    const drawOxygenGenerator = () => {
        if (!game || !ctx) return;
        
        // Draw the oxygen generator at the bottom of the screen
        drawGameImage(
            ctx,
            images.oxygen_generator,
            game.oxygenGenerator.x,
            game.oxygenGenerator.y,
            game.oxygenGenerator.width,
            game.oxygenGenerator.height,
            "#4488cc" // Fallback color - blue-ish
        );
        
        // Add bubbles coming out of the generator for visual effect
        const time = performance.now() * 0.001;
        for (let i = 0; i < 3; i++) {
            const bubbleOffset = (time * 2 + i) % 3;
            const bubbleSize = 2 + bubbleOffset * 2; // Slightly larger bubbles
            
            // Position bubbles on top of generator
            const bubbleX = game.oxygenGenerator.x + game.oxygenGenerator.width * (0.3 + i * 0.2); 
            const bubbleY = game.oxygenGenerator.y - 5 - bubbleOffset * 3; // Position above generator
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const drawOxygenBubbles = () => {
        if (!game || !ctx) return;
      
        for (const bubble of game.oxygenBubbles) {
            // Draw the oxygen bubble using the loaded image
            if (images.oxygen_bubble) {
                const bubbleSize = bubble.radius * 2; // Convert radius to diameter
                
                // Draw the bubble image centered on the bubble's coordinates
                drawGameImage(
                    ctx,
                    images.oxygen_bubble,
                    bubble.x - bubbleSize/2,
                    bubble.y - bubbleSize/2,
                    bubbleSize,
                    bubbleSize,
                    bubble.color // Fallback color
                );
                
                // Add tiny bubbles around large bubbles
                if (bubble.isLarge) {
                    for (let i = 0; i < 3; i++) {
                        const angle = bubble.offset + i * (Math.PI * 2 / 3);
                        const distance = bubble.radius * 1.3;
                        const miniX = bubble.x + Math.cos(angle) * distance;
                        const miniY = bubble.y + Math.sin(angle) * distance;
                        
                        // Draw smaller bubbles
                        drawGameImage(
                            ctx,
                            images.oxygen_bubble,
                            miniX - bubble.radius * 0.2,
                            miniY - bubble.radius * 0.2,
                            bubble.radius * 0.4,
                            bubble.radius * 0.4,
                            "rgba(255, 255, 255, 0.4)" // Fallback color
                        );
                    }
                    
                    // Add oxygen symbol for large bubbles
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.font = `${Math.round(bubble.radius * 0.8)}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("O₂", bubble.x, bubble.y);
                }
            } else {
                // Fallback rendering if image is not loaded
                // Draw outer bubble
                ctx.fillStyle = bubble.color;
                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Add a highlight to the bubble
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.beginPath();
                ctx.arc(
                    bubble.x - bubble.radius * 0.3,
                    bubble.y - bubble.radius * 0.3,
                    bubble.radius * 0.3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Add tiny bubbles around large bubbles
                if (bubble.isLarge) {
                    for (let i = 0; i < 3; i++) {
                        const angle = bubble.offset + i * (Math.PI * 2 / 3);
                        const distance = bubble.radius * 1.3;
                        const miniX = bubble.x + Math.cos(angle) * distance;
                        const miniY = bubble.y + Math.sin(angle) * distance;
                        
                        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                        ctx.beginPath();
                        ctx.arc(miniX, miniY, bubble.radius * 0.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // Add oxygen symbol
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.font = `${Math.round(bubble.radius * 0.8)}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("O₂", bubble.x, bubble.y);
                }
            }
        }
    }
    
    // Draw special oxygen bonus (hello.png)
    const drawOxygenBonus = () => {
        if (!game || !ctx) return;
        
        for (const bonus of game.oxygenBonus) {
            // Save the context for rotation and transparency
            ctx.save();
            
            // Set the global alpha for fading effect
            ctx.globalAlpha = bonus.alpha;
            
            // Translate to center for rotation
            ctx.translate(bonus.x + bonus.width/2, bonus.y + bonus.height/2);
            ctx.rotate(bonus.angle);
            
            // Move back to top-left for drawing
            ctx.translate(-bonus.width/2, -bonus.height/2);
            
            // Draw the special bonus using the hello image
            drawGameImage(
                ctx,
                images.hello,
                0,
                0,
                bonus.width,
                bonus.height,
                "#ffff88" // Yellowish fallback color
            );
            
            // Add glowing effect for the bonus
            if (bonus.fullyVisible) {
                const glowTime = performance.now() * 0.001;
                const glowIntensity = 0.3 + 0.2 * Math.sin(glowTime * 3);
                
                ctx.globalAlpha = glowIntensity * bonus.alpha;
                ctx.shadowColor = "#ffff00";
                ctx.shadowBlur = 15;
                
                // Draw glow effect
                drawGameImage(
                    ctx,
                    images.hello,
                    -5,
                    -5,
                    bonus.width + 10,
                    bonus.height + 10,
                    "#ffff00"
                );
                
                // Reset shadow
                ctx.shadowBlur = 0;
            }
            
            // Restore the context
            ctx.restore();
        }
    }

    const drawHarpoons = () => {
        if (!game || !ctx) return;
      
        for (const harpoon of game.harpoons) {
            ctx.save();
            
            // Move to harpoon position and rotate based on angle
            ctx.translate(harpoon.x, harpoon.y);
            ctx.rotate(harpoon.angle);
            
            // Draw the harpoon shaft
            ctx.fillStyle = "#888888";
            ctx.fillRect(0, -harpoon.width/2, harpoon.length, harpoon.width);
            
            // Draw the harpoon tip
            ctx.fillStyle = "#aaaaaa";
            ctx.beginPath();
            ctx.moveTo(harpoon.length, -harpoon.width);
            ctx.lineTo(harpoon.length + 7, 0);
            ctx.lineTo(harpoon.length, harpoon.width);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }

    const drawDiver = () => {
        if (!game || !ctx) return;
      
        // Draw shield if active
        if (game.diver.isShieldActive) {
            ctx.save();
            const shieldOpacity = 0.3 + 0.2 * Math.sin(performance.now() * 0.01);
            ctx.fillStyle = `rgba(30, 144, 255, ${shieldOpacity})`;
            ctx.beginPath();
            ctx.arc(
                game.diver.x + game.diver.width/2, 
                game.diver.y + game.diver.height/2, 
                game.diver.width * 0.8, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
        
        // Draw the submarine using the loaded image
        const submarineImage = game.diver.facingDirection === 'left' 
            ? images.submarine_left 
            : images.submarine;
        
        drawGameImage(
            ctx,
            submarineImage,
            game.diver.x,
            game.diver.y,
            game.diver.width,
            game.diver.height,
            "#4285f4" // Fallback color
        );
        
        // Draw bubbles (animated) from top of submarine - bubbles grow from small to large as requested
        const time = performance.now() * 0.001;
        for (let i = 0; i < 2; i++) {
            const bubbleOffset = (time * 2 + i) % 3;
            const bubbleSize = 1 + bubbleOffset; // Bubbles grow from 1 to 4 pixels
            
            // Position bubbles on top of submarine (centered on top, not on sides)
            const bubbleX = game.diver.x + game.diver.width/2 + (i-0.5) * 10; 
            const bubbleY = game.diver.y - 5 - bubbleOffset * 2; // Position above submarine
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const drawParticles = () => {
        if (!game || !ctx) return;
      
        for (const particle of game.particles) {
            // Calculate opacity based on remaining lifespan
            const opacity = particle.lifespan / particle.initialLifespan;
            
            // Extract color components from the original color
            let r = 255, g = 255, b = 255;
            
            if (particle.color.startsWith("#")) {
                // Handle hex colors
                const hex = particle.color.substring(1);
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else if (particle.color.startsWith("rgb")) {
                // Handle rgb/rgba colors
                const rgbMatch = particle.color.match(/\d+/g);
                if (rgbMatch && rgbMatch.length >= 3) {
                    r = parseInt(rgbMatch[0]);
                    g = parseInt(rgbMatch[1]);
                    b = parseInt(rgbMatch[2]);
                }
            }
            
            // Set the fill style with calculated opacity
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            
            // Draw the particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const drawUI = () => {
        if (!game || !ctx) return;
      
        // Draw the oxygen bar
        const oxygenPercentage = game.oxygen / MAX_OXYGEN;
        
        // Put oxygen bar in top-left, with more space between elements
        // Bar background 
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(10, 40, 150, 15); // Moved down to avoid overlap
        
        // Oxygen level
        let oxygenColor;
        if (oxygenPercentage > 0.6) {
            oxygenColor = "#00ff00"; // Green when high
        } else if (oxygenPercentage > 0.3) {
            oxygenColor = "#ffff00"; // Yellow when medium
        } else {
            // Red and pulsing when low
            const pulseAmount = Math.sin(performance.now() * 0.01) * 0.5 + 0.5;
            oxygenColor = `rgba(255, ${Math.floor(pulseAmount * 100)}, 0, 1)`;
        }
        
        ctx.fillStyle = oxygenColor;
        ctx.fillRect(10, 40, 150 * oxygenPercentage, 15);
        
        // Draw border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 40, 150, 15);
        
        // Text labels with Ubuntu Mono font
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px 'Ubuntu Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText("OXYGEN", 15, 35); // Adjusted Y position to appear above the bar
        
        // Draw player lives - moved lower
        ctx.fillStyle = "#ff3377"; // Pink heart color
        ctx.textAlign = "left";
        
        // Draw "LIVES: " text - position moved down
        ctx.fillText("LIVES:", 15, 80);
        
        // Draw heart icons for each life - position moved down
        const heartSize = 12;
        const heartSpacing = 16;
        const heartY = 72; // Moved down
        
        for (let i = 0; i < game.playerLives; i++) {
            const heartX = 60 + (i * heartSpacing);
            // Skip if we have too many lives to display
            if (i > 9) {
                ctx.fillText(`+${game.playerLives - 10}`, heartX, heartY + 8);
                break;
            }
            
            // Draw a heart for each life
            ctx.save();
            ctx.translate(heartX, heartY);
            
            // Draw heart shape
            ctx.beginPath();
            ctx.moveTo(0, heartSize/2);
            
            // Left curve
            ctx.bezierCurveTo(
                -heartSize/2, heartSize/4,
                -heartSize/2, -heartSize/4,
                0, -heartSize/2
            );
            
            // Right curve
            ctx.bezierCurveTo(
                heartSize/2, -heartSize/4,
                heartSize/2, heartSize/4,
                0, heartSize/2
            );
            
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Score - using Ubuntu Mono font
        ctx.font = "16px 'Ubuntu Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`SCORE: ${game.score}`, canvas.width - 10, 20);
        
        // Level - using Ubuntu Mono font
        ctx.fillText(`LEVEL: ${game.level}`, canvas.width - 10, 40);
        
        // Combo - using Ubuntu Mono font
        if (game.diver.comboCounter > 0) {
            ctx.fillStyle = "#ffff00";
            ctx.fillText(`COMBO x${game.diver.comboCounter}`, canvas.width - 10, 60);
        }
        
        // Weapon cooldown indicator - moved to UI corner
        if (!game.diver.canFire) {
            const cooldownPercent = 1 - (game.diver.weaponCooldown / game.diver.weaponCooldownMax);
            const barWidth = 100;
            const barHeight = 8;
            const barX = canvas.width - 110;
            const barY = 75;
            
            // Label
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px 'Ubuntu Mono', monospace";
            ctx.textAlign = "right";
            ctx.fillText("WEAPON:", canvas.width - 10, barY + 5);
            
            // Background bar
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(barX, barY + 10, barWidth, barHeight);
            
            // Cooldown progress bar
            ctx.fillStyle = cooldownPercent > 0.5 ? "#00ff00" : "#ffff00";
            ctx.fillRect(barX, barY + 10, barWidth * cooldownPercent, barHeight);
            
            // Border
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY + 10, barWidth, barHeight);
        }
        
        // Controls reminder removed as requested
    }

    // --- Game Loop ---
    const gameLoop = (timestamp: number) => {
        if (!game) return;
        
        // Calculate time delta
        const deltaTime = timestamp - game.lastUpdateTime;
        game.lastUpdateTime = timestamp;
        
        // Skip frame if delta is too large (tab was inactive)
        if (deltaTime > 100) {
            game.animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Only update if game is active
        if (game.gameStarted && !game.gameOver) {
            // Update game state
            updateDiver(deltaTime);
            updateWeaponSystem(deltaTime);
            updateTreasures(deltaTime);
            updateHearts(deltaTime);  // Update hearts (new)
            // updateRescueDivers removed
            updateEnemies(deltaTime);
            updateCrabs(deltaTime);  // Update crab movement
            updateOxygenBubbles(deltaTime);
            updateOxygenBonus(deltaTime); // Update special oxygen bonus items
            updateParticles(deltaTime);
            updateLevel();
        }
        
        // Render game
        render();
        
        // Loop
        game.animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Game End ---
    const endGame = () => {
        if (!game) return;
        game.gameOver = true;
        setFinalScore(game.score);
        setUiGameState("over");
    }

    // --- Input Handling ---
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!game) return;
        
        // Start game on any key if on start screen
        if (!game.gameStarted && !game.gameOver && e.key !== 'F5') {
            init();
            return;
        }
        
        // Update key state
        if (e.key in game.keys) {
            game.keys[e.key] = true;
        } else if (e.key === " ") {
            game.keys.Space = true;
        }
        
        // Prevent default behavior for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
        if (!game) return;
        
        // Update key state
        if (e.key in game.keys) {
            game.keys[e.key] = false;
        } else if (e.key === " ") {
            game.keys.Space = false;
        }
    }

    // --- Event Listeners ---
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- Clean up ---
    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        
        if (game && game.animationFrameId) {
            cancelAnimationFrame(game.animationFrameId)
        }
    }
  }, [restartTrigger]) // Re-run effect only when restart trigger changes

  return (
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
        width={1408} 
        height={768}
        style={{ 
          border: "2px solid #00a8ff",
          backgroundColor: "#000030",
          maxWidth: "100%",
          boxShadow: "0 0 20px rgba(0, 168, 255, 0.5)"
        }}
      />
      
      {uiGameState === "start" && (
        <div className="game-overlay">
          <div className="logo-container">
            {images.game_logo ? (
              <img 
                src={images.game_logo.src} 
                alt="SEAQUEST" 
                className="game-logo" 
                style={{ maxWidth: '300px', marginBottom: '20px' }}
              />
            ) : (
              <h2 className="game-title">SEAQUEST</h2>
            )}
          </div>
          <p>Navigate underwater and collect treasures!</p>
          <p>Watch your oxygen level and avoid dangerous sea creatures.</p>
          <p>Sharks will sometimes drop hearts when destroyed - collect them for extra lives!</p>
          <p><strong>Controls:</strong> Arrow Keys to move, Space to fire harpoon</p>
          <button onClick={() => setUiGameState("playing")}>START GAME</button>
        </div>
      )}
      
      {uiGameState === "over" && (
        <div className="game-overlay">
          <div className="logo-container">
            {images.game_logo ? (
              <img 
                src={images.game_logo.src} 
                alt="SEAQUEST" 
                className="game-logo" 
                style={{ maxWidth: '200px', marginBottom: '10px' }}
              />
            ) : (
              <h2>GAME OVER</h2>
            )}
          </div>
          <h2>GAME OVER</h2>
          <p className="score-display">Your Score: {finalScore}</p>
          <button onClick={handleRestart}>PLAY AGAIN</button>
        </div>
      )}
      
      {/* Controls UI removed as requested */}
    </div>
  )
}

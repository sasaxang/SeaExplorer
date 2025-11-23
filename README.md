# 🌊 SeaExplorer - Underwater Adventure Game

A modern, browser-based implementation of the classic Seaquest game built with Next.js, React, and TypeScript. Navigate the deep ocean, battle sea creatures, collect treasures, and manage your oxygen supply in this thrilling underwater adventure!

![SeaExplorer Game](public/images/png/ui/game_logo.png)

## 🎮 Game Overview

Control a submarine through dangerous underwater depths, where you must:
- **Survive** against hostile sea creatures
- **Collect** valuable treasures and power-ups
- **Manage** your oxygen supply (depletes faster at greater depths)
- **Battle** fish, sharks, and crabs with your harpoon
- **Score** big with combo multipliers

## ✨ Features

### Core Gameplay
- **Depth-based Oxygen System**: Oxygen depletes faster the deeper you go
- **Dynamic Enemy AI**: Sharks become more aggressive as levels progress
- **Combo Scoring System**: Chain treasure collection and enemy defeats for higher scores
- **Lives System**: Collect hearts to gain extra lives (max 10)
- **Progressive Difficulty**: Game gets harder with each level

### 📱 Mobile Support
- **Dynamic Joystick**: Touch anywhere on the left side to spawn a floating joystick for smooth analog control.
- **Touch Controls**: Optimized fire button and responsive UI.
- **Responsive Design**: Automatically adjusts to landscape orientation on mobile devices.

### 🎬 Visuals
- **Video Background**: Immersive underwater video background on the start screen.
- **Particle Effects**: For explosions and impacts.
- **Smooth Animations**: Directional sprites and fluid movement.

### Enemy Types
- **Fish** (Small): 1 hit to defeat
- **Fish** (Large): 2 hits to defeat  
- **Sharks**: 3 hits to defeat, drop treasures and hearts
- **Crabs**: Move along ocean floor, collect dropped items

### Collectibles
- **💎 Treasures**: Points increase with combo multiplier
- **❤️ Hearts**: Extra lives for your submarine
- **💨 Oxygen Bubbles**: Small oxygen refills
- **⭐ Oxygen Bonus**: Large oxygen boost (150 units)

### Audio & Visuals
- Immersive background music
- Sound effects for shooting, explosions, warnings, and collections
- Particle effects for explosions and impacts
- Smooth animations and directional sprites

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sasaxang/SeaExplorer.git
cd SeaExplorer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

### Build for Production (Firebase Hosting)

This project is configured for static export to Firebase Hosting.

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
npx firebase-tools deploy
```

## 🎯 How to Play

### Controls

#### Desktop (Keyboard)
- **Arrow Keys**: Move submarine (Up/Down/Left/Right)
- **Spacebar**: Fire harpoon
- **Enter**: Start game / Restart after game over

#### Mobile (Touch)
- **Left Screen**: Touch and drag to use the **Dynamic Joystick** for movement.
- **Right Screen**: Tap the **Fire Button** to shoot harpoons.

### Objective
1. Navigate through the ocean avoiding or defeating enemies
2. Collect treasures to increase your score
3. Manage oxygen levels by collecting bubbles and oxygen bonuses
4. Collect hearts from defeated sharks to gain extra lives
5. Survive as long as possible and achieve the highest score!

### Tips
- Stay in shallow water to conserve oxygen
- Sharks drop valuable treasures and hearts when defeated
- Build combos by quickly collecting multiple treasures
- Watch for the special oxygen bonus that rises from the ocean floor
- Crabs will steal treasures that fall to the ocean floor!

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Language**: TypeScript
- **Audio**: Howler.js
- **Styling**: CSS (with Next.js App Router)
- **Image Processing**: Sharp (for optimization)
- **Hosting**: Firebase Hosting

## 📁 Project Structure

```
SeaExplorer/
├── app/                        # Next.js app router
│   ├── page.tsx               # Main game page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── SeaquestGame.tsx       # Main game component and logic
│   ├── TouchControls.tsx      # Mobile touch controls container
│   ├── DynamicJoystick.tsx    # Analog joystick component
│   └── GameImageLoader.tsx    # Image asset loader hook
├── public/
│   ├── images/                # Game sprites
│   │   └── png/               # Game sprites
│   │       ├── enemies/       # Enemy sprites
│   │       ├── items/         # Collectible sprites
│   │       ├── player/        # Submarine sprites
│   │       └── ui/            # UI assets
│   ├── sounds/                # Sound effects
│   └── start_video.mp4        # Background video
├── utils/
│   ├── sounds.ts              # Sound management
│   └── sound-generator.js     # Sound utilities
├── package.json
├── tsconfig.json
├── next.config.js
└── firebase.json              # Firebase hosting config
```

## 🎨 Game Mechanics

### Oxygen System
- Maximum oxygen: 300 units
- Depletion rate increases with depth (1x at surface, 2x at bottom)
- Warning sounds play when oxygen drops below 20%
- Oxygen bubbles restore small amounts
- Special oxygen bonuses restore 150 units

### Combat System
- Fire harpoons with spacebar
- Different enemies have different health:
  - Small fish: 1 hit
  - Large fish: 2 hits
  - Sharks: 3 hits
- Combo timer: 3 seconds to maintain combo chain
- Score multiplier based on combo counter

### Lives System
- Maximum lives: 10
- Collect hearts from defeated sharks
- Lose oxygen when hit by enemies (30 units)
- Game over when oxygen reaches 0

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📝 License

This project is licensed under the ISC License.

## 🎮 Credits

Inspired by the classic Atari 2600 game "Seaquest" by Activision.

Built with ❤️ using modern web technologies.

---

**Enjoy your underwater adventure! 🐠🦈💎**

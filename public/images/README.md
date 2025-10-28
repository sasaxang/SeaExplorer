# Seaquest Game Images

This directory contains all the image assets used in the Seaquest game in both SVG and PNG formats.

## Directory Structure

### SVG Images (vector)
```
public/images/
  ├── player/
  │   ├── submarine.svg       - Player submarine facing right
  │   └── submarine_left.svg  - Player submarine facing left
  │
  ├── enemies/
  │   ├── fish.svg            - Standard fish enemy facing right
  │   ├── fish_left.svg       - Standard fish enemy facing left
  │   ├── shark.svg           - Shark enemy facing right
  │   └── shark_left.svg      - Shark enemy facing left
  │
  ├── items/
  │   ├── heart.svg           - Collectible heart (adds life)
  │   ├── treasure.svg        - Treasure diamond (points)
  │   ├── oxygen_bubble.svg   - Oxygen bubble (refills oxygen)
  │   └── diver.svg           - Rescuable diver
  │
  └── ui/
      ├── game_logo.svg       - Seaquest logo for title screen
      └── background.svg      - Game background
```

### PNG Images (raster)
```
public/images/png/
  ├── player/
  │   ├── submarine.png       - Player submarine facing right
  │   └── submarine_left.png  - Player submarine facing left
  │
  ├── enemies/
  │   ├── fish.png            - Standard fish enemy facing right
  │   ├── fish_left.png       - Standard fish enemy facing left
  │   ├── shark.png           - Shark enemy facing right
  │   └── shark_left.png      - Shark enemy facing left
  │
  ├── items/
  │   ├── heart.png           - Collectible heart (adds life)
  │   ├── treasure.png        - Treasure diamond (points)
  │   ├── oxygen_bubble.png   - Oxygen bubble (refills oxygen)
  │   └── diver.png           - Rescuable diver
  │
  └── ui/
      ├── game_logo.png       - Seaquest logo for title screen
      └── background.png      - Game background
```

## Using Images in the Game

Images are loaded using the `useGameImages` hook from `components/GameImageLoader.tsx`. See `components/ImageIntegrationExample.tsx` for a usage example.

### Basic Usage

```jsx
import { useGameImages, drawGameImage } from '@/components/GameImageLoader';

export default function YourGameComponent() {
  // Get the loaded images - specify format ('svg' or 'png')
  const { images, loadingComplete } = useGameImages('svg'); // Default is 'svg'
  
  // Draw a game object with the appropriate image
  function drawSubmarine(ctx, x, y, width, height, facingLeft) {
    const image = facingLeft ? images.submarine_left : images.submarine;
    drawGameImage(ctx, image, x, y, width, height, '#4285f4'); // Last param is fallback color
  }
  
  // ...rest of your game logic
}
```

## Adding New Images

1. Create your SVG or PNG file and place it in the appropriate subdirectory
2. Update the image list in `useGameImages()` hook in `GameImageLoader.tsx`
3. If you add an SVG file, you can convert it to PNG using the provided conversion script:
   ```
   node convert-svg-to-png.js
   ```
4. Access the image via the `images` object returned from `useGameImages()`

## Which Format to Use?

### SVG Advantages
- Vector-based (scales perfectly at any size)
- Smaller file size for simple shapes
- Can be modified via code (colors, etc.)
- Good for simple, cartoon-style graphics

### PNG Advantages
- Better for complex, detailed images
- More consistent cross-browser rendering
- Better performance for many detailed sprites
- Required for pixel art or photo-realistic graphics

## Image Fallbacks

The `drawGameImage` helper function will draw a colored rectangle as a fallback if an image isn't loaded yet. This ensures your game can still run while images are loading.

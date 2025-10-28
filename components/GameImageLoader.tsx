"use client"

import { useEffect, useRef, useState } from 'react';

// Define types for image assets
export interface GameImages {
  // Player images
  submarine?: HTMLImageElement;
  submarine_left?: HTMLImageElement;
  
  // Enemy images
  fish?: HTMLImageElement;
  fish_left?: HTMLImageElement;
  shark?: HTMLImageElement;
  shark_left?: HTMLImageElement;
  crab?: HTMLImageElement;
  
  // Item images
  heart?: HTMLImageElement;
  treasure?: HTMLImageElement;
  oxygen_bubble?: HTMLImageElement;
  oxygen_generator?: HTMLImageElement;
  diver?: HTMLImageElement;
  hello?: HTMLImageElement;
  
  // UI images
  game_logo?: HTMLImageElement;
  background?: HTMLImageElement;
  
  // Any other images you want to add
  [key: string]: HTMLImageElement | undefined;
}

/**
 * Type for image format options
 */
export type ImageFormat = 'svg' | 'png';

/**
 * Custom hook to load and manage game images
 * @param format The image format to use ('svg' or 'png')
 */
export function useGameImages(format: ImageFormat = 'svg'): {
  images: GameImages;
  loadingComplete: boolean;
  loadingProgress: number;
} {
  const imagesRef = useRef<GameImages>({});
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    // Base paths for different image formats
    const getPath = (category: string, name: string) => {
      return format === 'png' 
        ? `/images/png/${category}/${name}.png` 
        : `/images/${category}/${name}.svg`;
    };

    // List of all image paths to load
    const imagesToLoad = [
      // Player
      { key: 'submarine', path: getPath('player', 'submarine') },
      { key: 'submarine_left', path: getPath('player', 'submarine_left') },
      
      // Enemies
      { key: 'fish', path: getPath('enemies', 'fish') },
      { key: 'fish_left', path: getPath('enemies', 'fish_left') },
      { key: 'shark', path: getPath('enemies', 'shark') },
      { key: 'shark_left', path: getPath('enemies', 'shark_left') },
      { key: 'crab', path: getPath('enemies', 'crab') },
      
      // Items
      { key: 'heart', path: getPath('items', 'heart') },
      { key: 'treasure', path: getPath('items', 'treasure') },
      { key: 'oxygen_bubble', path: getPath('items', 'oxygen_bubble') },
      { key: 'oxygen_generator', path: getPath('items', 'oxygen_generator') },
      { key: 'diver', path: getPath('items', 'diver') },
      { key: 'hello', path: getPath('items', 'hello') },
      
      // UI
      { key: 'game_logo', path: getPath('ui', 'game_logo') },
      { key: 'background', path: '/images/background.jpg' },
    ];
    
    console.log(`Loading images in ${format} format...`);
    
    let loadedCount = 0;
    const totalCount = imagesToLoad.length;
    
    // For each image in our list
    imagesToLoad.forEach(({ key, path }) => {
      // Create a new image element
      const img = new Image();
      
      // When the image loads successfully
      img.onload = () => {
        console.log(`Successfully loaded image: ${key} (${path})`);
        loadedCount++;
        setLoadingProgress(Math.floor((loadedCount / totalCount) * 100));
        
        // If all images are loaded, mark loading as complete
        if (loadedCount === totalCount) {
          setLoadingComplete(true);
        }
      };
      
      // Handle errors
      img.onerror = () => {
        console.warn(`Failed to load image: ${key} (${path})`);
        
        // Create a fallback colored rectangle instead of the broken image
        const fallbackImg = new Image();
        fallbackImg.width = 50;
        fallbackImg.height = 50;
        imagesRef.current[key] = fallbackImg;
        
        loadedCount++;
        setLoadingProgress(Math.floor((loadedCount / totalCount) * 100));
        
        // Continue even if some images fail to load
        if (loadedCount === totalCount) {
          setLoadingComplete(true);
        }
      };
      
      // Add image to our reference object before setting src to track it
      imagesRef.current[key] = img;
      
      // Set the source to start loading
      img.src = path;
      console.log(`Started loading image: ${key} (${path})`);
    });
    
    // Cleanup function
    return () => {
      // Clear references to images
      imagesRef.current = {};
    };
  }, [format]);
  
  return {
    images: imagesRef.current,
    loadingComplete,
    loadingProgress
  };
}

/**
 * Helper function to draw an image with a fallback
 */
export function drawGameImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  fallbackColor: string = '#ffffff'
) {
  if (image && image.complete && image.naturalWidth > 0) {
    // Draw the image if it's loaded and not broken
    try {
      ctx.drawImage(image, x, y, width, height);
    } catch (error) {
      console.warn("Failed to draw image:", error);
      // Use fallback if drawing fails
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(x, y, width, height);
    }
  } else {
    // Draw a fallback rectangle if the image isn't loaded or is broken
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, width, height);
  }
}
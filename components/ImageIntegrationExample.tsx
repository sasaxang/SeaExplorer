"use client"

import { useEffect, useRef, useState } from 'react';
import { useGameImages, drawGameImage, ImageFormat } from './GameImageLoader';

// Example of how to integrate images into your Seaquest game
export default function ImageIntegrationExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageFormat, setImageFormat] = useState<ImageFormat>('svg');
  
  // Get images using our custom hook with format preference
  const { images, loadingComplete, loadingProgress } = useGameImages(imageFormat);
  
  // Draw game with images
  useEffect(() => {
    if (!loadingComplete || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#000030';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw submarine at center-right
    drawGameImage(
      ctx,
      images.submarine,
      canvas.width / 2 + 100,
      canvas.height / 2 - 20,
      100,
      40,
      '#4285f4'
    );
    
    // Draw submarine at center-left (flipped version)
    drawGameImage(
      ctx,
      images.submarine_left,
      canvas.width / 2 - 200,
      canvas.height / 2 - 20,
      100,
      40,
      '#4285f4'
    );
    
    // Draw shark
    drawGameImage(
      ctx,
      images.shark,
      canvas.width / 2 + 50,
      canvas.height / 2 + 100,
      80, 
      40,
      '#777777'
    );
    
    // Draw shark (flipped)
    drawGameImage(
      ctx,
      images.shark_left,
      canvas.width / 2 - 150,
      canvas.height / 2 + 100,
      80, 
      40,
      '#777777'
    );
    
    // Draw fish
    drawGameImage(
      ctx,
      images.fish,
      canvas.width / 2 + 50,
      canvas.height / 2 + 170,
      60, 
      30,
      '#ff9900'
    );
    
    // Draw fish (flipped)
    drawGameImage(
      ctx,
      images.fish_left,
      canvas.width / 2 - 150,
      canvas.height / 2 + 170,
      60, 
      30,
      '#ff9900'
    );
    
    // Draw heart and treasure
    drawGameImage(
      ctx,
      images.heart,
      canvas.width / 2 - 60,
      canvas.height / 2 - 100,
      30,
      30,
      '#ff5a5a'
    );
    
    drawGameImage(
      ctx,
      images.treasure,
      canvas.width / 2 + 30,
      canvas.height / 2 - 100,
      30,
      30,
      '#39c4ff'
    );
    
    // Draw diver
    drawGameImage(
      ctx,
      images.diver,
      canvas.width / 2 - 15,
      canvas.height / 2 + 50,
      30,
      40,
      '#e0e0e0'
    );
    
    // Draw oxygen bubble
    drawGameImage(
      ctx,
      images.oxygen_bubble,
      canvas.width / 2 - 15,
      canvas.height / 2 - 50,
      30,
      30,
      '#80d4ff'
    );
    
    // Add title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Game Images - ${imageFormat.toUpperCase()} Format`, 20, 40);
    
    // Add instructions
    ctx.font = '16px Arial';
    ctx.fillText('Click the button below to switch between SVG and PNG formats', 20, 70);
    
  }, [loadingComplete, images, imageFormat]);
  
  // Toggle between SVG and PNG formats
  const toggleFormat = () => {
    setImageFormat(prev => prev === 'svg' ? 'png' : 'svg');
  };
  
  return (
    <div className="image-example">
      {!loadingComplete && (
        <div className="loading">
          <p>Loading images: {loadingProgress}%</p>
        </div>
      )}
      
      <div className="format-toggle">
        <button 
          onClick={toggleFormat}
          className="format-button"
        >
          {`Current: ${imageFormat.toUpperCase()} - Switch to ${imageFormat === 'svg' ? 'PNG' : 'SVG'}`}
        </button>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={800}
        height={600}
        style={{ 
          border: "2px solid #00a8ff",
          backgroundColor: "#000030",
          maxWidth: "100%",
        }}
      />
      
      <div className="instructions">
        <h3>Using Images in Your Game</h3>
        <p>Images are now available in both SVG and PNG formats:</p>
        <pre>
          {`
public/images/
  ├── player/
  │   ├── submarine.svg
  │   └── submarine_left.svg
  │
  ├── enemies/
  │   ├── fish.svg
  │   ├── fish_left.svg
  │   ├── shark.svg
  │   └── shark_left.svg
  │
  ├── items/
  │   ├── heart.svg
  │   ├── treasure.svg
  │   ├── oxygen_bubble.svg
  │   └── diver.svg
  │
  └── ui/
      ├── game_logo.svg
      └── background.svg

public/images/png/
  ├── player/
  │   ├── submarine.png
  │   └── submarine_left.png
  │
  └── ... (same structure as SVG)
          `}
        </pre>
        <p>How to use in your game:</p>
        <ol>
          <li>Import the useGameImages hook: <code>{`import { useGameImages, drawGameImage } from './GameImageLoader';`}</code></li>
          <li>Use the hook with your preferred format: <code>{`const { images, loadingComplete } = useGameImages('svg'); // or 'png'`}</code></li>
          <li>Draw images with the helper function: <code>{`drawGameImage(ctx, images.submarine, x, y, width, height);`}</code></li>
        </ol>
      </div>
    </div>
  );
}
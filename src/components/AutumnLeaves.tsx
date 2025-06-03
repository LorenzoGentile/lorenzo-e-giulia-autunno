
import React, { useEffect, useState } from 'react';

type Leaf = {
  id: number;
  left: number;
  animationDuration: number;
  type: number;
  size: number;
  opacity: number;
  delay: number;
  rotation: number;
};

const AutumnLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  
  useEffect(() => {
    // Generate random leaves
    const generateLeaves = () => {
      const newLeaves: Leaf[] = [];
      const leafCount = Math.max(8, Math.floor(window.innerWidth / 150));
      
      for (let i = 0; i < leafCount; i++) {
        newLeaves.push({
          id: i,
          left: Math.random() * 100, // Random position (0% to 100%)
          animationDuration: 8 + Math.random() * 10, // Random duration (8s to 18s)
          type: Math.floor(Math.random() * 6), // 6 different leaf types
          size: 25 + Math.random() * 20, // Random size (25px to 45px)
          opacity: 0.7 + Math.random() * 0.3, // Random opacity (0.7 to 1)
          delay: Math.random() * 5, // Random delay (0s to 5s)
          rotation: Math.random() * 360, // Random initial rotation
        });
      }
      
      setLeaves(newLeaves);
    };
    
    generateLeaves();
    
    const handleResize = () => {
      generateLeaves();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const leafImages = [
    'public/lovable-uploads/e485de2c-6d7c-4126-b617-48d072711730.png', // The full leaf image
  ];

  // Define the positions for cropping different leaves from the sprite
  // Each value is [x, y, width, height] representing the position in the image
  const leafPositions = [
    [0, 0, 80, 80],     // Top-left maple leaf (orange)
    [80, 0, 80, 80],    // Top yellow leaf 
    [160, 0, 80, 80],   // Top orange maple leaf
    [240, 0, 80, 80],   // Top orange pointed leaf
    [320, 0, 80, 80],   // Top bright yellow leaf
    [400, 0, 80, 80],   // Top right maple leaf
  ];

  return (
    <>
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="autumn-leaf"
          style={{
            left: `${leaf.left}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            animation: `fall ${leaf.animationDuration}s linear infinite`,
            animationDelay: `${leaf.delay}s`,
            opacity: leaf.opacity,
            transform: `rotate(${leaf.rotation}deg)`,
          }}
        >
          <div
            className="sway"
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${leafImages[0]})`,
              backgroundSize: '600px 240px',
              backgroundPosition: `-${leafPositions[leaf.type][0]}px -${leafPositions[leaf.type][1]}px`,
              backgroundRepeat: 'no-repeat',
              transformOrigin: 'center',
            }}
          />
        </div>
      ))}
    </>
  );
};

export default AutumnLeaves;

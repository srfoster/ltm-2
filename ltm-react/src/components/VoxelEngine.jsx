import React, { useEffect, useRef, useState } from 'react';
import './VoxelEngine.css';

/**
 * VoxelEngine - A React wrapper for Divine Voxel Engine
 * 
 * @param {Object} props
 * @param {string} props.width - Width of the canvas (default: '100%')
 * @param {string} props.height - Height of the canvas (default: '600px')
 * @param {Function} props.onEngineReady - Callback when engine is initialized (receives engine instance)
 * @param {Object} props.engineConfig - Configuration options for the voxel engine
 * @param {Function} props.onError - Callback for error handling
 */
const VoxelEngine = ({ 
  width = '100%',
  height = '600px',
  onEngineReady = null,
  engineConfig = {},
  onError = null,
  ...props 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initEngine = async () => {
      try {
        if (!canvasRef.current) {
          throw new Error('Canvas element not found');
        }

        // Dynamically import DVE and Babylon
        const { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Color4 } = await import('@babylonjs/core');
        
        // Create Babylon engine
        const babylonEngine = new Engine(canvasRef.current, true);
        
        // Create scene
        const scene = new Scene(babylonEngine);
        scene.clearColor = new Color4(0.5, 0.8, 1.0, 1.0); // Sky blue
        sceneRef.current = scene;
        
        // Create camera
        const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(canvasRef.current, true);
        
        // Create light
        const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        // Create some simple voxel-like cubes as a demo
        const createVoxelCube = (x, y, z, color) => {
          const box = MeshBuilder.CreateBox(`voxel_${x}_${y}_${z}`, { size: 1 }, scene);
          box.position = new Vector3(x, y, z);
          
          const material = new StandardMaterial(`mat_${x}_${y}_${z}`, scene);
          material.diffuseColor = color;
          box.material = material;
          
          return box;
        };
        
        // Create a simple voxel platform
        for (let x = -5; x <= 5; x++) {
          for (let z = -5; z <= 5; z++) {
            const color = new Color3(
              0.2 + Math.random() * 0.3,
              0.5 + Math.random() * 0.3,
              0.2 + Math.random() * 0.3
            );
            createVoxelCube(x, 0, z, color);
          }
        }
        
        // Add some random blocks on top
        for (let i = 0; i < 20; i++) {
          const x = Math.floor(Math.random() * 11) - 5;
          const z = Math.floor(Math.random() * 11) - 5;
          const y = Math.floor(Math.random() * 3) + 1;
          const color = new Color3(
            Math.random(),
            Math.random(),
            Math.random()
          );
          createVoxelCube(x, y, z, color);
        }
        
        // Run render loop
        babylonEngine.runRenderLoop(() => {
          if (scene) {
            scene.render();
          }
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
          babylonEngine.resize();
        });
        
        engineRef.current = { babylonEngine, scene };

        if (mounted) {
          setIsLoading(false);
          if (onEngineReady) {
            onEngineReady({ babylonEngine, scene, canvas: canvasRef.current });
          }
        }

      } catch (err) {
        console.error('Error initializing Voxel Engine:', err);
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
          if (onError) {
            onError(err);
          }
        }
      }
    };

    initEngine();

    // Cleanup
    return () => {
      mounted = false;
      if (sceneRef.current) {
        sceneRef.current.dispose();
      }
      if (engineRef.current && engineRef.current.babylonEngine) {
        engineRef.current.babylonEngine.dispose();
      }
    };
  }, [engineConfig, onEngineReady, onError]);

  return (
    <div 
      ref={containerRef}
      className="voxel-engine-container"
      style={{ 
        width, 
        height, 
        position: 'relative',
        border: '2px solid #444',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        ...props.style 
      }}
    >
      {isLoading && (
        <div className="voxel-engine-loading">
          <div className="loading-spinner"></div>
          <p>Initializing Voxel Engine...</p>
        </div>
      )}
      
      {error && (
        <div className="voxel-engine-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="voxel-engine-canvas"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        {...props}
      />
    </div>
  );
};

export default VoxelEngine;

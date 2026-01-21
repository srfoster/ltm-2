import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import './VoxelEngine.css';

/**
 * VoxelEngine - A React wrapper for Divine Voxel Engine
 * 
 * @param {Object} props
 * @param {string} props.width - Width of the canvas (default: '100%')
 * @param {string} props.height - Height of the canvas (default: '600px')
 * @param {Object} props.worldConfig - Configuration for the initial voxel world
 * @param {Array} props.worldConfig.voxels - Array of voxel definitions: [{ x, y, z, color: [r, g, b] }]
 * @param {Object} props.worldConfig.camera - Camera configuration: { position: [x, y, z], target: [x, y, z] }
 * @param {Object} props.worldConfig.sky - Sky color: { r, g, b, a }
 * @param {number} props.worldConfig.maxHeight - Maximum build height (default: 10)
 * @param {Function} props.onEngineReady - Callback when engine is initialized (receives engine instance)
 * @param {Object} props.engineConfig - Configuration options for the voxel engine
 * @param {Function} props.onError - Callback for error handling
 * @param {Function} props.onVoxelChange - Callback when voxels are added/removed: ({ action, x, y, z, voxels })
 * @param {React.Ref} ref - Ref to access engine methods (addVoxel, removeVoxel, getVoxels)
 */
const VoxelEngine = forwardRef(({ 
  width = '100%',
  height = '600px',
  worldConfig = null,
  onEngineReady = null,
  engineConfig = {},
  onError = null,
  onVoxelChange = null,
  ...props 
}, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const voxelMethodsRef = useRef(null);

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
        
        // Set sky color from config or default
        const skyColor = worldConfig?.sky || { r: 0.5, g: 0.8, b: 1.0, a: 1.0 };
        scene.clearColor = new Color4(skyColor.r, skyColor.g, skyColor.b, skyColor.a);
        sceneRef.current = scene;
        
        // Create camera with config or defaults
        const cameraPos = worldConfig?.camera?.position || [0, 5, -10];
        const cameraTarget = worldConfig?.camera?.target || [0, 0, 0];
        const camera = new FreeCamera('camera1', new Vector3(cameraPos[0], cameraPos[1], cameraPos[2]), scene);
        camera.setTarget(new Vector3(cameraTarget[0], cameraTarget[1], cameraTarget[2]));
        camera.attachControl(canvasRef.current, true);
        
        // Create light
        const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        // Store Color3 class for later use
        scene.metadata = { Color3 };
        
        // Track voxels in the world
        const voxelMap = new Map();
        
        // Create some simple voxel-like cubes as a demo
        const createVoxelCube = (x, y, z, color) => {
          const key = `${x},${y},${z}`;
          
          // Don't create if already exists
          if (voxelMap.has(key)) {
            return voxelMap.get(key);
          }
          
          const box = MeshBuilder.CreateBox(key, { size: 1 }, scene);
          box.position = new Vector3(x, y, z);
          
          const material = new StandardMaterial(`mat_${key}`, scene);
          material.diffuseColor = color;
          box.material = material;
          
          voxelMap.set(key, box);
          return box;
        };
        
        // Remove a voxel
        const removeVoxelCube = (x, y, z) => {
          const key = `${x},${y},${z}`;
          const voxel = voxelMap.get(key);
          if (voxel) {
            voxel.dispose();
            voxelMap.delete(key);
            
            // Notify parent of change
            if (onVoxelChange) {
              onVoxelChange({
                action: 'remove',
                x, y, z,
                voxels: Array.from(voxelMap.keys()).map(key => {
                  const [x, y, z] = key.split(',').map(Number);
                  return { x, y, z };
                })
              });
            }
          }
        };
        
        // Get all voxels as array
        const getAllVoxels = () => {
          return Array.from(voxelMap.keys()).map(key => {
            const [x, y, z] = key.split(',').map(Number);
            const voxel = voxelMap.get(key);
            const color = voxel.material.diffuseColor;
            return { x, y, z, color: [color.r, color.g, color.b] };
          });
        };
        
        // Initialize world from config or use defaults
        if (worldConfig && worldConfig.voxels) {
          // Load voxels from config
          worldConfig.voxels.forEach(voxel => {
            const color = voxel.color 
              ? new Color3(voxel.color[0], voxel.color[1], voxel.color[2])
              : new Color3(Math.random(), Math.random(), Math.random());
            createVoxelCube(voxel.x, voxel.y, voxel.z, color);
          });
        } else {
          // Create default world - a simple platform with random blocks
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
        }
        
        // Add click interaction to add/remove voxels
        scene.onPointerDown = (evt, pickResult) => {
          if (pickResult.hit) {
            const pickedMesh = pickResult.pickedMesh;
            
            // Left click - remove voxel (if not ground level)
            if (evt.button === 0) {
              const pos = pickedMesh.position;
              if (pos.y > 0) {
                removeVoxelCube(pos.x, pos.y, pos.z);
              }
            }
            // Right click - add voxel on top
            else if (evt.button === 2) {
              evt.preventDefault();
              const pos = pickedMesh.position;
              const normal = pickResult.getNormal(true);
              
              // Calculate new position based on face normal
              const newX = Math.round(pos.x + normal.x);
              const newY = Math.round(pos.y + normal.y);
              const newZ = Math.round(pos.z + normal.z);
              
              // Limit height (use config or default)
              const maxHeight = worldConfig?.maxHeight || 10;
              if (newY < maxHeight) {
                const color = new Color3(
                  Math.random(),
                  Math.random(),
                  Math.random()
                );
                createVoxelCube(newX, newY, newZ, color);
                
                // Notify parent of change
                if (onVoxelChange) {
                  onVoxelChange({
                    action: 'add',
                    x: newX,
                    y: newY,
                    z: newZ,
                    color: [color.r, color.g, color.b],
                    voxels: getAllVoxels()
                  });
                }
              }
            }
          }
        };
        
        // Prevent context menu on right click
        canvasRef.current.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
        
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
        
        // Store methods for imperative access
        voxelMethodsRef.current = {
          createVoxelCube,
          removeVoxelCube,
          getAllVoxels
        };
        
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
  }, [engineConfig, onEngineReady, onError, worldConfig, onVoxelChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    addVoxel: (x, y, z, color = null) => {
      if (!voxelMethodsRef.current) return;
      
      const Color3 = sceneRef.current?.metadata?.Color3;
      if (!Color3) {
        console.error('Scene not ready yet');
        return;
      }
      
      const voxelColor = color 
        ? new Color3(color[0], color[1], color[2])
        : new Color3(Math.random(), Math.random(), Math.random());
      
      voxelMethodsRef.current.createVoxelCube(x, y, z, voxelColor);
      
      if (onVoxelChange) {
        onVoxelChange({
          action: 'add',
          x, y, z,
          color: [voxelColor.r, voxelColor.g, voxelColor.b],
          voxels: voxelMethodsRef.current.getAllVoxels()
        });
      }
    },
    
    removeVoxel: (x, y, z) => {
      if (!voxelMethodsRef.current) return;
      voxelMethodsRef.current.removeVoxelCube(x, y, z);
    },
    
    getVoxels: () => {
      if (!voxelMethodsRef.current) return [];
      return voxelMethodsRef.current.getAllVoxels();
    },
    
    getScene: () => sceneRef.current,
    getEngine: () => engineRef.current
  }), [onVoxelChange]);

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
});

VoxelEngine.displayName = 'VoxelEngine';

export default VoxelEngine;

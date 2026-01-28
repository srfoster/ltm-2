import { HelloWorld, JigsawEditor, VoxelEngine } from 'ltm-react'
import { useState, useRef, useCallback } from 'react'
import './App.css'

function App() {
  const [voxelWorld, setVoxelWorld] = useState(null);
  const voxelEngineRef = useRef(null);

  const handleVoxelEngineReady = useCallback((engine) => {
    console.log('Voxel engine ready:', engine);
  }, []);

  const handleVoxelError = useCallback((error) => {
    console.error('Voxel engine error:', error);
  }, []);

  const handleVoxelChange = useCallback((changeData) => {
    console.log('Voxel world changed:', changeData);
    setVoxelWorld(changeData.voxels);
  }, []);

  // Define a custom world configuration
  const worldConfig = {
    voxels: [
      // Create a pyramid structure
      // Base layer (5x5)
      ...Array.from({ length: 5 }, (_, i) => 
        Array.from({ length: 5 }, (_, j) => ({
          x: i - 2, y: 0, z: j - 2,
          color: [0.8, 0.6, 0.2] // Gold color
        }))
      ).flat(),
      // Second layer (3x3)
      ...Array.from({ length: 3 }, (_, i) => 
        Array.from({ length: 3 }, (_, j) => ({
          x: i - 1, y: 1, z: j - 1,
          color: [0.7, 0.5, 0.2]
        }))
      ).flat(),
      // Top layer (1x1)
      { x: 0, y: 2, z: 0, color: [0.9, 0.7, 0.1] },
      
      // Add a few decorative blocks
      { x: 4, y: 0, z: 0, color: [0.2, 0.8, 0.2] },
      { x: -4, y: 0, z: 0, color: [0.2, 0.8, 0.2] },
      { x: 0, y: 0, z: 4, color: [0.2, 0.2, 0.8] },
      { x: 0, y: 0, z: -4, color: [0.2, 0.2, 0.8] },
    ],
    camera: {
      position: [8, 6, -8],
      target: [0, 1, 0]
    },
    sky: {
      r: 0.6, g: 0.9, b: 1.0, a: 1.0
    },
    maxHeight: 15
  };

  // Functions to manipulate the voxel world
  const addRandomVoxel = () => {
    if (!voxelEngineRef.current) return;
    
    const x = Math.floor(Math.random() * 11) - 5;
    const z = Math.floor(Math.random() * 11) - 5;
    const y = Math.floor(Math.random() * 5) + 1;
    const color = [Math.random(), Math.random(), Math.random()];
    
    voxelEngineRef.current.addVoxel(x, y, z, color);
  };

  const addVoxelAtPosition = (x, y, z, color) => {
    if (!voxelEngineRef.current) return;
    voxelEngineRef.current.addVoxel(x, y, z, color);
  };

  const clearTopVoxels = () => {
    if (!voxelEngineRef.current) return;
    const voxels = voxelEngineRef.current.getVoxels();
    
    // Remove all voxels above y=0
    voxels.forEach(voxel => {
      if (voxel.y > 0) {
        voxelEngineRef.current.removeVoxel(voxel.x, voxel.y, voxel.z);
      }
    });
  };

  // Define initial blocks for the JigsawEditor
  const initialBlocks = [
    { 
      id: '1', 
      type: 'add_voxel', 
      x: 50, 
      y: 50, 
      width: 150, 
      height: 60, 
      label: 'Add Voxel',
      color: '#4CAF50'
    },
    { 
      id: '2', 
      type: 'remove_voxel', 
      x: 50, 
      y: 130, 
      width: 150, 
      height: 60, 
      label: 'Remove Voxel',
      color: '#f44336'
    },
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1>LTM React Library Demo</h1>
        <p>This frontend imports components from the ltm-react library</p>
      </header>
      
      <main>
        <div style={{ margin: '40px auto', maxWidth: '1200px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <JigsawEditor 
              width={800}
              height={600}
              blocks={initialBlocks}
              onBlocksChange={(blocks) => console.log('Blocks changed:', blocks)}
              onExecute={(block) => {
                console.log('Execute block:', block);
                if (block.type === 'add_voxel' && voxelEngineRef.current) {
                  voxelEngineRef.current.addVoxel(0, 0, 0, '#4CAF50');
                } else if (block.type === 'remove_voxel' && voxelEngineRef.current) {
                  voxelEngineRef.current.removeVoxel(0, 0, 0);
                }
              }}
            />
            
            <div style={{ 
              border: '2px solid #ddd', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#f5f5f5',
              height: '600px',
              overflow: 'auto'
            }}>
              <h3 style={{ marginTop: 0 }}>Block Palette</h3>
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '14px' }}>
                <strong>Instructions:</strong><br/>
                • Drag blocks to arrange them<br/>
                • Double-click a block to execute it<br/>
                • Use pan and zoom to navigate
              </div>
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '12px' }}>
                <strong>Available Actions:</strong><br/>
                • <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Add Voxel</span> - Places a green voxel at (0,0,0)<br/>
                • <span style={{ color: '#f44336', fontWeight: 'bold' }}>Remove Voxel</span> - Removes voxel at (0,0,0)
              </div>
            </div>
          </div>
        </div>

        <div style={{ margin: '40px auto', maxWidth: '1200px' }}>
          <h2>Divine Voxel Engine</h2>
          <p>3D voxel-based world engine with custom pyramid world configuration</p>
          
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚡ Programmatic Controls:</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={addRandomVoxel}
                style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Add Random Voxel
              </button>
              <button 
                onClick={() => addVoxelAtPosition(6, 1, 0, [1, 0, 0])}
                style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Add Red Voxel at (6,1,0)
              </button>
              <button 
                onClick={() => addVoxelAtPosition(-6, 1, 0, [0, 0, 1])}
                style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Add Blue Voxel at (-6,1,0)
              </button>
              <button 
                onClick={clearTopVoxels}
                style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Clear All Top Voxels
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🎮 Mouse Controls:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li><strong>Left Click</strong> - Remove voxel (except ground level)</li>
              <li><strong>Right Click</strong> - Add voxel on clicked face</li>
              <li><strong>Mouse Drag</strong> - Rotate camera</li>
              <li><strong>WASD / Arrow Keys</strong> - Move camera</li>
            </ul>
          </div>
          
          <VoxelEngine 
            ref={voxelEngineRef}
            width="100%"
            height="600px"
            worldConfig={worldConfig}
            onEngineReady={handleVoxelEngineReady}
            onError={handleVoxelError}
            onVoxelChange={handleVoxelChange}
          />
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Note:</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              To fully use the Voxel Engine, install: <code>npm install @divinevoxel/vlox @divinevoxel/vlox-babylon babylonjs</code>
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
              See <code>ltm-react/VOXEL_GUIDE.md</code> for integration instructions.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

import { HelloWorld, ScratchEditor, VoxelEngine } from 'ltm-react'
import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [generatedCode, setGeneratedCode] = useState('');
  const [voxelWorld, setVoxelWorld] = useState(null);
  const voxelEngineRef = useRef(null);

  const handleCodeChange = (code, language) => {
    setGeneratedCode(code);
    console.log(`Generated ${language} code:`, code);
  };

  const handleVoxelEngineReady = (engine) => {
    console.log('Voxel engine ready:', engine);
    // You can initialize your voxel world here
  };

  const handleVoxelError = (error) => {
    console.error('Voxel engine error:', error);
  };

  const handleVoxelChange = (changeData) => {
    console.log('Voxel world changed:', changeData);
    setVoxelWorld(changeData.voxels);
  };

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

  // Define the Blockly toolbox configuration
  const toolbox = {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: 'Logic',
        colour: '210',
        contents: [
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'logic_compare' },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_negate' },
          { kind: 'block', type: 'logic_boolean' },
        ],
      },
      {
        kind: 'category',
        name: 'Loops',
        colour: '120',
        contents: [
          { kind: 'block', type: 'controls_repeat_ext' },
          { kind: 'block', type: 'controls_whileUntil' },
          { kind: 'block', type: 'controls_for' },
        ],
      },
      {
        kind: 'category',
        name: 'Math',
        colour: '230',
        contents: [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'math_arithmetic' },
          { kind: 'block', type: 'math_single' },
        ],
      },
      {
        kind: 'category',
        name: 'Text',
        colour: '160',
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_print' },
          { kind: 'block', type: 'text_join' },
        ],
      },
      {
        kind: 'category',
        name: 'Variables',
        colour: '330',
        custom: 'VARIABLE',
      },
      {
        kind: 'category',
        name: 'Functions',
        colour: '290',
        custom: 'PROCEDURE',
      },
    ],
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>LTM React Library Demo</h1>
        <p>This frontend imports components from the ltm-react library</p>
      </header>
      
      <main>
        <div style={{ margin: '40px auto', maxWidth: '600px' }}>
          <HelloWorld />
          
          <div style={{ marginTop: '30px' }}>
            <HelloWorld name="LTM Users" />
          </div>
        </div>

        <div style={{ margin: '40px auto', maxWidth: '1200px' }}>
          <h2>Blockly Block-Based Programming Editor</h2>
          <p>Drag and drop blocks to create code. Based on Scratch/Blockly.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <ScratchEditor 
              height="600px"
              toolbox={toolbox}
              onCodeChange={handleCodeChange}
              codeLanguage="JavaScript"
            />
            
            <div style={{ 
              border: '2px solid #ddd', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#f5f5f5',
              height: '600px',
              overflow: 'auto'
            }}>
              <h3 style={{ marginTop: 0 }}>Generated Code:</h3>
              <pre style={{ 
                backgroundColor: '#282c34', 
                color: '#abb2bf', 
                padding: '15px', 
                borderRadius: '4px',
                fontSize: '14px',
                overflow: 'auto'
              }}>
                {generatedCode || '// Drag blocks to generate code...'}
              </pre>
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

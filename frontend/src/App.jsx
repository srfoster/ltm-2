import { HelloWorld, ScratchEditor, VoxelEngine } from 'ltm-react'
import { useState } from 'react'
import './App.css'

function App() {
  const [generatedCode, setGeneratedCode] = useState('');

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
          <p>3D voxel-based world engine (Minecraft-like rendering)</p>
          
          <VoxelEngine 
            width="100%"
            height="600px"
            onEngineReady={handleVoxelEngineReady}
            onError={handleVoxelError}
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

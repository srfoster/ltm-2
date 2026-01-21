import { HelloWorld, ScratchEditor } from 'ltm-react'
import { useState } from 'react'
import './App.css'

function App() {
  const [generatedCode, setGeneratedCode] = useState('');

  const handleCodeChange = (code, language) => {
    setGeneratedCode(code);
    console.log(`Generated ${language} code:`, code);
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
      </main>
    </div>
  )
}

export default App

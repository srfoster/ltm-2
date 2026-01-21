import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import { phpGenerator } from 'blockly/php';
import { luaGenerator } from 'blockly/lua';
import { dartGenerator } from 'blockly/dart';
import './ScratchEditor.css';

/**
 * ScratchEditor - A wrapper component for Blockly providing drag and drop block-based coding
 * 
 * @param {Object} props
 * @param {string} props.initialXml - Initial Blockly workspace XML
 * @param {Function} props.onWorkspaceChange - Callback when workspace changes (receives workspace)
 * @param {Function} props.onCodeChange - Callback when generated code changes (receives code, language)
 * @param {string} props.width - Width of the editor (default: '100%')
 * @param {string} props.height - Height of the editor (default: '600px')
 * @param {Object} props.toolbox - Blockly toolbox configuration object (required)
 * @param {string} props.codeLanguage - Language for code generation: 'JavaScript', 'Python', 'PHP', 'Lua', 'Dart' (default: 'JavaScript')
 */
const ScratchEditor = ({ 
  initialXml = '<xml xmlns="http://www.w3.org/1999/xhtml"></xml>',
  onWorkspaceChange = null,
  onCodeChange = null,
  width = '100%',
  height = '600px',
  toolbox,
  codeLanguage = 'JavaScript',
  ...props 
}) => {
  const [workspace, setWorkspace] = useState(null);

  const handleWorkspaceChange = (workspace) => {
    setWorkspace(workspace);
    
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
    }

    if (onCodeChange && workspace) {
      try {
        let code = '';
        switch (codeLanguage) {
          case 'Python':
            code = pythonGenerator.workspaceToCode(workspace);
            break;
          case 'PHP':
            code = phpGenerator.workspaceToCode(workspace);
            break;
          case 'Lua':
            code = luaGenerator.workspaceToCode(workspace);
            break;
          case 'Dart':
            code = dartGenerator.workspaceToCode(workspace);
            break;
          case 'JavaScript':
          default:
            code = javascriptGenerator.workspaceToCode(workspace);
        }
        onCodeChange(code, codeLanguage);
      } catch (error) {
        console.error('Error generating code:', error);
      }
    }
  };

  return (
    <div 
      style={{ 
        width, 
        height, 
        border: '2px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        ...props.style 
      }}
    >
      <BlocklyWorkspace
        className="blockly-workspace-container"
        initialXml={initialXml}
        workspaceConfiguration={{
          grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true,
          },
          zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
          },
          trashcan: true,
          media: 'https://unpkg.com/blockly/media/',
        }}
        toolboxConfiguration={toolbox}
        onWorkspaceChange={handleWorkspaceChange}
        {...props}
      />
    </div>
  );
};

export default ScratchEditor;

import React, { useState, useEffect, useRef } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator, Order } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import { phpGenerator } from 'blockly/php';
import { luaGenerator } from 'blockly/lua';
import { dartGenerator } from 'blockly/dart';
import { defineVoxelBlocks, defineVoxelGenerators } from './VoxelBlocks';
import './ScratchEditor.css';

// Register blocks globally once at module load time
defineVoxelBlocks(Blockly);
defineVoxelGenerators(javascriptGenerator, Order);
console.log('Voxel blocks registered at module load');

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
  const workspaceRef = useRef(null);

  // onInject is called when workspace is created - register blocks here
  const handleInject = (injectedWorkspace) => {
    console.log('Workspace injected! Registering custom blocks...');
    workspaceRef.current = injectedWorkspace;
    
    // The workspace was just created by react-blockly's bundled Blockly
    // We need to register blocks on THAT Blockly instance, not our imported one
    try {
      // Access Blockly through the workspace object
      // The workspace has references to Block constructors and other Blockly internals
      const WorkspaceBlockly = injectedWorkspace.constructor;
      
      // Walk up the constructor chain to find the Blockly root object
      let BlocklyRoot = WorkspaceBlockly;
      while (BlocklyRoot && !BlocklyRoot.Blocks) {
        BlocklyRoot = Object.getPrototypeOf(BlocklyRoot);
      }
      
      // If we found Blocks, we have the right Blockly object
      if (BlocklyRoot && BlocklyRoot.Blocks) {
        console.log('Found react-blockly Blockly instance through workspace');
        
        // Check if blocks are already registered
        if (!BlocklyRoot.Blocks['voxel_add']) {
          console.log('Registering voxel blocks...');
          defineVoxelBlocks({ Blocks: BlocklyRoot.Blocks });
          
          // Try to find JavaScript generator
          if (BlocklyRoot.JavaScript) {
            console.log('Found JavaScript generator');
            defineVoxelGenerators(BlocklyRoot.JavaScript, BlocklyRoot.JavaScript.Order);
          } else {
            console.log('Using imported generator');
            defineVoxelGenerators(javascriptGenerator, Order);
          }
          console.log('✓ Voxel blocks registered successfully on react-blockly Blockly');
        } else {
          console.log('Voxel blocks already registered');
        }
      } else {
        console.log('Could not find Blockly.Blocks, using imported Blockly');
        // Fallback to our imported Blockly (already registered at module load)
      }
    } catch (e) {
      console.error('Failed to register blocks:', e);
      console.log('Using fallback registration on imported Blockly');
    }
  };

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
        onInject={handleInject}
        onWorkspaceChange={handleWorkspaceChange}
        {...props}
      />
    </div>
  );
};

export default ScratchEditor;

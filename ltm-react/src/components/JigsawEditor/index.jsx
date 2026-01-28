import React, { useRef, useEffect } from 'react';
import { useJigsawState } from './useJigsawState';
import { BlockRenderer, ConnectionLines } from './BlockRenderer';
import './JigsawEditor.css';

/**
 * JigsawEditor - A simple drag-and-drop block editor
 * Features a pannable canvas with draggable blocks that snap together
 */
const JigsawEditor = ({ 
  width = '100%',
  height = '600px',
  onCodeChange = null,
  ...props 
}) => {
  const canvasRef = useRef(null);
  
  const {
    blocks,
    panOffset,
    isPanning,
    draggedBlock,
    snapTarget,
    snapType,
    handleCanvasMouseDown,
    handleBlockMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useJigsawState(onCodeChange);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={canvasRef}
      className="jigsaw-editor"
      style={{ 
        width, 
        height,
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab',
        backgroundColor: '#f0f0f0',
        border: '2px solid #ddd',
        borderRadius: '8px',
        userSelect: 'none',
        ...props.style 
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      <div 
        className="jigsaw-canvas"
        style={{
          position: 'absolute',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          width: '100%',
          height: '100%'
        }}
      >
        {blocks.map(block => (
          <BlockRenderer
            key={block.id}
            block={block}
            blocks={blocks}
            draggedBlock={draggedBlock}
            snapTarget={snapTarget}
            handleBlockMouseDown={handleBlockMouseDown}
          />
        ))}
        
        <ConnectionLines blocks={blocks} />
      </div>
      
      <div 
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}
      >
        Pan: Click & drag canvas | Snap: Drag blocks near each other
      </div>
    </div>
  );
};

export default JigsawEditor;

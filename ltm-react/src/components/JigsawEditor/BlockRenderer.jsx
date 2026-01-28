import React from 'react';
import { BLOCK_HEIGHT, BLOCK_PADDING } from './constants';
import { getContainerDimensions, parseBlockText } from './utils';

export const BlockRenderer = ({ 
  block, 
  blocks,
  draggedBlock, 
  snapTarget,
  handleBlockMouseDown 
}) => {
  if (block.type === 'container') {
    return (
      <ContainerBlock
        block={block}
        blocks={blocks}
        draggedBlock={draggedBlock}
        handleBlockMouseDown={handleBlockMouseDown}
      />
    );
  } else {
    return (
      <CommandBlock
        block={block}
        draggedBlock={draggedBlock}
        snapTarget={snapTarget}
        handleBlockMouseDown={handleBlockMouseDown}
      />
    );
  }
};

const ContainerBlock = ({ block, blocks, draggedBlock, handleBlockMouseDown }) => {
  const { width, height, childCount } = getContainerDimensions(block, blocks);
  
  return (
    <div
      className="jigsaw-block jigsaw-block-container"
      style={{
        position: 'absolute',
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        border: '3px solid #9C27B0',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: draggedBlock === block.id ? 'none' : 'all 0.2s',
        pointerEvents: 'none',
      }}
    >
      <div 
        style={{
          padding: '8px 15px',
          backgroundColor: '#9C27B0',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '10px',
          cursor: draggedBlock === block.id ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => handleBlockMouseDown(e, block)}
      >
        {block.text} [{childCount} blocks]
      </div>
      <div style={{
        padding: `${BLOCK_PADDING}px`,
        position: 'relative',
        flex: 1
      }}>
        {/* Container body - blocks will be positioned inside */}
      </div>
    </div>
  );
};

const CommandBlock = ({ block, draggedBlock, snapTarget, handleBlockMouseDown }) => {
  return (
    <div
      className={`jigsaw-block jigsaw-block-${block.type}`}
      style={{
        position: 'absolute',
        left: `${block.x}px`,
        top: `${block.y}px`,
        padding: '12px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        borderRadius: '8px',
        cursor: draggedBlock === block.id ? 'grabbing' : 'grab',
        boxShadow: snapTarget === block.id 
          ? '0 0 20px rgba(76, 175, 80, 0.8)' 
          : '0 2px 8px rgba(0,0,0,0.2)',
        fontFamily: 'monospace',
        fontSize: '14px',
        minWidth: '200px',
        transition: draggedBlock === block.id ? 'none' : 'box-shadow 0.2s',
        border: snapTarget === block.id ? '2px solid #81C784' : 'none',
      }}
      onMouseDown={(e) => handleBlockMouseDown(e, block)}
      onMouseEnter={(e) => {
        if (draggedBlock !== block.id && snapTarget !== block.id) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (draggedBlock !== block.id && snapTarget !== block.id) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        }
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {parseBlockText(block.text).map((part, idx) => (
          <BlockPart key={idx} part={part} />
        ))}
      </div>
    </div>
  );
};

const BlockPart = ({ part }) => {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: part.type === 'function' ? '4px 8px' : '3px 7px',
        backgroundColor: part.type === 'function' 
          ? 'rgba(255, 255, 255, 0.25)' 
          : 'rgba(255, 255, 255, 0.35)',
        borderRadius: '4px',
        fontSize: part.type === 'function' ? '14px' : '13px',
        fontWeight: part.type === 'function' ? 'bold' : 'normal',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = part.type === 'function'
          ? 'rgba(255, 255, 255, 0.35)'
          : 'rgba(255, 255, 255, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = part.type === 'function'
          ? 'rgba(255, 255, 255, 0.25)'
          : 'rgba(255, 255, 255, 0.35)';
      }}
    >
      {part.value}
    </span>
  );
};

export const ConnectionLines = ({ blocks }) => {
  return blocks.map(block => {
    if (block.nextId) {
      const nextBlock = blocks.find(b => b.id === block.nextId);
      if (nextBlock) {
        const startX = block.x + 100;
        const startY = block.y + BLOCK_HEIGHT;
        const endX = nextBlock.x + 100;
        const endY = nextBlock.y;
        
        return (
          <svg
            key={`connector-${block.id}-${block.nextId}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#4CAF50"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={endX} cy={endY} r="4" fill="#4CAF50" />
          </svg>
        );
      }
    }
    return null;
  });
};

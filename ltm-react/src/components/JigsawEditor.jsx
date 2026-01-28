import React, { useRef, useState, useEffect } from 'react';
import './JigsawEditor.css';

const SNAP_THRESHOLD = 30; // pixels
const BLOCK_HEIGHT = 50; // approximate height of a block
const BLOCK_PADDING = 15; // padding inside container blocks
const CONTAINER_MIN_HEIGHT = 100; // minimum height for container blocks

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
  const [blocks, setBlocks] = useState([
    { id: 1, type: 'command', text: 'addVoxel(0, 1, 0, 1, 0, 0)', x: 50, y: 50, nextId: null },
    { id: 2, type: 'command', text: 'addVoxel(0, 2, 0, 0, 1, 0)', x: 50, y: 120, nextId: null },
    { id: 3, type: 'command', text: 'removeVoxel(0, 1, 0)', x: 50, y: 190, nextId: null },
    { id: 4, type: 'container', text: 'function myFunction()', x: 300, y: 50, nextId: null, childId: null, width: 250, height: 40 + BLOCK_HEIGHT + BLOCK_PADDING * 2 }, // header + 1 block height + padding
  ]);
  
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snapTarget, setSnapTarget] = useState(null); // block to snap to
  const [snapType, setSnapType] = useState(null); // 'top' or 'bottom'

  // Generate code from blocks
  useEffect(() => {
    if (onCodeChange) {
      // Sort blocks by Y position and generate code
      const sortedBlocks = [...blocks].sort((a, b) => a.y - b.y);
      const code = sortedBlocks.map(block => block.text + ';').join('\n');
      onCodeChange(code);
    }
  }, [blocks, onCodeChange]);

  // Get all blocks connected below the given block
  const getConnectedBlocks = (blockId) => {
    const connected = [];
    let currentId = blockId;
    
    while (currentId) {
      const block = blocks.find(b => b.id === currentId);
      if (block && block.nextId) {
        connected.push(block.nextId);
        currentId = block.nextId;
      } else {
        break;
      }
    }
    
    return connected;
  };

  // Get all blocks inside a container (recursively through childId chain)
  const getContainerChildren = (containerId) => {
    const children = [];
    const container = blocks.find(b => b.id === containerId);
    if (!container || !container.childId) return children;
    
    let currentId = container.childId;
    while (currentId) {
      children.push(currentId);
      const block = blocks.find(b => b.id === currentId);
      if (block && block.nextId) {
        currentId = block.nextId;
      } else {
        break;
      }
    }
    
    return children;
  };

  // Check if a block is inside a container
  const isBlockInsideContainer = (blockX, blockY, container) => {
    // Check if the block overlaps with the container's interior area
    // Container interior starts after the header (40px) and has padding
    const containerLeft = container.x;
    const containerRight = container.x + container.width;
    const containerTop = container.y + 40; // after header
    const containerBottom = container.y + container.height;
    
    // Block occupies space from (blockX, blockY) to (blockX + 200, blockY + 50)
    const blockRight = blockX + 200; // approximate block width
    const blockBottom = blockY + BLOCK_HEIGHT;
    
    // Check for overlap
    const horizontalOverlap = blockX < containerRight && blockRight > containerLeft;
    const verticalOverlap = blockY < containerBottom && blockBottom > containerTop;
    
    return horizontalOverlap && verticalOverlap;
  };

  // Update container size to fit its children
  const updateContainerSize = (containerId, blocksList) => {
    const container = blocksList.find(b => b.id === containerId);
    if (!container || container.type !== 'container') return blocksList;
    
    // Count children by following the childId -> nextId chain
    let childCount = 0;
    if (container.childId) {
      let currentId = container.childId;
      while (currentId) {
        childCount++;
        const child = blocksList.find(b => b.id === currentId);
        if (child && child.nextId) {
          currentId = child.nextId;
        } else {
          break;
        }
      }
    }
    
    console.log(`Container ${containerId} has ${childCount} children`);
    
    // Calculate dimensions
    const minWidth = 250;
    const headerHeight = 40;
    const blockHeight = BLOCK_HEIGHT; // 50px
    const padding = BLOCK_PADDING * 2; // top and bottom padding
    
    // Height = header + (number of blocks * block height) + padding
    // Minimum 1 block space even if empty
    const numBlockSpaces = Math.max(1, childCount);
    const requiredHeight = headerHeight + (numBlockSpaces * blockHeight) + padding;
    
    // Width should fit the widest block (200px minWidth from CSS) + padding
    const requiredWidth = Math.max(minWidth, 200 + BLOCK_PADDING * 2);
    
    console.log(`Container size: w=${requiredWidth}, h=${requiredHeight} for ${childCount} blocks`);
    
    return blocksList.map(b => 
      b.id === containerId 
        ? { ...b, width: requiredWidth, height: requiredHeight }
        : b
    );
  };

  // Handle mouse down on canvas (start panning)
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  // Handle mouse down on block (start dragging)
  const handleBlockMouseDown = (e, block) => {
    e.stopPropagation();
    setDraggedBlock(block.id);
    
    // Break connection to parent when starting to drag
    setBlocks(prevBlocks => {
      return prevBlocks.map(b => {
        if (b.nextId === block.id) {
          return { ...b, nextId: null };
        }
        return b;
      });
    });
    
    // Calculate offset from mouse position to block position in canvas coordinates
    setDragOffset({
      x: e.clientX - panOffset.x - block.x,
      y: e.clientY - panOffset.y - block.y
    });
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedBlock !== null) {
      const newX = e.clientX - dragOffset.x - panOffset.x;
      const newY = e.clientY - dragOffset.y - panOffset.y;
      
      // Get the current dragged block's position
      const draggedBlockData = blocks.find(b => b.id === draggedBlock);
      if (!draggedBlockData) return;
      
      const deltaX = newX - draggedBlockData.x;
      const deltaY = newY - draggedBlockData.y;
      
      // Get all blocks connected below this one
      const connectedIds = getConnectedBlocks(draggedBlock);
      
      // Find potential snap target
      let potentialSnapTarget = null;
      let snapType = null; // 'bottom' or 'top'
      
      for (const block of blocks) {
        if (block.id === draggedBlock || connectedIds.includes(block.id)) continue;
        
        const horizontalAlign = Math.abs(newX - block.x) < SNAP_THRESHOLD;
        
        // Check if dragged block's bottom is near another block's top (dragged block on top)
        const draggedBottom = newY + BLOCK_HEIGHT;
        const targetTop = block.y;
        const verticalNearBottom = Math.abs(draggedBottom - targetTop) < SNAP_THRESHOLD;
        
        if (horizontalAlign && verticalNearBottom) {
          potentialSnapTarget = block.id;
          snapType = 'bottom'; // dragged block connects below target
          break;
        }
        
        // Check if dragged block's top is near another block's bottom (dragged block below)
        const draggedTop = newY;
        const targetBottom = block.y + BLOCK_HEIGHT;
        const verticalNearTop = Math.abs(draggedTop - targetBottom) < SNAP_THRESHOLD;
        
        if (horizontalAlign && verticalNearTop) {
          // Only snap if the target block doesn't already have a next block
          if (!block.nextId) {
            potentialSnapTarget = block.id;
            snapType = 'top'; // dragged block connects below target
            break;
          }
        }
      }
      
      setSnapTarget(potentialSnapTarget);
      setSnapType(snapType);
      
      // Update positions of dragged block and all connected blocks below it
      setBlocks(blocks.map(block => {
        if (block.id === draggedBlock) {
          return {
            ...block,
            x: newX,
            y: newY
          };
        } else if (connectedIds.includes(block.id)) {
          // Move connected blocks by the same delta
          return {
            ...block,
            x: block.x + deltaX,
            y: block.y + deltaY
          };
        }
        return block;
      }));
    }
  };

  // Handle mouse up - apply snapping
  const handleMouseUp = () => {
    if (draggedBlock !== null) {
      const draggedBlockData = blocks.find(b => b.id === draggedBlock);
      
      console.log('Mouse up, draggedBlock:', draggedBlock, 'at position:', draggedBlockData);
      
      // Check if block was dropped into a container
      let droppedInContainer = null;
      for (const block of blocks) {
        if (block.type === 'container' && block.id !== draggedBlock && draggedBlockData) {
          const bounds = {
            xMin: block.x + BLOCK_PADDING,
            xMax: block.x + block.width - BLOCK_PADDING,
            yMin: block.y + 40,
            yMax: block.y + block.height - BLOCK_PADDING
          };
          console.log('Checking container:', block.id, 'block pos:', {x: draggedBlockData.x, y: draggedBlockData.y}, 'bounds:', bounds);
          const isInside = isBlockInsideContainer(draggedBlockData.x, draggedBlockData.y, block);
          console.log('Is inside?', isInside);
          if (isInside) {
            droppedInContainer = block.id;
            break;
          }
        }
      }
      
      console.log('Dropped in container:', droppedInContainer);
      
      if (droppedInContainer) {
        // Add block to container
        setBlocks(prevBlocks => {
          // First, disconnect the dragged block from any previous connections
          let updated = prevBlocks.map(b => {
            if (b.nextId === draggedBlock) {
              return { ...b, nextId: null };
            }
            return b;
          });
          
          const container = updated.find(b => b.id === droppedInContainer);
          console.log('Container before adding child:', container);
          
          // Calculate position for the block inside container
          let blockIndex = 0;
          let isFirstChild = !container.childId;
          
          console.log('Is first child?', isFirstChild, 'draggedBlock:', draggedBlock);
          
          // If container has no children, make this the first child
          if (isFirstChild) {
            updated = updated.map(b => 
              b.id === droppedInContainer 
                ? { ...b, childId: draggedBlock }
                : b
            );
            blockIndex = 0;
            console.log('Set childId on container to:', draggedBlock);
          } else {
            // Container already has children, add to the end of the chain
            let lastChildId = container.childId;
            let lastChild = updated.find(b => b.id === lastChildId);
            blockIndex = 1;
            while (lastChild && lastChild.nextId) {
              lastChildId = lastChild.nextId;
              lastChild = updated.find(b => b.id === lastChildId);
              blockIndex++;
            }
            // Connect the last child to the dragged block
            updated = updated.map(b => 
              b.id === lastChildId ? { ...b, nextId: draggedBlock } : b
            );
            console.log('Added to end of chain, blockIndex:', blockIndex);
          }
          
          // Get fresh container reference after childId updates
          const updatedContainer = updated.find(b => b.id === droppedInContainer);
          console.log('Container after adding child:', updatedContainer);
          // Position the block inside the container
          const headerHeight = 40;
          const newX = updatedContainer.x + BLOCK_PADDING;
          const newY = updatedContainer.y + headerHeight + BLOCK_PADDING + (blockIndex * BLOCK_HEIGHT);
          
          updated = updated.map(b => {
            if (b.id === draggedBlock) {
              // Clear nextId for the dragged block (it's now at the end of the chain)
              return { ...b, x: newX, y: newY, nextId: null };
            }
            return b;
          });
          
          console.log('Before updateContainerSize, updated blocks:', updated.find(b => b.id === droppedInContainer));
          
          // Update container size
          const result = updateContainerSize(droppedInContainer, updated);
          
          console.log('After updateContainerSize:', result.find(b => b.id === droppedInContainer));
          
          return result;
        });
      } else if (snapTarget !== null && snapType !== null) {
        // Normal block snapping
        setBlocks(prevBlocks => {
          const targetBlockData = prevBlocks.find(b => b.id === snapTarget);
          
          if (draggedBlockData && targetBlockData) {
            // Disconnect draggedBlock from any previous connection
            const updatedBlocks = prevBlocks.map(b => {
              if (b.nextId === draggedBlock) {
                return { ...b, nextId: null };
              }
              return b;
            });
            
            if (snapType === 'bottom') {
              // Dragged block connects ABOVE target (dragged block's bottom to target's top)
              return updatedBlocks.map(block => {
                if (block.id === draggedBlock) {
                  return {
                    ...block,
                    x: targetBlockData.x,
                    y: targetBlockData.y - BLOCK_HEIGHT,
                    nextId: snapTarget
                  };
                }
                return block;
              });
            } else if (snapType === 'top') {
              // Dragged block connects BELOW target (dragged block's top to target's bottom)
              return updatedBlocks.map(block => {
                if (block.id === draggedBlock) {
                  return {
                    ...block,
                    x: targetBlockData.x,
                    y: targetBlockData.y + BLOCK_HEIGHT,
                    nextId: null
                  };
                } else if (block.id === snapTarget) {
                  return {
                    ...block,
                    nextId: draggedBlock
                  };
                }
                return block;
              });
            }
          }
          return prevBlocks;
        });
      }
    }
    
    setIsPanning(false);
    setDraggedBlock(null);
    setSnapTarget(null);
    setSnapType(null);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, draggedBlock, panStart, panOffset, dragOffset, blocks, snapTarget, snapType]);

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
        {blocks.map(block => {
          if (block.type === 'container') {
            // Render container blocks differently
            console.log(`Rendering container ${block.id} with height: ${block.height}`);
            
            // Count children for debugging
            const children = [];
            if (block.childId) {
              let currentId = block.childId;
              while (currentId) {
                children.push(currentId);
                const childBlock = blocks.find(b => b.id === currentId);
                if (childBlock && childBlock.nextId) {
                  currentId = childBlock.nextId;
                } else {
                  break;
                }
              }
            }
            
            return (
              <div
                key={block.id}
                className="jigsaw-block jigsaw-block-container"
                style={{
                  position: 'absolute',
                  left: `${block.x}px`,
                  top: `${block.y}px`,
                  width: `${block.width}px`,
                  height: `${block.height}px`,
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  border: '3px solid #9C27B0',
                  borderRadius: '12px',
                  cursor: draggedBlock === block.id ? 'grabbing' : 'grab',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: draggedBlock === block.id ? 'none' : 'all 0.2s',
                }}
                onMouseDown={(e) => handleBlockMouseDown(e, block)}
              >
                <div style={{
                  padding: '8px 15px',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  borderRadius: '8px 8px 0 0',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  {block.text} [{children.length} blocks, h={block.height}px]
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
          } else {
            // Render regular command blocks
            return (
              <div
                key={block.id}
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
                {block.text}
              </div>
            );
          }
        })}
        
        {/* Draw connection lines between snapped blocks */}
        {blocks.map(block => {
          if (block.nextId) {
            const nextBlock = blocks.find(b => b.id === block.nextId);
            if (nextBlock) {
              const startX = block.x + 100; // center of block
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
        })}
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

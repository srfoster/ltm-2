import { useState, useEffect } from 'react';
import { SNAP_THRESHOLD, BLOCK_HEIGHT, BLOCK_PADDING } from './constants';
import { 
  getConnectedBlocks, 
  getContainerChildren, 
  isBlockInsideContainer 
} from './utils';

export const useJigsawState = (onCodeChange) => {
  const [blocks, setBlocks] = useState([
    { id: 1, type: 'command', text: 'addVoxel(0, 1, 0, 1, 0, 0)', x: 50, y: 50, nextId: null },
    { id: 2, type: 'command', text: 'addVoxel(0, 2, 0, 0, 1, 0)', x: 50, y: 120, nextId: null },
    { id: 3, type: 'command', text: 'removeVoxel(0, 1, 0)', x: 50, y: 190, nextId: null },
    { id: 4, type: 'container', text: 'function myFunction()', x: 300, y: 50, nextId: null, childId: null },
  ]);
  
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snapTarget, setSnapTarget] = useState(null);
  const [snapType, setSnapType] = useState(null);

  // Generate code from blocks
  useEffect(() => {
    if (onCodeChange) {
      const sortedBlocks = [...blocks].sort((a, b) => a.y - b.y);
      const code = sortedBlocks.map(block => block.text + ';').join('\n');
      onCodeChange(code);
    }
  }, [blocks, onCodeChange]);

  // Handle mouse down on canvas (start panning)
  const handleCanvasMouseDown = (e) => {
    if (e.target.classList.contains('jigsaw-editor')) {
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
      let updated = prevBlocks.map(b => {
        if (b.nextId === block.id) {
          return { ...b, nextId: null };
        }
        return b;
      });
      
      // Check if this block was a child of a container and remove it
      const containerWithChild = updated.find(b => b.type === 'container' && b.childId === block.id);
      if (containerWithChild) {
        const draggedBlock = updated.find(b => b.id === block.id);
        updated = updated.map(b => {
          if (b.id === containerWithChild.id) {
            return { ...b, childId: draggedBlock?.nextId || null };
          }
          if (b.id === block.id) {
            return { ...b, nextId: null };
          }
          return b;
        });
      }
      
      return updated;
    });
    
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
      
      const draggedBlockData = blocks.find(b => b.id === draggedBlock);
      if (!draggedBlockData) return;
      
      const deltaX = newX - draggedBlockData.x;
      const deltaY = newY - draggedBlockData.y;
      
      // Get all blocks connected below this one
      const connectedIds = getConnectedBlocks(draggedBlock, blocks);
      
      // If dragging a container, also include all its children
      const childIds = draggedBlockData.type === 'container' 
        ? getContainerChildren(draggedBlock, blocks)
        : [];
      
      // Find potential snap target
      let potentialSnapTarget = null;
      let snapType = null;
      
      for (const block of blocks) {
        if (block.id === draggedBlock || connectedIds.includes(block.id) || childIds.includes(block.id)) continue;
        
        const horizontalAlign = Math.abs(newX - block.x) < SNAP_THRESHOLD;
        
        // Check if dragged block's bottom is near another block's top
        const draggedBottom = newY + BLOCK_HEIGHT;
        const targetTop = block.y;
        const verticalNearBottom = Math.abs(draggedBottom - targetTop) < SNAP_THRESHOLD;
        
        if (horizontalAlign && verticalNearBottom) {
          potentialSnapTarget = block.id;
          snapType = 'bottom';
          break;
        }
        
        // Check if dragged block's top is near another block's bottom
        const draggedTop = newY;
        const targetBottom = block.y + BLOCK_HEIGHT;
        const verticalNearTop = Math.abs(draggedTop - targetBottom) < SNAP_THRESHOLD;
        
        if (horizontalAlign && verticalNearTop) {
          if (!block.nextId) {
            potentialSnapTarget = block.id;
            snapType = 'top';
            break;
          }
        }
      }
      
      setSnapTarget(potentialSnapTarget);
      setSnapType(snapType);
      
      // Update positions of dragged block and all connected blocks
      setBlocks(blocks.map(block => {
        if (block.id === draggedBlock) {
          return { ...block, x: newX, y: newY };
        } else if (connectedIds.includes(block.id) || childIds.includes(block.id)) {
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
      
      // Check if block was dropped into a container
      let droppedInContainer = null;
      for (const block of blocks) {
        if (block.type === 'container' && block.id !== draggedBlock && draggedBlockData) {
          if (isBlockInsideContainer(draggedBlockData.x, draggedBlockData.y, block, blocks)) {
            droppedInContainer = block.id;
            break;
          }
        }
      }
      
      if (droppedInContainer) {
        // Add block to container
        setBlocks(prevBlocks => {
          let updated = prevBlocks.map(b => {
            if (b.nextId === draggedBlock) {
              return { ...b, nextId: null };
            }
            return b;
          });
          
          const container = updated.find(b => b.id === droppedInContainer);
          let blockIndex = 0;
          let isFirstChild = !container.childId;
          
          if (isFirstChild) {
            updated = updated.map(b => 
              b.id === droppedInContainer 
                ? { ...b, childId: draggedBlock }
                : b
            );
            blockIndex = 0;
          } else {
            let lastChildId = container.childId;
            let lastChild = updated.find(b => b.id === lastChildId);
            blockIndex = 1;
            while (lastChild && lastChild.nextId) {
              lastChildId = lastChild.nextId;
              lastChild = updated.find(b => b.id === lastChildId);
              blockIndex++;
            }
            updated = updated.map(b => 
              b.id === lastChildId ? { ...b, nextId: draggedBlock } : b
            );
          }
          
          const updatedContainer = updated.find(b => b.id === droppedInContainer);
          const headerHeight = 40;
          const newX = updatedContainer.x + BLOCK_PADDING;
          const newY = updatedContainer.y + headerHeight + BLOCK_PADDING + (blockIndex * BLOCK_HEIGHT);
          
          updated = updated.map(b => {
            if (b.id === draggedBlock) {
              return { ...b, x: newX, y: newY, nextId: null };
            }
            return b;
          });
          
          return updated;
        });
      } else if (snapTarget !== null && snapType !== null) {
        // Normal block snapping
        setBlocks(prevBlocks => {
          const targetBlockData = prevBlocks.find(b => b.id === snapTarget);
          
          if (draggedBlockData && targetBlockData) {
            const updatedBlocks = prevBlocks.map(b => {
              if (b.nextId === draggedBlock) {
                return { ...b, nextId: null };
              }
              return b;
            });
            
            if (snapType === 'bottom') {
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

  return {
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
  };
};

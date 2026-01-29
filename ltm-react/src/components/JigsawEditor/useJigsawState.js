import { useState, useEffect } from 'react';
import { SNAP_THRESHOLD, BLOCK_HEIGHT, BLOCK_PADDING } from './constants';
import { 
  getConnectedBlocks, 
  getContainerChildren, 
  isBlockInsideContainer 
} from './utils';

/**
 * Break connections when a stackable block starts being dragged
 */
const breakBlockConnections = (block, blocks) => {
  let updated = blocks.map(b => {
    if (b.nextId === block.id) {
      return { ...b, nextId: null };
    }
    return b;
  });
  
  // Check if this block was a child of a container block and remove it
  const containerBlock = updated.find(b => b.type === 'container' && b.childId === block.id);
  if (containerBlock) {
    const draggedBlock = updated.find(b => b.id === block.id);
    updated = updated.map(b => {
      if (b.id === containerBlock.id) {
        return { ...b, childId: draggedBlock?.nextId || null };
      }
      if (b.id === block.id) {
        return { ...b, nextId: null };
      }
      return b;
    });
  }
  
  return updated;
};

/**
 * Find potential snap target for the dragged stackable block
 */
const findSnapTarget = (draggedBlockId, newX, newY, blocks, connectedIds, childIds) => {
  let potentialSnapTarget = null;
  let snapType = null;
  
  for (const block of blocks) {
    if (block.id === draggedBlockId || connectedIds.includes(block.id) || childIds.includes(block.id)) {
      continue;
    }
    
    const horizontalAlign = Math.abs(newX - block.x) < SNAP_THRESHOLD;
    
    // Check if dragged stackable block's bottom is near another stackable block's top
    const draggedBottom = newY + BLOCK_HEIGHT;
    const targetTop = block.y;
    const verticalNearBottom = Math.abs(draggedBottom - targetTop) < SNAP_THRESHOLD;
    
    if (horizontalAlign && verticalNearBottom) {
      potentialSnapTarget = block.id;
      snapType = 'bottom';
      break;
    }
    
    // Check if dragged stackable block's top is near another stackable block's bottom
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
  
  return { potentialSnapTarget, snapType };
};

/**
 * Update positions of dragged block and all connected stackable blocks
 */
const updateBlockPositions = (draggedBlockId, newX, newY, deltaX, deltaY, connectedIds, childIds, blocks) => {
  return blocks.map(block => {
    if (block.id === draggedBlockId) {
      return { ...block, x: newX, y: newY };
    } else if (connectedIds.includes(block.id) || childIds.includes(block.id)) {
      return {
        ...block,
        x: block.x + deltaX,
        y: block.y + deltaY
      };
    }
    return block;
  });
};

/**
 * Handle dropping a stackable block into a container block
 */
const handleDropInContainerBlock = (draggedBlockId, containerId, blocks) => {
  let updated = blocks.map(b => {
    if (b.nextId === draggedBlockId) {
      return { ...b, nextId: null };
    }
    return b;
  });
  
  const containerBlock = updated.find(b => b.id === containerId);
  let blockIndex = 0;
  let isFirstChild = !containerBlock.childId;
  
  if (isFirstChild) {
    updated = updated.map(b => 
      b.id === containerId 
        ? { ...b, childId: draggedBlockId }
        : b
    );
    blockIndex = 0;
  } else {
    let lastChildId = containerBlock.childId;
    let lastChild = updated.find(b => b.id === lastChildId);
    blockIndex = 1;
    while (lastChild && lastChild.nextId) {
      lastChildId = lastChild.nextId;
      lastChild = updated.find(b => b.id === lastChildId);
      blockIndex++;
    }
    updated = updated.map(b => 
      b.id === lastChildId ? { ...b, nextId: draggedBlockId } : b
    );
  }
  
  const updatedContainer = updated.find(b => b.id === containerId);
  const headerHeight = 40;
  const newX = updatedContainer.x + BLOCK_PADDING;
  const newY = updatedContainer.y + headerHeight + BLOCK_PADDING + (blockIndex * BLOCK_HEIGHT);
  
  updated = updated.map(b => {
    if (b.id === draggedBlockId) {
      return { ...b, x: newX, y: newY, nextId: null };
    }
    return b;
  });
  
  return updated;
};

/**
 * Handle dropping a stackable block beneath another stackable block
 */
const handleDropBeneathStackableBlock = (draggedBlockId, draggedBlockData, snapTarget, snapType, blocks) => {
  const targetBlockData = blocks.find(b => b.id === snapTarget);
  
  if (!draggedBlockData || !targetBlockData) {
    return blocks;
  }
  
  const updatedBlocks = blocks.map(b => {
    if (b.nextId === draggedBlockId) {
      return { ...b, nextId: null };
    }
    return b;
  });
  
  if (snapType === 'bottom') {
    // Dragged stackable block snaps above the target stackable block
    return updatedBlocks.map(block => {
      if (block.id === draggedBlockId) {
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
    // Dragged stackable block snaps below the target stackable block
    return updatedBlocks.map(block => {
      if (block.id === draggedBlockId) {
        return {
          ...block,
          x: targetBlockData.x,
          y: targetBlockData.y + BLOCK_HEIGHT,
          nextId: null
        };
      } else if (block.id === snapTarget) {
        return {
          ...block,
          nextId: draggedBlockId
        };
      }
      return block;
    });
  }
  
  return blocks;
};

export const useJigsawState = (onCodeChange) => {
  const [blocks, setBlocks] = useState([
    { id: 1, type: 'stackable', text: 'addVoxel(0, 1, 0, 1, 0, 0)', x: 50, y: 50, nextId: null },
    { id: 2, type: 'stackable', text: 'addVoxel(0, 2, 0, 0, 1, 0)', x: 50, y: 120, nextId: null },
    { id: 3, type: 'stackable', text: 'removeVoxel(0, 1, 0)', x: 50, y: 190, nextId: null },
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
    setBlocks(prevBlocks => breakBlockConnections(block, prevBlocks));
    
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
      
      // Get all stackable blocks connected below this one
      const connectedIds = getConnectedBlocks(draggedBlock, blocks);
      
      // If dragging a container block, also include all its children
      const childIds = draggedBlockData.type === 'container' 
        ? getContainerChildren(draggedBlock, blocks)
        : [];
      
      // Find potential snap target
      const { potentialSnapTarget, snapType: newSnapType } = findSnapTarget(
        draggedBlock, newX, newY, blocks, connectedIds, childIds
      );
      
      setSnapTarget(potentialSnapTarget);
      setSnapType(newSnapType);
      
      // Update positions of dragged block and all connected stackable blocks
      setBlocks(updateBlockPositions(
        draggedBlock, newX, newY, deltaX, deltaY, connectedIds, childIds, blocks
      ));
    }
  };

  // Handle mouse up - apply snapping or container drop
  const handleMouseUp = () => {
    if (draggedBlock !== null) {
      const draggedBlockData = blocks.find(b => b.id === draggedBlock);
      
      // Check if stackable block was dropped into a container block
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
        setBlocks(prevBlocks => 
          handleDropInContainerBlock(draggedBlock, droppedInContainer, prevBlocks)
        );
      } else if (snapTarget !== null && snapType !== null) {
        setBlocks(prevBlocks => 
          handleDropBeneathStackableBlock(draggedBlock, draggedBlockData, snapTarget, snapType, prevBlocks)
        );
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

import { BLOCK_HEIGHT, BLOCK_PADDING } from './constants';

/**
 * Calculate container dimensions reactively based on children
 */
export const getContainerDimensions = (container, blocks) => {
  // Count children by following the childId -> nextId chain
  let childCount = 0;
  let maxChildWidth = 0;
  
  if (container.childId) {
    let currentId = container.childId;
    while (currentId) {
      childCount++;
      const child = blocks.find(b => b.id === currentId);
      if (child) {
        // Estimate child width based on text length
        const estimatedWidth = Math.max(200, (child.text.length * 8) + 40);
        maxChildWidth = Math.max(maxChildWidth, estimatedWidth);
        
        if (child.nextId) {
          currentId = child.nextId;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }
  
  // Calculate dimensions
  const minWidth = 250;
  const headerHeight = 40;
  const blockHeight = BLOCK_HEIGHT; // 50px
  const verticalPadding = BLOCK_PADDING * 2; // top and bottom padding
  const leftIndent = BLOCK_PADDING; // 15px
  const rightPadding = 25; // padding on right
  
  // Height = header + (number of blocks * block height) + padding
  // Minimum 1 block space even if empty
  const numBlockSpaces = Math.max(1, childCount);
  const height = headerHeight + (numBlockSpaces * blockHeight) + verticalPadding;
  
  // Width = left indent + widest child + right padding
  const calculatedWidth = leftIndent + maxChildWidth + rightPadding;
  const width = Math.max(minWidth, calculatedWidth);
  
  return { width, height, childCount };
};

/**
 * Parse block text into parts for rendering (e.g., "addVoxel(0,1,0)" -> ["addVoxel", "0", "1", "0"])
 */
export const parseBlockText = (text) => {
  // Match function name and parameters
  const match = text.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    return [{ type: 'text', value: text }];
  }
  
  const [, functionName, paramsStr] = match;
  const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
  
  return [
    { type: 'function', value: functionName },
    ...params.map(p => ({ type: 'param', value: p }))
  ];
};

/**
 * Get all blocks connected below the given block
 */
export const getConnectedBlocks = (blockId, blocks) => {
  const connected = [];
  const block = blocks.find(b => b.id === blockId);
  
  if (block && block.nextId) {
    let currentId = block.nextId;
    while (currentId) {
      connected.push(currentId);
      const nextBlock = blocks.find(b => b.id === currentId);
      if (nextBlock && nextBlock.nextId) {
        currentId = nextBlock.nextId;
      } else {
        break;
      }
    }
  }
  
  return connected;
};

/**
 * Get all blocks inside a container (recursively through childId chain)
 */
export const getContainerChildren = (containerId, blocks) => {
  const children = [];
  const container = blocks.find(b => b.id === containerId);
  
  if (container && container.childId) {
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
  }
  
  return children;
};

/**
 * Check if a block is inside a container
 */
export const isBlockInsideContainer = (blockX, blockY, container, blocks) => {
  // Get reactive dimensions
  const { width, height } = getContainerDimensions(container, blocks);
  
  // Check if the block overlaps with the container's interior area
  // Container interior starts after the header (40px) and has padding
  const containerLeft = container.x;
  const containerRight = container.x + width;
  const containerTop = container.y + 40; // after header
  const containerBottom = container.y + height;
  
  // Block occupies space from (blockX, blockY) to (blockX + 200, blockY + 50)
  const blockRight = blockX + 200; // approximate block width
  const blockBottom = blockY + BLOCK_HEIGHT;
  
  // Check for overlap
  const horizontalOverlap = blockX < containerRight && blockRight > containerLeft;
  const verticalOverlap = blockY < containerBottom && blockBottom > containerTop;
  
  return horizontalOverlap && verticalOverlap;
};

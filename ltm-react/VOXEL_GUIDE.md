# Divine Voxel Engine Integration

The `VoxelEngine` component is a React wrapper for the Divine Voxel Engine.

## Installation

To use this component, you need to install the Divine Voxel Engine packages:

```bash
npm install @divinevoxel/vlox @divinevoxel/vlox-babylon babylonjs
```

## Basic Usage

```jsx
import { VoxelEngine } from 'ltm-react';

function MyApp() {
  const handleEngineReady = (engine) => {
    console.log('Engine ready:', engine);
    // Initialize your voxel world here
  };

  return (
    <VoxelEngine 
      width="100%"
      height="600px"
      onEngineReady={handleEngineReady}
    />
  );
}
```

## Advanced Usage

```jsx
import { VoxelEngine } from 'ltm-react';

function MyVoxelGame() {
  const handleEngineReady = async (engine) => {
    // Setup your world
    // Add voxels, lighting, etc.
  };

  const handleError = (error) => {
    console.error('Voxel engine error:', error);
  };

  return (
    <VoxelEngine 
      width="100%"
      height="800px"
      engineConfig={{
        renderMode: 'PBR', // or 'Classic'
        // Add other DVE configuration options
      }}
      onEngineReady={handleEngineReady}
      onError={handleError}
    />
  );
}
```

## Props

- `width` (string): Width of the canvas (default: '100%')
- `height` (string): Height of the canvas (default: '600px')
- `onEngineReady` (function): Callback when engine is initialized
- `engineConfig` (object): Configuration options for Divine Voxel Engine
- `onError` (function): Error handler callback

## Resources

- [Divine Voxel Engine GitHub](https://github.com/Divine-Star-Software/DivineVoxelEngine)
- [DVE Demos](https://divine-star-software.github.io/DivineVoxelEngine/)
- [Discord Community](https://discord.gg/98xEVU7TKn)

# Layout

This library provides a flexible layout system for positioning and sizing game elements in HTML5 Canvas games. It supports nested layouts with dock, stack, and leaf node types.

## Features

- **Responsive layouts** - Supports pixel and percentage-based measurements
- **Multiple layout types** - Dock, stack, and leaf nodes
- **Aspect ratio support** - Maintain aspect ratios automatically
- **Visibility and activation** - Control element visibility and layout participation
- **Hierarchical control** - Parent visibility/activation affects children with override support
- **Efficient updates** - Only recalculates when needed

## Usage

```typescript
import { vec2 } from '@basementuniverse/vec';
import { Layout } from '@basementuniverse/layout';

const layout = new Layout({
  root: {
    id: 'root',
    type: 'stack',
    direction: 'vertical',
    padding: { x: '10px', y: '10px' },
    children: [
      {
        id: 'header',
        type: 'leaf',
        size: { y: '60px' }, // Full width, 60px height
      },
      {
        id: 'content',
        type: 'stack',
        direction: 'horizontal',
        gap: '10px',
        children: [
          {
            id: 'sidebar',
            type: 'leaf',
            size: { x: '200px' },
          },
          {
            id: 'main',
            type: 'leaf',
          },
        ],
      },
    ],
  },
});

// Update layout with canvas size
layout.update(vec2(1024, 768));

// Get calculated node positions and sizes
const headerNode = layout.get('header');
console.log(`Header: ${headerNode.width}x${headerNode.height} at (${headerNode.left}, ${headerNode.top})`);

// Control visibility
layout.setVisibility('sidebar', false);

// Control layout participation
layout.setActivated('header', false); // Header won't affect layout calculations
```

## Layout Node Types

### Dock Layout
Positions children at specific dock positions (topLeft, topCenter, topRight, leftCenter, center, rightCenter, bottomLeft, bottomCenter, bottomRight).

### Stack Layout
Arranges children in a vertical or horizontal stack with optional alignment and spacing.

- `direction`: 'vertical' | 'horizontal'
- `align`: 'start' | 'center' | 'end' | 'stretch'
- `gap`: Spacing between children

### Leaf Layout
Terminal nodes that don't contain children.

## Measurements

All measurements support:
- **Pixels**: `'100px'`
- **Percentages**: `'50%'` (relative to parent)
- **Auto**: `'auto'` (fills available space)

## API

### Layout Class

- `update(size, offset?)` - Recalculate layout with new canvas size
- `get(id)` - Get calculated node data by ID
- `setVisibility(id, visible)` - Set visibility (affects children)
- `setActivated(id, activated)` - Set activation (affects layout and children)
- `hasNode(id)` - Check if node exists
- `getNodeIds()` - Get all node IDs

### CalculatedNode Properties

Each calculated node provides:
- Position: `center`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`
- Edge centers: `topCenter`, `bottomCenter`, `leftCenter`, `rightCenter`
- Bounds: `top`, `bottom`, `left`, `right`, `width`, `height`
- State: `visible`, `activated`, `aspectRatio`

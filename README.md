# Layout

A component for managing flexible layouts in HTML5 Canvas games. It supports nested layouts with dock, stack, and leaf node types.

## Installation

```bash
npm install @basementuniverse/layout
```

## Usage

```typescript
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
layout.update({ x: 1024, y: 768 });

// Get calculated node positions and sizes
const headerNode = layout.get('header');
console.log(`Header: ${headerNode.width}x${headerNode.height} at (${headerNode.left}, ${headerNode.top})`);

// Control visibility
layout.setVisibility('sidebar', false);

// Control layout participation
layout.setActivated('header', false); // Header won't affect layout calculations
```

## Layout node types

```typescript
type LayoutNodeOptions = {
  id: string;
  type: 'dock' | 'stack' | 'leaf';
  offset?: LayoutVec2;
  padding?: LayoutVec2;
  size?: Partial<LayoutVec2>;
  minSize?: Partial<LayoutVec2>;
  maxSize?: Partial<LayoutVec2>;
  aspectRatio?: number;
  visible?: boolean;
};
```

### Dock Layout

Positions children at specific dock positions.

```typescript
type DockLayoutNodeOptions = {
  type: 'dock';
  topLeft?: LayoutNodeOptions;
  topCenter?: LayoutNodeOptions;
  topRight?: LayoutNodeOptions;
  leftCenter?: LayoutNodeOptions;
  center?: LayoutNodeOptions;
  rightCenter?: LayoutNodeOptions;
  bottomLeft?: LayoutNodeOptions;
  bottomCenter?: LayoutNodeOptions;
  bottomRight?: LayoutNodeOptions;
};
```

### Stack Layout

Arranges children in a vertical or horizontal stack with optional alignment and spacing.

```typescript
type StackLayoutNodeOptions = {
  type: 'stack';
  direction: 'vertical' | 'horizontal';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: Measurement;
  children: LayoutNodeOptions[];
};
```

### Leaf Layout

Terminal nodes that don't contain children.

```typescript
type LeafLayoutNodeOptions = {
  type: 'leaf';
};
```

## Measurements

All measurements support:
- **Pixels**: `'100px'`
- **Percentages**: `'50%'` (relative to parent)
- **Auto**: `'auto'` (fills available space)

## API

### Layout Class

- `update(size, offset?)` - Recalculate layout with new canvas size
- `get(id)` - Get calculated node data by ID
- `setVisibility(id, visible)` - Set visibility (affects children). If `visible` is undefined, toggles current state.
- `setActivated(id, activated)` - Set activation (affects layout and children). If `activated` is undefined, toggles current state.
- `hasNode(id)` - Check if node exists
- `getNodeIds()` - Get all node IDs

### CalculatedNode Properties

```typescript
type CalculatedNode = {
  // Center
  center: vec2;

  // Corners
  topLeft: vec2;
  topRight: vec2;
  bottomLeft: vec2;
  bottomRight: vec2;

  // Edge centers
  topCenter: vec2;
  bottomCenter: vec2;
  leftCenter: vec2;
  rightCenter: vec2;

  // Edges
  top: number;
  bottom: number;
  left: number;
  right: number;

  // Size
  width: number;
  height: number;

  // Other
  aspectRatio: number;
  activated: boolean;
  visible: boolean;
};
```

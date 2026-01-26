# Layout Library - AI Documentation

TypeScript library for managing flexible layouts in HTML5 Canvas applications. Supports nested hierarchical layouts with dock, stack, and leaf node types.

## Core Exports

```typescript
export class Layout
export type Measurement = 'auto' | `${number}px` | `${number}%`
export type LayoutVec2 = { x: Measurement; y: Measurement }
export type LayoutOptions = { root: LayoutNodeOptions }
export type LayoutNodeOptions
export type CalculatedNode
```

## Type Definitions

### Measurement Types
- `Measurement`: `'auto'` | `'${number}px'` | `'${number}%'`
- `LayoutVec2`: `{ x: Measurement; y: Measurement }`

### Node Options
Base node options (common to all node types):
```typescript
{
  id: string;                      // Unique identifier
  type: 'dock' | 'stack' | 'leaf'; // Node type
  offset?: LayoutVec2;             // Position offset from parent
  padding?: LayoutVec2;            // Inner padding (reduces content area)
  size?: Partial<LayoutVec2>;      // Explicit size (x and/or y)
  minSize?: Partial<LayoutVec2>;   // Minimum size constraints
  maxSize?: Partial<LayoutVec2>;   // Maximum size constraints
  aspectRatio?: number;            // Width/height ratio
  visible?: boolean;               // Initial visibility (default: true)
}
```

### Dock Node
```typescript
{
  type: 'dock';
  // Optional children positioned at specific anchors:
  topLeft?: LayoutNodeOptions;
  topCenter?: LayoutNodeOptions;
  topRight?: LayoutNodeOptions;
  leftCenter?: LayoutNodeOptions;
  center?: LayoutNodeOptions;
  rightCenter?: LayoutNodeOptions;
  bottomLeft?: LayoutNodeOptions;
  bottomCenter?: LayoutNodeOptions;
  bottomRight?: LayoutNodeOptions;
}
```
- Children positioned at anchor points
- Child size calculated independently
- Child position adjusted based on anchor (e.g., center anchor centers child)

### Stack Node
```typescript
{
  type: 'stack';
  direction: 'vertical' | 'horizontal'; // Stack direction
  align?: 'start' | 'center' | 'end' | 'stretch'; // Cross-axis alignment
  gap?: Measurement;                    // Spacing between children
  children: LayoutNodeOptions[];        // Ordered child nodes
}
```
- Children arranged sequentially
- `auto` sizing distributes remaining space equally among auto-sized children
- `align` controls cross-axis positioning (perpendicular to stack direction)
- `gap` applies between children (not at edges)

### Leaf Node
```typescript
{
  type: 'leaf';
}
```
- Terminal nodes with no children
- Used for actual content placement

## Layout Class API

### Constructor
```typescript
constructor(options?: Partial<LayoutOptions>)
```
- `options.root`: Root node configuration
- Default: `{ root: { id: 'default', type: 'leaf' } }`

### Methods

#### `update(size: vec2, offset?: vec2): void`
Calculates layout based on viewport size and optional offset.
- `size`: Canvas/viewport dimensions `{ x: number, y: number }`
- `offset`: Optional position offset (default: `{ x: 0, y: 0 }`)
- Caches results; recalculates only if dirty or parameters change
- Must be called before `get()` to obtain calculated positions

#### `get(id: string): CalculatedNode | null`
Retrieves calculated node data by ID.
- Returns `null` if node doesn't exist or hasn't been calculated
- Must call `update()` first

#### `setVisibility(id: string, visible?: boolean): void`
Sets visibility state for node and all descendants.
- `visible`: `true` (visible), `false` (hidden), `undefined` (toggle)
- Affects rendering but not layout calculations
- Recursive: applies to all children

#### `setActivated(id: string, activated?: boolean): void`
Sets activation state for node and all descendants.
- `activated`: `true` (active), `false` (inactive), `undefined` (toggle)
- Deactivated nodes excluded from layout calculations
- Marks layout as dirty (forces recalculation)
- Recursive: applies to all children

#### `hasNode(id: string): boolean`
Checks if node exists in layout.

#### `getNodeIds(): string[]`
Returns all node IDs in layout.

#### `clearCache(): void`
Clears calculation cache and marks layout dirty.
- Use for debugging or memory management

#### `getCacheStats(): { size: number; dirty: boolean }`
Returns cache statistics.
- `size`: Number of cached calculations
- `dirty`: Whether recalculation needed

## CalculatedNode Structure

Result of layout calculation for a node:
```typescript
{
  // Positions (all vec2: {x: number, y: number})
  center: vec2;
  topLeft: vec2;
  topRight: vec2;
  bottomLeft: vec2;
  bottomRight: vec2;
  topCenter: vec2;
  bottomCenter: vec2;
  leftCenter: vec2;
  rightCenter: vec2;

  // Edge coordinates (numbers)
  top: number;
  bottom: number;
  left: number;
  right: number;

  // Dimensions
  width: number;
  height: number;

  // State
  aspectRatio: number;  // Calculated width/height
  activated: boolean;   // Activation state
  visible: boolean;     // Visibility state
}
```

## Measurement Resolution

Measurements resolve relative to parent:
- `'auto'`: Fills available space (or distributes equally in stacks)
- `'100px'`: Absolute pixels
- `'50%'`: Percentage of parent dimension

Size calculation order:
1. Explicit `size` values
2. Aspect ratio calculation (if specified and one dimension set)
3. Min/max constraint application

## Behavior Notes

### Activation vs Visibility
- **Activation**: Excluded from layout calculations entirely; affects space distribution
- **Visibility**: Participates in layout but marked as hidden; doesn't affect space

### Stack Auto-Sizing
- Auto-sized children share remaining space equally after fixed-size children
- Applies to stack direction only (cross-axis uses parent size or explicit size)

### Dock Positioning
- Children positioned relative to anchor points
- Child dimensions calculated before positioning
- Centering adjusts position to align child center with anchor

### Caching
- Cache key includes: size, offset, activation states of all nodes
- Cache invalidated when activation changes or `clearCache()` called
- Visibility changes don't invalidate cache

### Padding
- Applied to node's content area
- Reduces available space for children by `padding * 2`
- Percentage padding calculated from node's own size (not parent)

## Dependencies

Requires `vec2` type and utilities (not defined in this library):
```typescript
vec2: { x: number; y: number }
vec2(): vec2              // Create zero vector
vec2(x, y): vec2          // Create vector
vec2.add(a, b): vec2      // Add vectors
vec2.sub(a, b): vec2      // Subtract vectors
vec2.scale(v, s): vec2    // Scale vector
```

import { vec2 } from '@basementuniverse/vec';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type MeasurementUnit = 'px' | '%';

export type Measurement = 'auto' | `${number}${MeasurementUnit}`;

export type LayoutVec2 = {
  x: Measurement;
  y: Measurement;
};

export type LayoutOptions = {
  root: LayoutNodeOptions;
};

export type LayoutNodeOptions = {
  id: string;
  type: 'dock' | 'stack' | 'leaf';
  offset?: LayoutVec2;
  padding?: LayoutVec2;
  size?: Partial<LayoutVec2>;
  minSize?: Partial<LayoutVec2>;
  maxSize?: Partial<LayoutVec2>;
  aspectRatio?: number;
  visible?: boolean;
} & (DockLayoutNodeOptions | StackLayoutNodeOptions | LeafLayoutNodeOptions);

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

type StackLayoutNodeOptions = {
  type: 'stack';
  direction: 'vertical' | 'horizontal';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: Measurement;
  children: LayoutNodeOptions[];
};

type LeafLayoutNodeOptions = {
  type: 'leaf';
};

export type CalculatedNode = {
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

// -----------------------------------------------------------------------------
// Classes
// -----------------------------------------------------------------------------

export class Layout {
  private static readonly DEFAULT_OPTIONS: LayoutOptions = {
    root: {
      id: 'default',
      type: 'leaf',
    },
  };

  private root: LayoutNode;
  private nodes: Map<string, LayoutNode> = new Map();
  private calculatedNodes: Map<string, CalculatedNode> = new Map();

  private dirty: boolean = true;
  private cache: Map<string, Map<string, CalculatedNode>> = new Map();

  public constructor(options: Partial<LayoutOptions> = {}) {
    const actualOptions: LayoutOptions = Object.assign(
      {},
      Layout.DEFAULT_OPTIONS,
      options
    );
    this.root = nodeFactory(actualOptions.root, this);
    this.registerNode(this.root);
  }

  public registerNode(node: LayoutNode): void {
    this.nodes.set(node.options.id, node);
  }

  private generateCacheKey(size: vec2, offset: vec2): string {
    // Create a compact representation of size and offset
    const sizeOffset = `${size.x},${size.y},${offset.x},${offset.y}`;

    // Create a compact representation of node activation states
    const nodeStates: string[] = [];
    for (const [id, node] of this.nodes) {
      if (!node.isActivated()) {
        nodeStates.push(id);
      }
    }

    // Sort to ensure consistent cache keys regardless of iteration order
    nodeStates.sort();
    const activationState = nodeStates.join('|');

    return `${sizeOffset}:${activationState}`;
  }

  private parseMeasurement(
    measurement: Measurement,
    parentSize: number
  ): number {
    if (measurement === 'auto') {
      return parentSize;
    }

    if (measurement.endsWith('%')) {
      const percentage = parseFloat(measurement.slice(0, -1));
      return (percentage / 100) * parentSize;
    }

    if (measurement.endsWith('px')) {
      return parseFloat(measurement.slice(0, -2));
    }

    throw new Error(`Invalid measurement: ${measurement}`);
  }

  private calculateNodeSize(
    node: LayoutNode,
    parentSize: vec2,
    availableSize?: vec2
  ): vec2 {
    const options = node.options;
    let width: number;
    let height: number;

    const targetSize = availableSize || parentSize;

    // Handle size specification
    if (options.size?.x !== undefined) {
      width = this.parseMeasurement(options.size.x, targetSize.x);
    } else {
      width = targetSize.x; // Default to 100%
    }

    if (options.size?.y !== undefined) {
      height = this.parseMeasurement(options.size.y, targetSize.y);
    } else {
      height = targetSize.y; // Default to 100%
    }

    // Handle aspect ratio
    if (options.aspectRatio !== undefined) {
      if (options.size?.x !== undefined && options.size?.y === undefined) {
        height = width / options.aspectRatio;
      } else if (
        options.size?.y !== undefined &&
        options.size?.x === undefined
      ) {
        width = height * options.aspectRatio;
      } else if (
        options.size?.x === undefined &&
        options.size?.y === undefined
      ) {
        // Default to width = 100%, calculate height from aspect ratio
        width = targetSize.x;
        height = width / options.aspectRatio;
      }
    }

    // Apply min/max constraints
    if (options.minSize?.x !== undefined) {
      const minWidth = this.parseMeasurement(options.minSize.x, targetSize.x);
      width = Math.max(width, minWidth);
    }
    if (options.minSize?.y !== undefined) {
      const minHeight = this.parseMeasurement(options.minSize.y, targetSize.y);
      height = Math.max(height, minHeight);
    }
    if (options.maxSize?.x !== undefined) {
      const maxWidth = this.parseMeasurement(options.maxSize.x, targetSize.x);
      width = Math.min(width, maxWidth);
    }
    if (options.maxSize?.y !== undefined) {
      const maxHeight = this.parseMeasurement(options.maxSize.y, targetSize.y);
      height = Math.min(height, maxHeight);
    }

    return vec2(width, height);
  }

  private calculateNodeOffset(node: LayoutNode, parentSize: vec2): vec2 {
    if (!node.options.offset) {
      return vec2();
    }

    return vec2(
      this.parseMeasurement(node.options.offset.x, parentSize.x),
      this.parseMeasurement(node.options.offset.y, parentSize.y)
    );
  }

  private calculateNodePadding(node: LayoutNode, nodeSize: vec2): vec2 {
    if (!node.options.padding) {
      return vec2();
    }

    return vec2(
      this.parseMeasurement(node.options.padding.x, nodeSize.x),
      this.parseMeasurement(node.options.padding.y, nodeSize.y)
    );
  }

  public update(size: vec2, offset: vec2 = vec2()): void {
    const cacheKey = this.generateCacheKey(size, offset);

    // Check if we have a cached result for these parameters
    if (!this.dirty && this.cache.has(cacheKey)) {
      this.calculatedNodes = new Map(this.cache.get(cacheKey)!);
      return;
    }

    // Calculate the layout
    this.calculatedNodes.clear();
    this.calculateNode(this.root, size, offset, size);

    // Store the result in cache
    this.cache.set(cacheKey, new Map(this.calculatedNodes));
    this.dirty = false;
  }

  private calculateNode(
    node: LayoutNode,
    parentSize: vec2,
    position: vec2,
    rootSize: vec2
  ): void {
    if (!node.isActivated()) {
      return; // Skip deactivated nodes
    }

    const nodeSize = this.calculateNodeSize(node, parentSize);
    const nodeOffset = this.calculateNodeOffset(node, parentSize);
    const actualPosition = vec2.add(position, nodeOffset);
    const padding = this.calculateNodePadding(node, nodeSize);

    // Calculate all the CalculatedNode properties
    const calculated: CalculatedNode = {
      center: vec2.add(actualPosition, vec2.scale(nodeSize, 0.5)),
      topLeft: actualPosition,
      topRight: vec2.add(actualPosition, vec2(nodeSize.x, 0)),
      bottomLeft: vec2.add(actualPosition, vec2(0, nodeSize.y)),
      bottomRight: vec2.add(actualPosition, nodeSize),
      topCenter: vec2.add(actualPosition, vec2(nodeSize.x * 0.5, 0)),
      bottomCenter: vec2.add(
        actualPosition,
        vec2(nodeSize.x * 0.5, nodeSize.y)
      ),
      leftCenter: vec2.add(actualPosition, vec2(0, nodeSize.y * 0.5)),
      rightCenter: vec2.add(actualPosition, vec2(nodeSize.x, nodeSize.y * 0.5)),
      top: actualPosition.y,
      bottom: actualPosition.y + nodeSize.y,
      left: actualPosition.x,
      right: actualPosition.x + nodeSize.x,
      width: nodeSize.x,
      height: nodeSize.y,
      aspectRatio: nodeSize.x / nodeSize.y,
      activated: node.isActivated(),
      visible: node.isVisible(),
    };

    this.calculatedNodes.set(node.options.id, calculated);

    // Calculate children based on node type
    this.calculateChildren(node, nodeSize, actualPosition, padding, rootSize);
  }

  private calculateNodeWithSize(
    node: LayoutNode,
    parentSize: vec2,
    position: vec2,
    rootSize: vec2,
    preCalculatedSize: vec2
  ): void {
    if (!node.isActivated()) {
      return; // Skip deactivated nodes
    }

    const nodeOffset = this.calculateNodeOffset(node, parentSize);
    const actualPosition = vec2.add(position, nodeOffset);
    const padding = this.calculateNodePadding(node, preCalculatedSize);

    // Calculate all the CalculatedNode properties using the pre-calculated size
    const calculated: CalculatedNode = {
      center: vec2.add(actualPosition, vec2.scale(preCalculatedSize, 0.5)),
      topLeft: actualPosition,
      topRight: vec2.add(actualPosition, vec2(preCalculatedSize.x, 0)),
      bottomLeft: vec2.add(actualPosition, vec2(0, preCalculatedSize.y)),
      bottomRight: vec2.add(actualPosition, preCalculatedSize),
      topCenter: vec2.add(actualPosition, vec2(preCalculatedSize.x * 0.5, 0)),
      bottomCenter: vec2.add(
        actualPosition,
        vec2(preCalculatedSize.x * 0.5, preCalculatedSize.y)
      ),
      leftCenter: vec2.add(actualPosition, vec2(0, preCalculatedSize.y * 0.5)),
      rightCenter: vec2.add(
        actualPosition,
        vec2(preCalculatedSize.x, preCalculatedSize.y * 0.5)
      ),
      top: actualPosition.y,
      bottom: actualPosition.y + preCalculatedSize.y,
      left: actualPosition.x,
      right: actualPosition.x + preCalculatedSize.x,
      width: preCalculatedSize.x,
      height: preCalculatedSize.y,
      aspectRatio: preCalculatedSize.x / preCalculatedSize.y,
      activated: node.isActivated(),
      visible: node.isVisible(),
    };

    this.calculatedNodes.set(node.options.id, calculated);

    // Calculate children based on node type
    this.calculateChildren(
      node,
      preCalculatedSize,
      actualPosition,
      padding,
      rootSize
    );
  }

  private calculateChildren(
    node: LayoutNode,
    nodeSize: vec2,
    position: vec2,
    padding: vec2,
    rootSize: vec2
  ): void {
    const contentSize = vec2.sub(nodeSize, vec2.scale(padding, 2));
    const contentPosition = vec2.add(position, padding);

    switch (node.options.type) {
      case 'dock':
        this.calculateDockChildren(
          node,
          contentSize,
          contentPosition,
          rootSize
        );
        break;
      case 'stack':
        this.calculateStackChildren(
          node,
          contentSize,
          contentPosition,
          rootSize
        );
        break;
      case 'leaf':
        // Leaf nodes have no children
        break;
    }
  }

  private calculateDockChildren(
    node: LayoutNode,
    size: vec2,
    position: vec2,
    rootSize: vec2
  ): void {
    const dockOptions = node.options as DockLayoutNodeOptions;
    const children = node.getChildren();

    // Map positions to their corresponding child nodes
    const positionMap = new Map<string, LayoutNode>();
    const positions = [
      'topLeft',
      'topCenter',
      'topRight',
      'leftCenter',
      'center',
      'rightCenter',
      'bottomLeft',
      'bottomCenter',
      'bottomRight',
    ] as const;

    let childIndex = 0;
    for (const pos of positions) {
      if (dockOptions[pos] && childIndex < children.length) {
        positionMap.set(pos, children[childIndex]);
        childIndex++;
      }
    }

    // Calculate positions for each dock position
    const dockPositions = {
      topLeft: position,
      topCenter: vec2.add(position, vec2(size.x * 0.5, 0)),
      topRight: vec2.add(position, vec2(size.x, 0)),
      leftCenter: vec2.add(position, vec2(0, size.y * 0.5)),
      center: vec2.add(position, vec2.scale(size, 0.5)),
      rightCenter: vec2.add(position, vec2(size.x, size.y * 0.5)),
      bottomLeft: vec2.add(position, vec2(0, size.y)),
      bottomCenter: vec2.add(position, vec2(size.x * 0.5, size.y)),
      bottomRight: vec2.add(position, size),
    };

    // Calculate each positioned child
    for (const [pos, child] of positionMap) {
      const anchorPoint = dockPositions[pos as keyof typeof dockPositions];
      const childSize = this.calculateNodeSize(child, size);

      // Calculate the top-left position based on the anchor point and position
      let childPosition: vec2;
      switch (pos) {
        case 'topLeft':
          // Anchor at top-left, so position is already correct
          childPosition = anchorPoint;
          break;
        case 'topCenter':
          // Anchor at top-center, so offset by half width to the left
          childPosition = vec2.sub(anchorPoint, vec2(childSize.x * 0.5, 0));
          break;
        case 'topRight':
          // Anchor at top-right, so offset by full width to the left
          childPosition = vec2.sub(anchorPoint, vec2(childSize.x, 0));
          break;
        case 'leftCenter':
          // Anchor at left-center, so offset by half height upward
          childPosition = vec2.sub(anchorPoint, vec2(0, childSize.y * 0.5));
          break;
        case 'center':
          // Anchor at center, so offset by half width and half height
          childPosition = vec2.sub(anchorPoint, vec2.scale(childSize, 0.5));
          break;
        case 'rightCenter':
          // Anchor at right-center, so offset by full width to the left and
          // half height upward
          childPosition = vec2.sub(
            anchorPoint,
            vec2(childSize.x, childSize.y * 0.5)
          );
          break;
        case 'bottomLeft':
          // Anchor at bottom-left, so offset by full height upward
          childPosition = vec2.sub(anchorPoint, vec2(0, childSize.y));
          break;
        case 'bottomCenter':
          // Anchor at bottom-center, so offset by half width to the left and
          // full height upward
          childPosition = vec2.sub(
            anchorPoint,
            vec2(childSize.x * 0.5, childSize.y)
          );
          break;
        case 'bottomRight':
          // Anchor at bottom-right, so offset by full width and height
          childPosition = vec2.sub(anchorPoint, childSize);
          break;
        default:
          childPosition = anchorPoint;
          break;
      }

      this.calculateNode(child, size, childPosition, rootSize);
    }
  }

  private calculateStackChildren(
    node: LayoutNode,
    size: vec2,
    position: vec2,
    rootSize: vec2
  ): void {
    const stackOptions = node.options as StackLayoutNodeOptions;
    const children = node.getChildren().filter(child => child.isActivated());

    if (children.length === 0) return;

    const isVertical = stackOptions.direction === 'vertical';
    const gap = stackOptions.gap
      ? this.parseMeasurement(stackOptions.gap, isVertical ? size.y : size.x)
      : 0;

    const totalGap = gap * (children.length - 1);
    const availableSize = isVertical
      ? vec2(size.x, size.y - totalGap)
      : vec2(size.x - totalGap, size.y);

    // Calculate sizes for all children, handling 'auto' correctly for stack
    // layouts
    const childSizes = this.calculateStackChildSizes(
      children,
      size,
      availableSize,
      isVertical
    );

    let currentOffset = 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childSize = childSizes[i];

      // Position child based on stack direction and alignment
      let childPosition: vec2;

      if (isVertical) {
        let x = position.x;

        // Apply horizontal alignment
        switch (stackOptions.align) {
          case 'center':
            x = position.x + (size.x - childSize.x) * 0.5;
            break;
          case 'end':
            x = position.x + size.x - childSize.x;
            break;
          case 'stretch':
            // For stretch, we override the child size
            childSize.x = size.x;
            break;
          // 'start' is default (x = position.x)
        }

        childPosition = vec2(x, position.y + currentOffset);
        currentOffset += childSize.y + gap;
      } else {
        let y = position.y;

        // Apply vertical alignment
        switch (stackOptions.align) {
          case 'center':
            y = position.y + (size.y - childSize.y) * 0.5;
            break;
          case 'end':
            y = position.y + size.y - childSize.y;
            break;
          case 'stretch':
            // For stretch, we override the child size
            childSize.y = size.y;
            break;
          // 'start' is default (y = position.y)
        }

        childPosition = vec2(position.x + currentOffset, y);
        currentOffset += childSize.x + gap;
      }

      this.calculateNodeWithSize(
        child,
        size,
        childPosition,
        rootSize,
        childSize
      );
    }
  }

  private calculateStackChildSizes(
    children: LayoutNode[],
    size: vec2,
    availableSize: vec2,
    isVertical: boolean
  ): vec2[] {
    const childSizes: vec2[] = [];
    const autoChildren: number[] = [];
    let usedSpace = 0;

    // First pass: calculate sizes for non-auto children and track auto children
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const options = child.options;

      const relevantSizeProperty = isVertical
        ? options.size?.y
        : options.size?.x;
      const isAutoSized =
        relevantSizeProperty === undefined || relevantSizeProperty === 'auto';

      if (isAutoSized) {
        // Mark as auto-sized for second pass
        autoChildren.push(i);
        // Placeholder size, will be calculated in second pass
        childSizes.push(vec2(0, 0));
      } else {
        // Calculate size normally for non-auto children
        const childSize = this.calculateNodeSize(child, size, availableSize);
        childSizes.push(childSize);

        // Track used space in the stack direction
        usedSpace += isVertical ? childSize.y : childSize.x;
      }
    }

    // Second pass: distribute remaining space among auto children
    if (autoChildren.length > 0) {
      const remainingSpace =
        (isVertical ? availableSize.y : availableSize.x) - usedSpace;
      const autoSize = Math.max(0, remainingSpace / autoChildren.length);

      for (const childIndex of autoChildren) {
        const child = children[childIndex];

        if (isVertical) {
          // For vertical stacks, auto applies to height, width uses normal
          // calculation
          const width =
            child.options.size?.x !== undefined
              ? this.parseMeasurement(child.options.size.x, size.x)
              : size.x;
          childSizes[childIndex] = vec2(width, autoSize);
        } else {
          // For horizontal stacks, auto applies to width, height uses normal
          // calculation
          const height =
            child.options.size?.y !== undefined
              ? this.parseMeasurement(child.options.size.y, size.y)
              : size.y;
          childSizes[childIndex] = vec2(autoSize, height);
        }

        // Apply min/max constraints to the auto-sized dimension
        const finalSize = childSizes[childIndex];
        const options = child.options;

        if (isVertical) {
          if (options.minSize?.y !== undefined) {
            const minHeight = this.parseMeasurement(options.minSize.y, size.y);
            finalSize.y = Math.max(finalSize.y, minHeight);
          }
          if (options.maxSize?.y !== undefined) {
            const maxHeight = this.parseMeasurement(options.maxSize.y, size.y);
            finalSize.y = Math.min(finalSize.y, maxHeight);
          }
        } else {
          if (options.minSize?.x !== undefined) {
            const minWidth = this.parseMeasurement(options.minSize.x, size.x);
            finalSize.x = Math.max(finalSize.x, minWidth);
          }
          if (options.maxSize?.x !== undefined) {
            const maxWidth = this.parseMeasurement(options.maxSize.x, size.x);
            finalSize.x = Math.min(finalSize.x, maxWidth);
          }
        }
      }
    }

    return childSizes;
  }

  public get(id: string): CalculatedNode | null {
    return this.calculatedNodes.get(id) || null;
  }

  public setVisibility(id: string, visible?: boolean): void {
    const node = this.nodes.get(id);
    if (!node) return;

    this.setNodeVisibility(
      node,
      visible === undefined ? !node.isVisible() : visible
    );
  }

  private setNodeVisibility(node: LayoutNode, visible: boolean): void {
    node.setVisibility(visible);

    // Apply to all children recursively
    for (const child of node.getChildren()) {
      this.setNodeVisibility(child, visible);
    }
  }

  public setActivated(id: string, activated?: boolean): void {
    const node = this.nodes.get(id);
    if (!node) return;

    this.setNodeActivated(
      node,
      activated === undefined ? !node.isActivated() : activated
    );
    this.dirty = true;
  }

  private setNodeActivated(node: LayoutNode, activated: boolean): void {
    node.setActivated(activated);

    // Apply to all children recursively
    for (const child of node.getChildren()) {
      this.setNodeActivated(child, activated);
    }
  }

  /**
   * Get all node IDs in the layout
   */
  public getNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Check if a node exists in the layout
   */
  public hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Clear the layout cache and mark as dirty
   * Useful for debugging or when memory usage becomes a concern
   */
  public clearCache(): void {
    this.cache.clear();
    this.dirty = true;
  }

  /**
   * Get cache statistics for debugging/monitoring
   */
  public getCacheStats(): { size: number; dirty: boolean } {
    return {
      size: this.cache.size,
      dirty: this.dirty,
    };
  }
}

abstract class LayoutNode {
  protected layout: Layout;
  protected children: LayoutNode[] = [];
  protected visible: boolean = true;
  protected activated: boolean = true;

  public constructor(public options: LayoutNodeOptions, layout: Layout) {
    this.layout = layout;
    this.visible = options.visible ?? true;
    this.initializeChildren();
  }

  protected abstract initializeChildren(): void;

  public setVisibility(visible: boolean): void {
    this.visible = visible;
  }

  public setActivated(activated: boolean): void {
    this.activated = activated;
  }

  public getChildren(): LayoutNode[] {
    return this.children;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isActivated(): boolean {
    return this.activated;
  }
}

class DockLayoutNode extends LayoutNode {
  public constructor(options: LayoutNodeOptions, layout: Layout) {
    super(options, layout);
  }

  protected override initializeChildren(): void {
    const dockOptions = this.options as DockLayoutNodeOptions;
    const positions = [
      'topLeft',
      'topCenter',
      'topRight',
      'leftCenter',
      'center',
      'rightCenter',
      'bottomLeft',
      'bottomCenter',
      'bottomRight',
    ] as const;

    for (const position of positions) {
      const childOptions = dockOptions[position];
      if (childOptions) {
        const child = nodeFactory(childOptions, this.layout);
        this.children.push(child);
        this.layout.registerNode(child);
      }
    }
  }
}

class StackLayoutNode extends LayoutNode {
  public constructor(options: LayoutNodeOptions, layout: Layout) {
    super(options, layout);
  }

  protected override initializeChildren(): void {
    const stackOptions = this.options as StackLayoutNodeOptions;

    for (const childOptions of stackOptions.children) {
      const child = nodeFactory(childOptions, this.layout);
      this.children.push(child);
      this.layout.registerNode(child);
    }
  }
}

class LeafLayoutNode extends LayoutNode {
  public constructor(options: LayoutNodeOptions, layout: Layout) {
    super(options, layout);
  }

  protected override initializeChildren(): void {
    // Leaf nodes have no children
  }
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

function nodeFactory(options: LayoutNodeOptions, layout: Layout): LayoutNode {
  switch (options.type) {
    case 'dock':
      return new DockLayoutNode(options, layout);
    case 'stack':
      return new StackLayoutNode(options, layout);
    case 'leaf':
      return new LeafLayoutNode(options, layout);
    default:
      throw new Error(`Unknown node type: ${(options as any).type}`);
  }
}

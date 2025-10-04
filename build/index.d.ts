import { vec2 } from '@basementuniverse/vec';
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
    center: vec2;
    topLeft: vec2;
    topRight: vec2;
    bottomLeft: vec2;
    bottomRight: vec2;
    topCenter: vec2;
    bottomCenter: vec2;
    leftCenter: vec2;
    rightCenter: vec2;
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
    aspectRatio: number;
    activated: boolean;
    visible: boolean;
};
export declare class Layout {
    private static readonly DEFAULT_OPTIONS;
    private root;
    private nodes;
    private calculatedNodes;
    private dirty;
    private cache;
    constructor(options?: Partial<LayoutOptions>);
    registerNode(node: LayoutNode): void;
    private generateCacheKey;
    private parseMeasurement;
    private calculateNodeSize;
    private calculateNodeOffset;
    private calculateNodePadding;
    update(size: vec2, offset?: vec2): void;
    private calculateNode;
    private calculateNodeWithSize;
    private calculateChildren;
    private calculateDockChildren;
    private calculateStackChildren;
    private calculateStackChildSizes;
    get(id: string): CalculatedNode | null;
    setVisibility(id: string, visible?: boolean): void;
    private setNodeVisibility;
    setActivated(id: string, activated?: boolean): void;
    private setNodeActivated;
    /**
     * Get all node IDs in the layout
     */
    getNodeIds(): string[];
    /**
     * Check if a node exists in the layout
     */
    hasNode(id: string): boolean;
    /**
     * Clear the layout cache and mark as dirty
     * Useful for debugging or when memory usage becomes a concern
     */
    clearCache(): void;
    /**
     * Get cache statistics for debugging/monitoring
     */
    getCacheStats(): {
        size: number;
        dirty: boolean;
    };
}
declare abstract class LayoutNode {
    options: LayoutNodeOptions;
    protected layout: Layout;
    protected children: LayoutNode[];
    protected visible: boolean;
    protected activated: boolean;
    constructor(options: LayoutNodeOptions, layout: Layout);
    protected abstract initializeChildren(): void;
    setVisibility(visible: boolean): void;
    setActivated(activated: boolean): void;
    getChildren(): LayoutNode[];
    isVisible(): boolean;
    isActivated(): boolean;
}
export {};

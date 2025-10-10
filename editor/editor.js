// Layout Editor

// -----------------------------------------------------------------------------
// Globals and editor state
// -----------------------------------------------------------------------------

const EDITOR_MARGIN = 20;

const CANVAS_STYLES = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    grid: {
      strokeColor: '#00000033',
      strokeWidth: 1,
      lineStyle: 'dotted',
    },
    node: {
      fill: false,
      stroke: true,
      strokeColor: '#00000077',
      strokeWidth: 2,
      lineStyle: 'solid',
      rounded: true,
      borderRadius: 6,
    },
    selectedNode: {
      fill: true,
      fillColor: '#0078d422',
      stroke: true,
      strokeColor: '#0078d4cc',
      strokeWidth: 2,
      lineStyle: 'solid',
      rounded: true,
      borderRadius: 6,
    },
    selectedNodeLabel: {
      foregroundColour: '#222222',
      backgroundColour: '#22222222',
    },
    selectedNodeCenterMarker: {
      markerColour: '#0078d4',
      markerStyle: '+',
      markerSize: 8,
    },
  },
  dark: {
    background: '#000000',
    foreground: '#ffffff',
    grid: {
      strokeColor: '#ffffff33',
      strokeWidth: 1,
      lineStyle: 'dotted',
    },
    node: {
      fill: false,
      stroke: true,
      strokeColor: '#ffffff77',
      strokeWidth: 2,
      lineStyle: 'solid',
      rounded: true,
      borderRadius: 6,
    },
    selectedNode: {
      fill: true,
      fillColor: '#0078d422',
      stroke: true,
      strokeColor: '#0078d4cc',
      strokeWidth: 2,
      lineStyle: 'solid',
      rounded: true,
      borderRadius: 6,
    },
    selectedNodeLabel: {
      foregroundColour: '#ffffff',
      backgroundColour: '#ffffff22',
    },
    selectedNodeCenterMarker: {
      markerColour: '#0078d4',
      markerStyle: '+',
      markerSize: 8,
    },
  },
};

const editorState = {
  theme: 'dark',
  dirty: false,
  layout: null,
  selectedNodeId: null,
  layoutName: '',
  layoutDefinition: null,
  canvasSize: { x: 0, y: 0 },
  mousePosition: { x: 0, y: 0 },
  showGrid: true,
};

// Layout library
let Layout;

// Debug library
let Debug;

// Canvas-helpers library
let drawGrid, drawRectangle;

// DOM elements
// Main sections
let app, tree, content, properties;

// Canvas
let canvas, context;

// Toolbar buttons
let gridToolbarButton, deleteToolbarButton, themeSwitch;

// Data views
let treeView, propertyEditor;

// Status bar
let statusBar, mouseStatusBarItem, selectedStatusBarItem;

// Context menu items
let contextMenuItems;

// Prompts and dialogs
let namePrompt;

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initializeEditor();
});

function initializeEditor() {
  console.log('Initializing Layout Editor...');

  // Check if Layout library is available
  Layout = window.Layout;
  if (!Layout) {
    console.error(
      'Layout library not found! Make sure build/index.js is loaded.'
    );
    return;
  }

  // Setup canvas
  canvas = document.getElementById('editor-canvas');
  context = canvas.getContext('2d');

  if (!canvas || !context) {
    console.error('Canvas element not found!');
    return;
  }

  // Get canvas-helpers with context attached
  [drawGrid, drawRectangle] = withContext(context, grid, rectangle);

  // Get DOM elements
  app = document.querySelector('e2-app');
  tree = document.querySelector('aside.tree');
  content = document.querySelector('section.content');
  properties = document.querySelector('aside.properties');
  treeView = document.getElementById('node-tree');
  propertyEditor = document.getElementById('node-editor');
  gridToolbarButton = document.getElementById('grid-toolbar-button');
  deleteToolbarButton = document.getElementById('delete-toolbar-button');
  themeSwitch = document.querySelector('.theme-switch input');
  statusBar = document.getElementById('status-bar');
  mouseStatusBarItem = document.getElementById('mouse-status');
  selectedStatusBarItem = document.getElementById('selected-status');
  namePrompt = document.getElementById('name-prompt');
  contextMenuItems = [
    document.getElementById('new-dock-node-context-menu-item'),
    document.getElementById('new-stack-node-context-menu-item'),
    document.getElementById('new-leaf-node-context-menu-item'),
    document.getElementById('delete-node-context-menu-item'),
  ];

  // Set everything up
  Debug = window.default;
  Debug.initialise();
  setupCanvas();
  startRenderLoop();
  setupEventListeners();
  updateUIElementStates();
  gridToolbarButton.toggleAttribute('active', editorState.showGrid);
  themeSwitch.checked = editorState.theme === 'dark';
  app.setAttribute('theme', editorState.theme);

  // Load the default layout initially
  loadLayout(getDefaultLayoutDefinition());

  console.log('Layout Editor initialized successfully');
}

function setupCanvas() {
  // Resize handler
  function resizeCanvas() {
    const rect = content.getBoundingClientRect();
    canvas.width = Math.floor(rect.width) - EDITOR_MARGIN * 2;
    canvas.height = Math.floor(rect.height) - EDITOR_MARGIN * 2;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.style.top = `${EDITOR_MARGIN}px`;
    canvas.style.left = `${EDITOR_MARGIN}px`;
    editorState.canvasSize.x = canvas.width;
    editorState.canvasSize.y = canvas.height;

    // Update layout if it exists
    if (editorState.layout) {
      editorState.layout.update(editorState.canvasSize);
    }
  }

  // Handle window resize and do initial resize
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Handle canvas resize observer for more responsive updates
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(tree);
    resizeObserver.observe(content);
    resizeObserver.observe(properties);
  }
}

function setupEventListeners() {
  // Theme switch toggle
  themeSwitch.addEventListener('change', e => {
    if (e.target.checked) {
      editorState.theme = 'dark';
    } else {
      editorState.theme = 'light';
    }
    app.setAttribute('theme', editorState.theme);
  });

  // Mouse movement tracking
  content.addEventListener('mousemove', e => {
    const rect = content.getBoundingClientRect();
    editorState.mousePosition = {
      x: Math.round(e.clientX - rect.left) - EDITOR_MARGIN,
      y: Math.round(e.clientY - rect.top) - EDITOR_MARGIN,
    };
    updateStatusBar();
  });

  // Content area click for selection
  content.addEventListener('click', e => {
    handleContentAreaClick(
      editorState.mousePosition.x,
      editorState.mousePosition.y
    );
  });

  // Toolbar button events
  document.addEventListener('toolbar-button-click', async e => {
    await handleToolbarAction(e.detail.button.getAttribute('label'));
  });

  // Context menu events
  document.addEventListener('context-menu-item-click', e => {
    handleContextMenuAction(e.detail.value);
  });

  // Tree view selection events
  document.addEventListener('tree-selection-change', e => {
    handleTreeSelection(e);
  });
}

// Get a default layout definition
const getDefaultLayoutDefinition = () => ({
  root: {
    id: 'default',
    type: 'leaf',
  },
});

// Export for debugging
window.LayoutEditor = {
  editorState,
};

// -----------------------------------------------------------------------------
// Event handlers
// -----------------------------------------------------------------------------

async function handleToolbarAction(action) {
  console.log('Toolbar action:', action);
  switch (action) {
    case 'New':
      loadLayout(getDefaultLayoutDefinition());
      break;
    case 'Open':
      openLayout();
      break;
    case 'Save':
      await saveLayout();
      break;
    case 'Dock':
    case 'Stack':
    case 'Leaf':
      console.log(`TODO: Add ${action.toLowerCase()} node`);
      break;
    case 'Delete':
      console.log('TODO: Delete selected node');
      break;
    case 'Grid':
      editorState.showGrid = !editorState.showGrid;
      gridToolbarButton.toggleAttribute('active', editorState.showGrid);
      break;
    default:
      console.log('Unknown toolbar action:', action);
  }
}

function handleContextMenuAction(action) {
  console.log('Context menu action:', action);
  switch (action) {
    case 'dock':
    case 'stack':
    case 'leaf':
      console.log(`TODO: Add ${action} node`);
      break;
    case 'delete':
      console.log('TODO: Delete node');
      break;
    default:
      console.log('Unknown context menu action:', action);
  }
}

function handleContentAreaClick(x, y) {
  if (!editorState.layout) return;

  // Find the node at the clicked position
  const clickedNodeId = findNodeAtPosition(x, y);
  if (clickedNodeId) {
    console.log('Node selected:', clickedNodeId);

    // Update selection
    editorState.selectedNodeId = clickedNodeId;

    // Sync with tree view selection
    syncTreeViewSelection(clickedNodeId);

    // Update property editor
    updatePropertyEditor();

    // Update status bar
    updateStatusBar();

    // Update toolbar and context menu states
    updateUIElementStates();
  } else {
    // Clear selection
    editorState.selectedNodeId = null;

    // Clear tree view selection
    if (treeView) {
      treeView.clearSelection();
    }

    // Update property editor
    updatePropertyEditor();

    // Update status bar
    updateStatusBar();

    // Update toolbar and context menu states
    updateUIElementStates();
  }
}

function handleTreeSelection(event) {
  console.log('Tree selection changed:', event.detail);

  const { selectedItems } = event.detail;
  if (selectedItems && selectedItems.length > 0) {
    // Get the first selected item
    const selectedItem = selectedItems[0];
    const nodeId = selectedItem.id;
    console.log('Selected node:', nodeId);

    // Update editor state
    editorState.selectedNodeId = nodeId;

    // Update property editor
    updatePropertyEditor();

    // Update status bar
    updateStatusBar();

    // Update toolbar and context menu states
    updateUIElementStates();
  } else {
    // No selection
    editorState.selectedNodeId = null;
    updatePropertyEditor();
    updateStatusBar();
    updateUIElementStates();
  }
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

function startRenderLoop() {
  function render() {
    drawCanvas();
    requestAnimationFrame(render);
  }

  // Initial render
  render();
}

function drawCanvas() {
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!editorState.layout) {
    context.fillStyle = '#666';
    context.font = '16px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('No layout loaded', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Grid
  if (editorState.showGrid) {
    drawGrid(
      { x: 0, y: 0 },
      { x: canvas.width, y: canvas.height },
      {
        stroke: true,
        ...CANVAS_STYLES[editorState.theme].grid,
        grid: {
          cellSize: 20,
        },
      }
    );
  }

  // Draw layout nodes
  drawLayoutNodes();
  Debug.draw(context);
}

function drawLayoutNodes() {
  if (!editorState.layout) return;

  const nodeIds = editorState.layout.getNodeIds();
  nodeIds.forEach(nodeId => {
    const calculatedNode = editorState.layout.get(nodeId);
    if (calculatedNode && calculatedNode.visible) {
      drawNode(calculatedNode, nodeId);
    }
  });
}

function drawNode(calculatedNode, nodeId) {
  drawRectangle(
    { x: calculatedNode.left, y: calculatedNode.top },
    { x: calculatedNode.width, y: calculatedNode.height },
    editorState.selectedNodeId === nodeId
      ? CANVAS_STYLES[editorState.theme].selectedNode
      : CANVAS_STYLES[editorState.theme].node
  );

  if (editorState.selectedNodeId === nodeId) {
    // Draw node ID label
    Debug.marker(
      `${nodeId}-label`,
      nodeId,
      {
        x: calculatedNode.left + 4,
        y: calculatedNode.top + 4,
      },
      {
        showMarker: false,
        showLabel: false,
        ...CANVAS_STYLES[editorState.theme].selectedNodeLabel,
      }
    );

    // Draw center marker
    Debug.marker(`${nodeId}-center`, nodeId, calculatedNode.center, {
      showLabel: false,
      showValue: false,
      ...CANVAS_STYLES[editorState.theme].selectedNodeCenterMarker,
    });
  }
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

function openLayout() {
  // Create a file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  // Handle file selection
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result);
        if (isLayoutData(data)) {
          loadLayout(data);
        }
      } catch (error) {
        console.error('Error importing data:', error);
      }
    };
    reader.readAsText(file);
  });

  // Trigger file selection dialog
  input.click();
}

function loadLayout(layoutDefinition) {
  try {
    console.log('Loading layout:', layoutDefinition);
    editorState.layoutDefinition = layoutDefinition;

    // Create layout instance
    editorState.layout = new Layout(layoutDefinition);
    console.log('Layout instance created:', editorState.layout);

    // Update layout with current canvas size
    if (editorState.canvasSize.x > 0 && editorState.canvasSize.y > 0) {
      editorState.layout.update(editorState.canvasSize);
    }

    // Update tree view
    updateTreeView();

    // Reset selection
    editorState.selectedNodeId = null;
    updatePropertyEditor();
    updateStatusBar();
    updateUIElementStates();

    console.log('Layout loaded successfully');
    console.log('Available nodes:', editorState.layout.getNodeIds());
  } catch (error) {
    console.error('Error loading layout:', error);
  }
}

async function saveLayout() {
  if (!editorState.layoutDefinition) return;

  // Get the layout name if not already set
  if (!editorState.layoutName) {
    editorState.layoutName = await namePrompt.show();
  }

  // Serialize the layout data and create a Blob
  const data = JSON.stringify(editorState.layoutDefinition, null, 2);
  const blob = new Blob([data], { type: 'application/json' });

  // Create a download URL and link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${editorState.layoutName || 'layout'}.json`;

  // Trigger download and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  E2.Toast.success('Layout saved successfully!');
}

function updateStatusBar() {
  if (!statusBar) return;

  // Update mouse position
  if (mouseStatusBarItem) {
    mouseStatusBarItem.setAttribute(
      'value',
      `(${editorState.mousePosition.x}, ${editorState.mousePosition.y})`
    );
  }

  // Update selection info
  if (selectedStatusBarItem) {
    if (editorState.selectedNodeId) {
      // Show selected node info
      const node = editorState.layout?.get(editorState.selectedNodeId);
      if (node) {
        const info = `${editorState.selectedNodeId} (${Math.round(
          node.width
        )}×${Math.round(node.height)})`;
        selectedStatusBarItem.setAttribute('value', info);
      } else {
        selectedStatusBarItem.setAttribute('value', editorState.selectedNodeId);
      }
    } else {
      selectedStatusBarItem.setAttribute('value', 'None');
    }
  }
}

function getNodeType(nodeId) {
  if (!editorState.layoutDefinition) return 'unknown';
  const nodeData = findNodeInDefinition(
    editorState.layoutDefinition.root,
    nodeId
  );
  return nodeData ? nodeData.type : 'unknown';
}

function getNodeTypeIcon(nodeType) {
  switch (nodeType) {
    case 'dock':
      return '🔽';
    case 'stack':
      return '⏸';
    case 'leaf':
      return '⏹';
    default:
      return '?';
  }
}

function updateTreeView() {
  if (!editorState.layout || !treeView) return;

  try {
    // Build tree structure from layout definition
    const treeItems = buildTreeFromLayout(editorState.layoutDefinition.root);

    // Set the tree view items
    treeView.items = [treeItems];
  } catch (error) {
    console.error('Error updating tree view:', error);
  }
}

function buildTreeFromLayout(nodeOptions) {
  const treeItem = {
    id: nodeOptions.id,
    label: `${nodeOptions.id} (${nodeOptions.type})`,
    icon: getNodeTypeIcon(nodeOptions.type),
    data: nodeOptions,
    children: [],
  };

  // Handle different node types and their children
  switch (nodeOptions.type) {
    case 'dock':
      // Dock nodes have positional children
      const dockPositions = [
        'topLeft',
        'topCenter',
        'topRight',
        'leftCenter',
        'center',
        'rightCenter',
        'bottomLeft',
        'bottomCenter',
        'bottomRight',
      ];
      for (const position of dockPositions) {
        if (nodeOptions[position]) {
          const childItem = buildTreeFromLayout(nodeOptions[position]);
          childItem.label = `${position}: ${childItem.label}`;
          treeItem.children.push(childItem);
        }
      }
      break;
    case 'stack':
      // Stack nodes have an array of children
      if (nodeOptions.children && Array.isArray(nodeOptions.children)) {
        for (let i = 0; i < nodeOptions.children.length; i++) {
          const childItem = buildTreeFromLayout(nodeOptions.children[i]);
          childItem.label = `[${i}] ${childItem.label}`;
          treeItem.children.push(childItem);
        }
      }
      break;
    case 'leaf':
      // Leaf nodes have no children
      break;
  }
  return treeItem;
}

function updatePropertyEditor() {
  if (!propertyEditor) return;

  if (!editorState.selectedNodeId || !editorState.layout) {
    // Clear property editor
    propertyEditor.value = {};
    return;
  }

  try {
    // Get node data from layout definition
    const nodeData = findNodeInDefinition(
      editorState.layoutDefinition.root,
      editorState.selectedNodeId
    );
    if (nodeData) {
      // Convert node data to key-value format for the editor
      const properties = {
        id: nodeData.id,
        type: nodeData.type,
        ...(nodeData.size && {
          'size.x': nodeData.size.x || 'auto',
          'size.y': nodeData.size.y || 'auto',
        }),
        ...(nodeData.padding && {
          'padding.x': nodeData.padding.x || '0px',
          'padding.y': nodeData.padding.y || '0px',
        }),
        ...(nodeData.offset && {
          'offset.x': nodeData.offset.x || '0px',
          'offset.y': nodeData.offset.y || '0px',
        }),
        ...(nodeData.minSize && {
          'minSize.x': nodeData.minSize.x,
          'minSize.y': nodeData.minSize.y,
        }),
        ...(nodeData.maxSize && {
          'maxSize.x': nodeData.maxSize.x,
          'maxSize.y': nodeData.maxSize.y,
        }),
        ...(nodeData.aspectRatio !== undefined && {
          aspectRatio: nodeData.aspectRatio,
        }),
        ...(nodeData.visible !== undefined && { visible: nodeData.visible }),

        // Stack-specific properties
        ...(nodeData.direction && { direction: nodeData.direction }),
        ...(nodeData.align && { align: nodeData.align }),
        ...(nodeData.gap && { gap: nodeData.gap }),
      };
      propertyEditor.value = properties;
    }
  } catch (error) {
    console.error('Error updating property editor:', error);
  }
}

function findNodeInDefinition(node, targetId) {
  if (node.id === targetId) {
    return node;
  }

  // Search in children based on node type
  switch (node.type) {
    case 'dock':
      const dockPositions = [
        'topLeft',
        'topCenter',
        'topRight',
        'leftCenter',
        'center',
        'rightCenter',
        'bottomLeft',
        'bottomCenter',
        'bottomRight',
      ];
      for (const position of dockPositions) {
        if (node[position]) {
          const result = findNodeInDefinition(node[position], targetId);
          if (result) return result;
        }
      }
      break;
    case 'stack':
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const result = findNodeInDefinition(child, targetId);
          if (result) return result;
        }
      }
      break;
  }
  return null;
}

function findNodeAtPosition(x, y) {
  if (!editorState.layout) return null;

  const nodeIds = editorState.layout.getNodeIds();

  // Search from smallest to largest nodes (to prioritize child nodes)
  const nodeAreas = nodeIds
    .map(id => {
      const node = editorState.layout.get(id);
      if (!node || !node.visible) return null;
      return {
        id,
        node,
        area: node.width * node.height,
      };
    })
    .filter(item => item !== null);

  // Sort by area (smallest first)
  nodeAreas.sort((a, b) => a.area - b.area);

  // Find the first (smallest) node that contains the point
  for (const { id, node } of nodeAreas) {
    if (
      x >= node.left &&
      x <= node.right &&
      y >= node.top &&
      y <= node.bottom
    ) {
      return id;
    }
  }
  return null;
}

function syncTreeViewSelection(nodeId) {
  if (!treeView || !nodeId) return;

  try {
    // Select the node in the tree view
    treeView.selectItem(nodeId);
  } catch (error) {
    console.error('Error syncing tree view selection:', error);
  }
}

function updateUIElementStates() {
  const hasSelection = !!editorState.selectedNodeId;

  // Update delete toolbar button
  if (deleteToolbarButton) {
    if (hasSelection) {
      deleteToolbarButton.removeAttribute('disabled');
    } else {
      deleteToolbarButton.setAttribute('disabled', '');
    }
  }

  // Update context menu items
  if (contextMenuItems) {
    contextMenuItems.forEach(item => {
      if (item) {
        if (hasSelection) {
          item.removeAttribute('disabled');
        } else {
          item.setAttribute('disabled', '');
        }
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Validators
// -----------------------------------------------------------------------------

function isLayoutData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid layout (not an object)');
  }
  if (!data.root || typeof data.root !== 'object') {
    throw new Error('Invalid layout (no root node)');
  }
  isLayoutNodeData(data.root);
  return true;
}

function isLayoutNodeData(node) {
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid node (not an object)');
  }
  if (!node.id || typeof node.id !== 'string') {
    throw new Error('Invalid node (missing or invalid id)');
  }
  if (!node.type || !['dock', 'stack', 'leaf'].includes(node.type)) {
    throw new Error('Invalid node (missing or invalid type)');
  }
  if (node.offset && !isLayoutVec2(node.offset)) {
    throw new Error('Invalid node (invalid offset)');
  }
  if (node.padding && !isLayoutVec2(node.padding)) {
    throw new Error('Invalid node (invalid padding)');
  }
  if (node.size && !isPartialLayoutVec2(node.size)) {
    throw new Error('Invalid node (invalid size)');
  }
  if (node.minSize && !isPartialLayoutVec2(node.minSize)) {
    throw new Error('Invalid node (invalid minSize)');
  }
  if (node.maxSize && !isPartialLayoutVec2(node.maxSize)) {
    throw new Error('Invalid node (invalid maxSize)');
  }
  if (node.aspectRatio !== undefined && typeof node.aspectRatio !== 'number') {
    throw new Error('Invalid node (invalid aspectRatio)');
  }
  if (node.visible !== undefined && typeof node.visible !== 'boolean') {
    throw new Error('Invalid node (invalid visible)');
  }
  switch (node.type) {
    case 'dock':
      isDockLayoutNodeData(node);
      break;
    case 'stack':
      isStackLayoutNodeData(node);
      break;
    case 'leaf':
      isLeafLayoutNodeData(node);
      break;
    default:
      throw new Error('Invalid node (unknown type)');
  }
  return true;
}

function isDockLayoutNodeData(node) {
  if (node.type !== 'dock') {
    throw new Error('Node is not a dock type');
  }
  const dockPositions = [
    'topLeft',
    'topCenter',
    'topRight',
    'leftCenter',
    'center',
    'rightCenter',
    'bottomLeft',
    'bottomCenter',
    'bottomRight',
  ];
  for (const position of dockPositions) {
    if (node[position] !== undefined) {
      isLayoutNodeData(node[position]);
    }
  }
  return true;
}

function isStackLayoutNodeData(node) {
  if (node.type !== 'stack') {
    throw new Error('Node is not a stack type');
  }
  if (!['vertical', 'horizontal'].includes(node.direction)) {
    throw new Error('Invalid stack node (missing or invalid direction)');
  }
  if (
    node.align &&
    !['start', 'center', 'end', 'stretch'].includes(node.align)
  ) {
    throw new Error('Invalid stack node (invalid align)');
  }
  if (node.gap !== undefined && typeof node.gap !== 'string') {
    throw new Error('Invalid stack node (invalid gap)');
  }
  if (
    !node.children ||
    !Array.isArray(node.children) ||
    node.children.length === 0
  ) {
    throw new Error('Invalid stack node (missing or empty children array)');
  }
  for (const child of node.children) {
    isLayoutNodeData(child);
  }
  return true;
}

function isLeafLayoutNodeData(node) {
  if (node.type !== 'leaf') {
    throw new Error('Node is not a leaf type');
  }
  return true;
}

function isLayoutVec2(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.x !== 'string' || typeof value.y !== 'string') return false;
  return true;
}

function isPartialLayoutVec2(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.x !== undefined && typeof value.x !== 'string') return false;
  if (value.y !== undefined && typeof value.y !== 'string') return false;
  return true;
}

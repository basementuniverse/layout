// Layout Editor

// -----------------------------------------------------------------------------
// Globals and editor state
// -----------------------------------------------------------------------------

const TITLE = 'Layout';
const RESIZE_HANDLE_SIZE = 10;

const editorState = {
  dirty: false,
  layout: null,
  layoutName: '',
  layoutDefinition: null,
  selectedNodeId: null,
  contextNodeId: null,
  canvasSize: { x: 0, y: 0 },
  mousePosition: { x: 0, y: 0 },
  dragState: {
    isDragging: false,
    nodeId: null,
    startMousePos: { x: 0, y: 0 },
    startNodeOffset: { x: '0px', y: '0px' },
  },
  resizeState: {
    isResizing: false,
    nodeId: null,
    handle: null, // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    startMousePos: { x: 0, y: 0 },
    startNodeBounds: { x: 0, y: 0, width: 0, height: 0 },
    startNodeOffset: { x: '0px', y: '0px' },
    startNodeSize: { x: 'auto', y: 'auto' },
  },
  history: {
    snapshots: [],
    currentIndex: -1,
  },
  settings: {
    theme: 'dark',
    editorMargin: 20,
    showGrid: true,
    nodeColour: '#0078d4',
    gridSize: 10,
    showGuide: true,
    guideColour: '#ff5588',
    guideSize: { x: 600, y: 800 },
  },
};

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
    hiddenNode: {
      fill: false,
      stroke: true,
      strokeColor: '#00000040',
      strokeWidth: 2,
      lineStyle: 'dotted',
      rounded: true,
      borderRadius: 6,
      opacity: 0.5,
    },
    selectedHiddenNode: {
      fill: true,
      fillColor: '#0078d422',
      stroke: true,
      strokeColor: '#0078d466',
      strokeWidth: 2,
      lineStyle: 'dotted',
      rounded: true,
      borderRadius: 6,
      opacity: 0.5,
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
    hiddenNode: {
      fill: false,
      stroke: true,
      strokeColor: '#ffffff77',
      strokeWidth: 2,
      lineStyle: 'dashed',
      rounded: true,
      borderRadius: 6,
      opacity: 0.5,
    },
    selectedHiddenNode: {
      fill: true,
      fillColor: '#0078d422',
      stroke: true,
      strokeColor: '#0078d4cc',
      strokeWidth: 2,
      lineStyle: 'dashed',
      rounded: true,
      borderRadius: 6,
      opacity: 0.5,
    },
  },
  guide: {
    fill: false,
    stroke: true,
    lineStyle: 'dashed',
    strokeWidth: 2,
  },
};

const SETTINGS_SCHEMA = {
  type: 'object',
  properties: {
    editorMargin: { type: 'number', minimum: 0, maximum: 100 },
    showGrid: { type: 'boolean' },
    gridSize: { type: 'number', minimum: 5, maximum: 100 },
    colour: { type: 'string', format: 'color' },
    showGuide: { type: 'boolean' },
    guideSize: {
      type: 'object',
      properties: {
        x: { type: 'number', minimum: 100, maximum: 10000 },
        y: { type: 'number', minimum: 100, maximum: 10000 },
      },
      required: ['x', 'y'],
    },
  },
  required: ['editorMargin', 'showGrid', 'gridSize', 'showGuide', 'guideSize'],
};

const LAYOUT = {
  root: {},
};

const DOCK_NODE = {
  id: '',
  type: 'dock',
};

const STACK_NODE = {
  id: '',
  type: 'stack',
  direction: 'vertical',
  align: 'start',
  gap: '0px',
  children: [],
};

const LEAF_NODE = {
  id: '',
  type: 'leaf',
};

// Layout library
let Layout;

// Debug library
let Debug;

// Canvas-helpers library
let drawGrid, drawRectangle;

// DOM elements
// Main sections
let app, tree, content, properties, history;

// Canvas
let canvas, context;

// Toolbar buttons
let newToolbarButton,
  openToolbarButton,
  saveToolbarButton,
  undoToolbarButton,
  redoToolbarButton,
  newDockNodeToolbarButton,
  newStackNodeToolbarButton,
  newLeafNodeToolbarButton,
  newDockNodeToolbarMenu,
  newStackNodeToolbarMenu,
  newLeafNodeToolbarMenu,
  moveNodeToolbarSeparator,
  moveNodeFirstButton,
  moveNodeBackwardsButton,
  moveNodeForwardsButton,
  moveNodeLastButton,
  deleteNodeToolbarButton,
  settingsToolbarButton,
  themeSwitch;

// Data views
let treeView, propertiesTitle, propertyEditor, historyView, settingsEditor;

// Status bar
let statusBar, mouseStatusBarItem, selectedStatusBarItem;

// Context menu items
let newDockNodeContextMenuItem,
  newStackNodeContextMenuItem,
  newLeafNodeContextMenuItem,
  newDockNodeContextMenuMenu,
  newStackNodeContextMenuMenu,
  newLeafNodeContextMenuMenu,
  moveNodeContextMenuSeparator,
  moveNodeFirstContextMenuItem,
  moveNodeBackwardsContextMenuItem,
  moveNodeForwardsContextMenuItem,
  moveNodeLastContextMenuItem,
  deleteNodeContextMenuItem;

// Prompts and dialogs
let namePrompt, settingsDialog, closeSettingsDialogButton;

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initialiseEditor();
});

function initialiseEditor() {
  console.log('Initializing Layout Editor...');

  // Check if Layout library is available
  Layout = window.Layout;
  if (!Layout) {
    console.error('Layout library not found!');
    return;
  }

  // Check if Debug library is available
  Debug = window.default;
  if (!Debug) {
    console.error('Debug library not found!');
    return;
  }
  Debug.initialise();

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
  history = document.querySelector('aside.history');
  treeView = document.getElementById('node-tree');
  propertiesTitle = document.getElementById('properties-title');
  propertyEditor = document.getElementById('node-editor');
  historyView = document.getElementById('history-list');
  newToolbarButton = document.getElementById('new-toolbar-button');
  openToolbarButton = document.getElementById('open-toolbar-button');
  saveToolbarButton = document.getElementById('save-toolbar-button');
  undoToolbarButton = document.getElementById('undo-toolbar-button');
  redoToolbarButton = document.getElementById('redo-toolbar-button');
  newDockNodeToolbarButton = document.getElementById(
    'new-dock-node-toolbar-button'
  );
  newStackNodeToolbarButton = document.getElementById(
    'new-stack-node-toolbar-button'
  );
  newLeafNodeToolbarButton = document.getElementById(
    'new-leaf-node-toolbar-button'
  );
  newDockNodeToolbarMenu = document.getElementById(
    'new-dock-node-toolbar-menu'
  );
  newStackNodeToolbarMenu = document.getElementById(
    'new-stack-node-toolbar-menu'
  );
  newLeafNodeToolbarMenu = document.getElementById(
    'new-leaf-node-toolbar-menu'
  );
  moveNodeToolbarSeparator = document.getElementById(
    'move-node-toolbar-separator'
  );
  moveNodeFirstButton = document.getElementById('move-node-first-button');
  moveNodeBackwardsButton = document.getElementById(
    'move-node-backwards-button'
  );
  moveNodeForwardsButton = document.getElementById('move-node-forwards-button');
  moveNodeLastButton = document.getElementById('move-node-last-button');
  deleteNodeToolbarButton = document.getElementById(
    'delete-node-toolbar-button'
  );
  settingsToolbarButton = document.getElementById('settings-toolbar-button');
  themeSwitch = document.querySelector('.theme-switch input');
  statusBar = document.getElementById('status-bar');
  mouseStatusBarItem = document.getElementById('mouse-status');
  selectedStatusBarItem = document.getElementById('selected-status');
  namePrompt = document.getElementById('name-prompt');
  settingsDialog = document.getElementById('settings-dialog');
  settingsEditor = document.getElementById('settings-editor');
  closeSettingsDialogButton = document.getElementById(
    'close-settings-dialog-button'
  );
  newDockNodeContextMenuItem = document.getElementById(
    'new-dock-node-context-menu-item'
  );
  newStackNodeContextMenuItem = document.getElementById(
    'new-stack-node-context-menu-item'
  );
  newLeafNodeContextMenuItem = document.getElementById(
    'new-leaf-node-context-menu-item'
  );
  newDockNodeContextMenuMenu = document.getElementById(
    'new-dock-node-context-menu-menu'
  );
  newStackNodeContextMenuMenu = document.getElementById(
    'new-stack-node-context-menu-menu'
  );
  newLeafNodeContextMenuMenu = document.getElementById(
    'new-leaf-node-context-menu-menu'
  );
  moveNodeContextMenuSeparator = document.getElementById(
    'move-node-context-menu-separator'
  );
  moveNodeFirstContextMenuItem = document.getElementById(
    'move-node-first-context-menu-item'
  );
  moveNodeBackwardsContextMenuItem = document.getElementById(
    'move-node-backwards-context-menu-item'
  );
  moveNodeForwardsContextMenuItem = document.getElementById(
    'move-node-forwards-context-menu-item'
  );
  moveNodeLastContextMenuItem = document.getElementById(
    'move-node-last-context-menu-item'
  );
  deleteNodeContextMenuItem = document.getElementById(
    'delete-node-context-menu-item'
  );

  // Configure history view
  if (historyView) {
    historyView.columns = [
      { id: 'label', label: '#', width: '2em' },
      { id: 'action', label: 'Action' },
      { id: 'date', label: 'Date', width: '55px' },
      { id: 'current', label: 'Current', width: '1em' },
    ];
  }

  // Initialise settings editor
  settingsEditor.value = Object.fromEntries(
    Object.entries(editorState.settings).filter(([key]) => key !== 'theme')
  );
  settingsEditor.schema = SETTINGS_SCHEMA;

  setupCanvas();
  startRenderLoop();
  setupEventListeners();
  updateTitle();
  updateStatusBar();
  updateToolbarButtons();
  themeSwitch.checked = editorState.settings.theme === 'dark';
  app.setAttribute('theme', editorState.settings.theme);
  settingsDialog.setAttribute('theme', editorState.settings.theme);

  console.log('Layout Editor initialised successfully');
}

function setupCanvas() {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Handle canvas resize observer for more responsive updates
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(tree);
    resizeObserver.observe(content);
    resizeObserver.observe(properties);
    resizeObserver.observe(history);
  }
}

function resizeCanvas() {
  const rect = content.getBoundingClientRect();
  canvas.width = Math.floor(rect.width) - editorState.settings.editorMargin * 2;
  canvas.height =
    Math.floor(rect.height) - editorState.settings.editorMargin * 2;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.style.top = `${editorState.settings.editorMargin}px`;
  canvas.style.left = `${editorState.settings.editorMargin}px`;
  editorState.canvasSize.x = canvas.width;
  editorState.canvasSize.y = canvas.height;

  // Update layout if it exists
  if (editorState.layout) {
    editorState.layout.update(editorState.canvasSize);
  }
}

function setupEventListeners() {
  // Theme switch toggle
  themeSwitch.addEventListener('change', e => {
    if (e.target.checked) {
      editorState.settings.theme = 'dark';
    } else {
      editorState.settings.theme = 'light';
    }
    app.setAttribute('theme', editorState.settings.theme);
    settingsDialog.setAttribute('theme', editorState.settings.theme);
  });

  // Mouse movement tracking
  content.addEventListener('mousemove', e => {
    const rect = content.getBoundingClientRect();
    editorState.mousePosition = {
      x: Math.round(e.clientX - rect.left) - editorState.settings.editorMargin,
      y: Math.round(e.clientY - rect.top) - editorState.settings.editorMargin,
    };
    updateStatusBar();

    // Handle resizing
    if (editorState.resizeState.isResizing) {
      handleResize(editorState.mousePosition.x, editorState.mousePosition.y);
    }
    // Handle dragging
    else if (editorState.dragState.isDragging) {
      handleDrag(editorState.mousePosition.x, editorState.mousePosition.y);
    }
    // Update cursor based on resize handle detection
    else {
      updateCursorForResizeHandle(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
    }
  });

  // Content area mousedown for selection and drag start
  content.addEventListener('mousedown', e => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Check for resize handle first (takes priority)
    const resizeHandle = detectResizeHandle(
      editorState.mousePosition.x,
      editorState.mousePosition.y
    );

    if (resizeHandle) {
      handleResizeStart(
        editorState.mousePosition.x,
        editorState.mousePosition.y,
        resizeHandle
      );
    } else {
      handleContentAreaMouseDown(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
    }
  });

  // Content area mouseup for drag/resize end
  content.addEventListener('mouseup', e => {
    if (editorState.resizeState.isResizing) {
      handleResizeEnd();
    } else if (editorState.dragState.isDragging) {
      handleDragEnd();
    }
  });

  // Global mouseup to handle drag/resize end when mouse leaves canvas
  document.addEventListener('mouseup', e => {
    if (editorState.resizeState.isResizing) {
      handleResizeEnd();
    } else if (editorState.dragState.isDragging) {
      handleDragEnd();
    }
  });

  // Keyboard events
  document.addEventListener('keydown', e => {
    // Delete
    if (e.key === 'Delete' && editorState.selectedNodeId) {
      e.preventDefault();
      deleteNode(editorState.selectedNodeId);
    }

    // Undo
    if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      updateToolbarButtons();
    }

    // Redo
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') ||
      (e.ctrlKey && e.key.toLowerCase() === 'y')
    ) {
      e.preventDefault();
      redo();
      updateToolbarButtons();
    }

    const hasLayout = !!editorState.layoutDefinition;
    const hasSelection = !!editorState.selectedNodeId;
    const selectionIsRootNode =
      hasSelection &&
      editorState.selectedNodeId === editorState.layoutDefinition.root.id;
    const selectedNode = hasSelection
      ? findNodeById(editorState.selectedNodeId)
      : null;
    const selectedNodeParent = hasSelection
      ? findParentNodeById(editorState.selectedNodeId)
      : null;

    // Create dock node
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();

      if (!hasLayout) return;
      if (
        !hasSelection ||
        (selectionIsRootNode && selectedNode.type === 'leaf')
      ) {
        replaceRootNode('dock');
        return;
      }
      switch (selectedNode.type) {
        case 'leaf':
          replaceNode(editorState.selectedNodeId, 'dock');
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using keyboard shortcut');
          break;
        case 'stack':
          createNodeInStack(selectedNode, 'dock');
          break;
        default:
          break;
      }
    }

    // Create stack node
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();

      if (!hasLayout) return;
      if (
        !hasSelection ||
        (selectionIsRootNode && selectedNode.type === 'leaf')
      ) {
        replaceRootNode('stack');
        return;
      }
      switch (selectedNode.type) {
        case 'leaf':
          replaceNode(editorState.selectedNodeId, 'stack');
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using keyboard shortcut');
          break;
        case 'stack':
          createNodeInStack(selectedNode, 'stack');
          break;
        default:
          break;
      }
    }

    // Create leaf node
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();

      if (!hasLayout) return;
      if (!hasSelection) return;
      switch (selectedNode.type) {
        case 'leaf':
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(selectedNode, 'leaf');
          break;
        default:
          break;
      }
    }

    // Move node first
    if (e.ctrlKey && e.shiftKey && e.key === 'PageUp') {
      e.preventDefault();

      if (!hasLayout) return;
      if (!hasSelection) return;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        return;
      }
      moveNodeInStack(selectedNodeParent, editorState.selectedNodeId, 'first');
    }

    // Move node backwards
    if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
      e.preventDefault();

      if (!hasLayout) return;
      if (!hasSelection) return;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        return;
      }
      moveNodeInStack(
        selectedNodeParent,
        editorState.selectedNodeId,
        'backwards'
      );
    }

    // Move node first
    if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
      e.preventDefault();

      if (!hasLayout) return;
      if (!hasSelection) return;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        return;
      }
      moveNodeInStack(
        selectedNodeParent,
        editorState.selectedNodeId,
        'forwards'
      );
    }

    // Move node first
    if (e.ctrlKey && e.shiftKey && e.key === 'PageDown') {
      e.preventDefault();

      if (!hasLayout) return;
      if (!hasSelection) return;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        return;
      }
      moveNodeInStack(selectedNodeParent, editorState.selectedNodeId, 'last');
    }
  });

  // Toolbar button events
  document.addEventListener('toolbar-button-click', async e => {
    await handleToolbarAction(e.detail.button.getAttribute('action'));
  });

  // Context menu events
  document.addEventListener('context-menu-show', e => {
    if (e.detail.trigger === canvas) {
      const nodeId = findNodeIdAtPosition(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
      const node = findNodeById(nodeId);

      console.log(node);

      editorState.contextNodeId = node?.id || null;
      updateContextMenuButtons();
    } else {
      const { componentContext } = e.detail;

      if (componentContext?.componentType === 'tree-view') {
        let node = null;
        const treeContext = componentContext;

        if (treeContext.item) {
          node = treeContext.item.data;
        }

        editorState.contextNodeId = node?.id || null;
        updateContextMenuButtons();
      }
    }
  });
  document.addEventListener('context-menu-item-click', e => {
    handleContextMenuAction(e.detail.item.getAttribute('action'));
  });

  // Tree view selection events
  document.addEventListener('tree-selection-change', e => {
    if (e.target === treeView) {
      handleTreeSelection(e);
    }
  });

  // History view selection events
  document.addEventListener('listview-selection-change', e => {
    if (e.target === historyView) {
      handleHistorySelection(e);
    }
  });

  // Properties editor changes
  const debouncedHandleNodePropertiesChange = debounce(
    handleNodePropertyChange,
    300
  );
  propertyEditor.addEventListener(
    'keyvalue-change',
    debouncedHandleNodePropertiesChange
  );

  // Settings editor changes
  const debouncedHandleSettingsChange = debounce(handleSettingsChange, 300);
  settingsEditor.addEventListener(
    'keyvalue-change',
    debouncedHandleSettingsChange
  );

  // Close settings dialog
  closeSettingsDialogButton?.addEventListener('click', e => {
    settingsDialog?.close();
  });
}

// -----------------------------------------------------------------------------
// Event handlers
// -----------------------------------------------------------------------------

async function handleToolbarAction(action) {
  console.log('Toolbar action:', action);

  const hasLayout = !!editorState.layoutDefinition;
  const hasSelection = !!editorState.selectedNodeId;
  const selectionIsRootNode =
    hasSelection &&
    editorState.selectedNodeId === editorState.layoutDefinition.root.id;
  const selectedNode = hasSelection
    ? findNodeById(editorState.selectedNodeId)
    : null;
  const selectedNodeParent = hasSelection
    ? findParentNodeById(editorState.selectedNodeId)
    : null;

  switch (action) {
    case 'new':
      newLayout();
      break;
    case 'open':
      openLayout();
      break;
    case 'save':
      await saveLayout();
      break;
    case 'undo':
      undo();
      break;
    case 'redo':
      redo();
      break;

    // New node
    case 'new-dock-node':
      if (!hasLayout) break;
      if (
        !hasSelection ||
        (selectionIsRootNode && selectedNode.type === 'leaf')
      ) {
        replaceRootNode('dock');
        break;
      }
      switch (selectedNode.type) {
        case 'leaf':
          replaceNode(editorState.selectedNodeId, 'dock');
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(selectedNode, 'dock');
          break;
        default:
          break;
      }
      break;
    case 'new-stack-node':
      if (!hasLayout) break;
      if (
        !hasSelection ||
        (selectionIsRootNode && selectedNode.type === 'leaf')
      ) {
        replaceRootNode('stack');
        break;
      }
      switch (selectedNode.type) {
        case 'leaf':
          replaceNode(editorState.selectedNodeId, 'stack');
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(selectedNode, 'stack');
          break;
        default:
          break;
      }
      break;
    case 'new-leaf-node':
      if (!hasLayout) break;
      if (!hasSelection) break;
      switch (selectedNode.type) {
        case 'leaf':
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(selectedNode, 'leaf');
          break;
        default:
          break;
      }
      break;

    // Move node in stack
    case 'move-node-first':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(selectedNodeParent, editorState.selectedNodeId, 'first');
      break;
    case 'move-node-backwards':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(
        selectedNodeParent,
        editorState.selectedNodeId,
        'backwards'
      );
      break;
    case 'move-node-forwards':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(
        selectedNodeParent,
        editorState.selectedNodeId,
        'forwards'
      );
      break;
    case 'move-node-last':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(selectedNodeParent, editorState.selectedNodeId, 'last');
      break;

    // Delete node
    case 'delete-node':
      if (!hasLayout) break;
      if (!hasSelection) break;
      deleteNode(editorState.selectedNodeId);
      break;
    case 'settings':
      settingsDialog?.showModal();
      break;
    default:
      console.warn('Unknown toolbar action:', action);
  }
}

function handleContextMenuAction(action) {
  console.log('Context menu action:', action);

  const hasLayout = !!editorState.layoutDefinition;

  const hasSelection = !!editorState.selectedNodeId;
  const selectedNode = hasSelection
    ? findNodeById(editorState.selectedNodeId)
    : null;

  const hasContext = !!editorState.contextNodeId;
  const contextIsRootNode =
    hasContext &&
    editorState.contextNodeId === editorState.layoutDefinition.root.id;
  const contextNode = hasContext
    ? findNodeById(editorState.contextNodeId)
    : null;
  const contextNodeParent = hasContext
    ? findParentNodeById(editorState.contextNodeId)
    : null;

  switch (action) {
    // New node
    case 'new-dock-node-context':
      if (!hasLayout) break;
      if (!hasContext || (contextIsRootNode && contextNode.type === 'leaf')) {
        replaceRootNode('dock');
        break;
      }
      switch (contextNode.type) {
        case 'leaf':
          replaceNode(editorState.contextNodeId, 'dock');
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(contextNode, 'dock');
          break;
        default:
          break;
      }
      break;
    case 'new-stack-node-context':
      if (!hasLayout) break;
      if (!hasContext || (contextIsRootNode && contextNode.type === 'leaf')) {
        replaceRootNode('stack');
        break;
      }
      switch (contextNode.type) {
        case 'leaf':
          replaceNode(editorState.contextNodeId, 'stack');
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(contextNode, 'stack');
          break;
        default:
          break;
      }
      break;
    case 'new-leaf-node-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      switch (contextNode.type) {
        case 'leaf':
          break;
        case 'dock':
          console.warn('Cannot add node to dock node using this action');
          break;
        case 'stack':
          createNodeInStack(contextNode, 'leaf');
          break;
        default:
          break;
      }
      break;

    // New dock node in dock node slot (context menu)
    case 'new-dock-node-topleft-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topLeft', 'dock');
      break;
    case 'new-dock-node-topcenter-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topCenter', 'dock');
      break;
    case 'new-dock-node-topright-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topRight', 'dock');
      break;
    case 'new-dock-node-left-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'left', 'dock');
      break;
    case 'new-dock-node-center-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'center', 'dock');
      break;
    case 'new-dock-node-right-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'right', 'dock');
      break;
    case 'new-dock-node-bottomleft-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomLeft', 'dock');
      break;
    case 'new-dock-node-bottomcenter-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomCenter', 'dock');
      break;
    case 'new-dock-node-bottomright-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomRight', 'dock');
      break;

    // New stack node in dock node slot (context menu)
    case 'new-stack-node-topleft-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topLeft', 'stack');
      break;
    case 'new-stack-node-topcenter-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topCenter', 'stack');
      break;
    case 'new-stack-node-topright-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topRight', 'stack');
      break;
    case 'new-stack-node-left-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'left', 'stack');
      break;
    case 'new-stack-node-center-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'center', 'stack');
      break;
    case 'new-stack-node-right-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'right', 'stack');
      break;
    case 'new-stack-node-bottomleft-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomLeft', 'stack');
      break;
    case 'new-stack-node-bottomcenter-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomCenter', 'stack');
      break;
    case 'new-stack-node-bottomright-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomRight', 'stack');
      break;

    // New leaf node in dock node slot (context menu)
    case 'new-leaf-node-topleft-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topLeft', 'leaf');
      break;
    case 'new-leaf-node-topcenter-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topCenter', 'leaf');
      break;
    case 'new-leaf-node-topright-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'topRight', 'leaf');
      break;
    case 'new-leaf-node-left-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'left', 'leaf');
      break;
    case 'new-leaf-node-center-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'center', 'leaf');
      break;
    case 'new-leaf-node-right-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'right', 'leaf');
      break;
    case 'new-leaf-node-bottomleft-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomLeft', 'leaf');
      break;
    case 'new-leaf-node-bottomcenter-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomCenter', 'leaf');
      break;
    case 'new-leaf-node-bottomright-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(contextNode, 'bottomRight', 'leaf');
      break;

    // New dock node in dock node slot (toolbar menu)
    case 'new-dock-node-topleft':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topLeft', 'dock');
      break;
    case 'new-dock-node-topcenter':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topCenter', 'dock');
      break;
    case 'new-dock-node-topright':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topRight', 'dock');
      break;
    case 'new-dock-node-left':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'left', 'dock');
      break;
    case 'new-dock-node-center':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'center', 'dock');
      break;
    case 'new-dock-node-right':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'right', 'dock');
      break;
    case 'new-dock-node-bottomleft':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomLeft', 'dock');
      break;
    case 'new-dock-node-bottomcenter':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomCenter', 'dock');
      break;
    case 'new-dock-node-bottomright':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomRight', 'dock');
      break;

    // New stack node in dock node slot (toolbar menu)
    case 'new-stack-node-topleft':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topLeft', 'stack');
      break;
    case 'new-stack-node-topcenter':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topCenter', 'stack');
      break;
    case 'new-stack-node-topright':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topRight', 'stack');
      break;
    case 'new-stack-node-left':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'left', 'stack');
      break;
    case 'new-stack-node-center':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'center', 'stack');
      break;
    case 'new-stack-node-right':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'right', 'stack');
      break;
    case 'new-stack-node-bottomleft':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomLeft', 'stack');
      break;
    case 'new-stack-node-bottomcenter':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomCenter', 'stack');
      break;
    case 'new-stack-node-bottomright':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomRight', 'stack');
      break;

    // New leaf node in dock node slot (toolbar menu)
    case 'new-leaf-node-topleft':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topLeft', 'leaf');
      break;
    case 'new-leaf-node-topcenter':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topCenter', 'leaf');
      break;
    case 'new-leaf-node-topright':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'topRight', 'leaf');
      break;
    case 'new-leaf-node-left':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'left', 'leaf');
      break;
    case 'new-leaf-node-center':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'center', 'leaf');
      break;
    case 'new-leaf-node-right':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'right', 'leaf');
      break;
    case 'new-leaf-node-bottomleft':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomLeft', 'leaf');
      break;
    case 'new-leaf-node-bottomcenter':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomCenter', 'leaf');
      break;
    case 'new-leaf-node-bottomright':
      if (!hasLayout) break;
      if (!hasSelection) break;
      if (selectedNode.type !== 'dock') {
        console.warn('Cannot add node to non-dock node using this action');
        break;
      }
      createNodeInDock(selectedNode, 'bottomRight', 'leaf');
      break;

    // Move node in stack
    case 'move-node-first-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(contextNodeParent, editorState.contextNodeId, 'first');
      break;
    case 'move-node-backwards-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(
        contextNodeParent,
        editorState.contextNodeId,
        'backwards'
      );
      break;
    case 'move-node-forwards-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(contextNodeParent, editorState.contextNodeId, 'forwards');
      break;
    case 'move-node-last-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      if (contextNodeParent.type !== 'stack') {
        console.warn('Cannot move node in non-stack parent');
        break;
      }
      moveNodeInStack(contextNodeParent, editorState.contextNodeId, 'last');
      break;

    // Delete node
    case 'delete-node-context':
      if (!hasLayout) break;
      if (!hasContext) break;
      deleteNode(editorState.contextNodeId);
      break;
    default:
      console.warn('Unknown context menu action:', action);
  }
}

function handleContentAreaMouseDown(x, y) {
  if (!editorState.layout) return;

  // Find the node at the clicked position
  const clickedNodeId = findNodeIdAtPosition(x, y);
  if (clickedNodeId) {
    console.log('Node selected:', clickedNodeId);

    // Set selected node
    editorState.selectedNodeId = clickedNodeId;

    // Initialize drag state
    const nodeData = findNodeById(clickedNodeId);
    editorState.dragState = {
      isDragging: true,
      nodeId: clickedNodeId,
      startMousePos: { x, y },
      startNodeOffset: {
        x: nodeData.offset?.x || '0px',
        y: nodeData.offset?.y || '0px',
      },
    };

    // Change cursor
    canvas.style.cursor = 'move';

    syncTreeViewSelection(clickedNodeId);
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  } else {
    console.log('No node at clicked position');

    // Clear selection
    editorState.selectedNodeId = null;

    treeView.clearSelection();
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  }
}

function handleDrag(x, y) {
  if (!editorState.dragState.isDragging || !editorState.dragState.nodeId)
    return;

  const { nodeId, startMousePos, startNodeOffset } = editorState.dragState;
  const nodeData = findNodeById(nodeId);
  if (!nodeData) return;

  // Calculate delta
  const deltaX = x - startMousePos.x;
  const deltaY = y - startMousePos.y;

  // Get parent node to calculate percentages correctly
  const parentNode = findParentNodeById(nodeId);
  const parentCalculated = parentNode
    ? editorState.layout.get(parentNode.id)
    : null;

  // Calculate new offset based on original unit type
  const newOffset = {
    x: calculateNewOffset(startNodeOffset.x, deltaX, parentCalculated, 'x'),
    y: calculateNewOffset(startNodeOffset.y, deltaY, parentCalculated, 'y'),
  };

  // Update node offset (without creating history snapshot during drag)
  const updatedNodeData = {
    ...nodeData,
    offset: newOffset,
  };

  // Update in definition
  const result = updateNodeInDefinition(
    editorState.layoutDefinition.root,
    nodeId,
    updatedNodeData
  );

  if (result) {
    updateLayout(editorState.layoutDefinition);
    updatePropertyEditor();
  }
}

function handleDragEnd() {
  if (!editorState.dragState.isDragging) return;

  const { nodeId, startNodeOffset } = editorState.dragState;
  const nodeData = findNodeById(nodeId);

  // Only create history snapshot if offset actually changed
  // Normalize values: use '0px' default for both current and start values
  const currentX = nodeData?.offset?.x || '0px';
  const currentY = nodeData?.offset?.y || '0px';
  const offsetChanged =
    nodeData &&
    (currentX !== startNodeOffset.x || currentY !== startNodeOffset.y);

  if (offsetChanged) {
    const snapshot = preActionSnapshot(`Move ${nodeId}`);
    postActionSnapshot(snapshot);
    editorState.dirty = true;
    updateTitle();
  }

  // Reset drag state
  editorState.dragState = {
    isDragging: false,
    nodeId: null,
    startMousePos: { x: 0, y: 0 },
    startNodeOffset: { x: '0px', y: '0px' },
  };

  // Reset cursor
  canvas.style.cursor = 'default';

  console.log('Drag ended');
}

function detectResizeHandle(x, y) {
  if (!editorState.layout || !editorState.selectedNodeId) return null;

  const node = editorState.layout.get(editorState.selectedNodeId);
  if (!node) return null;

  const { left, right, top, bottom } = node;
  const handleSize = RESIZE_HANDLE_SIZE;

  // Check corners first (they take priority)
  if (
    x >= left - handleSize &&
    x <= left + handleSize &&
    y >= top - handleSize &&
    y <= top + handleSize
  ) {
    return 'nw';
  }
  if (
    x >= right - handleSize &&
    x <= right + handleSize &&
    y >= top - handleSize &&
    y <= top + handleSize
  ) {
    return 'ne';
  }
  if (
    x >= left - handleSize &&
    x <= left + handleSize &&
    y >= bottom - handleSize &&
    y <= bottom + handleSize
  ) {
    return 'sw';
  }
  if (
    x >= right - handleSize &&
    x <= right + handleSize &&
    y >= bottom - handleSize &&
    y <= bottom + handleSize
  ) {
    return 'se';
  }

  // Check edges
  if (
    y >= top - handleSize &&
    y <= top + handleSize &&
    x >= left &&
    x <= right
  ) {
    return 'n';
  }
  if (
    y >= bottom - handleSize &&
    y <= bottom + handleSize &&
    x >= left &&
    x <= right
  ) {
    return 's';
  }
  if (
    x >= left - handleSize &&
    x <= left + handleSize &&
    y >= top &&
    y <= bottom
  ) {
    return 'w';
  }
  if (
    x >= right - handleSize &&
    x <= right + handleSize &&
    y >= top &&
    y <= bottom
  ) {
    return 'e';
  }

  return null;
}

function updateCursorForResizeHandle(x, y) {
  const handle = detectResizeHandle(x, y);

  if (!handle) {
    canvas.style.cursor = 'default';
    return;
  }

  const cursorMap = {
    n: 'n-resize',
    s: 's-resize',
    e: 'e-resize',
    w: 'w-resize',
    ne: 'ne-resize',
    nw: 'nw-resize',
    se: 'se-resize',
    sw: 'sw-resize',
  };

  canvas.style.cursor = cursorMap[handle] || 'default';
}

function handleResizeStart(x, y, handle) {
  if (!editorState.selectedNodeId) return;

  const nodeData = findNodeById(editorState.selectedNodeId);
  const calculatedNode = editorState.layout.get(editorState.selectedNodeId);
  if (!nodeData || !calculatedNode) return;

  console.log('Resize started:', handle);

  editorState.resizeState = {
    isResizing: true,
    nodeId: editorState.selectedNodeId,
    handle,
    startMousePos: { x, y },
    startNodeBounds: {
      x: calculatedNode.left,
      y: calculatedNode.top,
      width: calculatedNode.width,
      height: calculatedNode.height,
    },
    startNodeOffset: {
      x: nodeData.offset?.x || '0px',
      y: nodeData.offset?.y || '0px',
    },
    startNodeSize: {
      x: nodeData.size?.x || 'auto',
      y: nodeData.size?.y || 'auto',
    },
  };
}

function handleResize(x, y) {
  if (!editorState.resizeState.isResizing || !editorState.resizeState.nodeId)
    return;

  const {
    nodeId,
    handle,
    startMousePos,
    startNodeBounds,
    startNodeOffset,
    startNodeSize,
  } = editorState.resizeState;
  const nodeData = findNodeById(nodeId);
  if (!nodeData) return;

  const deltaX = x - startMousePos.x;
  const deltaY = y - startMousePos.y;

  // Get parent node to calculate percentages correctly
  const parentNode = findParentNodeById(nodeId);
  const parentCalculated = parentNode
    ? editorState.layout.get(parentNode.id)
    : null;

  let newOffset = { ...startNodeOffset };
  let newSize = { ...startNodeSize };

  // Calculate new size and offset based on resize handle
  if (handle.includes('n')) {
    // Top edge: offset increases, height decreases
    newOffset.y = calculateNewOffset(
      startNodeOffset.y,
      deltaY,
      parentCalculated,
      'y'
    );
    newSize.y = calculateNewSize(
      startNodeSize.y,
      -deltaY,
      startNodeBounds.height,
      parentCalculated,
      'y'
    );
  }
  if (handle.includes('s')) {
    // Bottom edge: height increases
    newSize.y = calculateNewSize(
      startNodeSize.y,
      deltaY,
      startNodeBounds.height,
      parentCalculated,
      'y'
    );
  }
  if (handle.includes('w')) {
    // Left edge: offset increases, width decreases
    newOffset.x = calculateNewOffset(
      startNodeOffset.x,
      deltaX,
      parentCalculated,
      'x'
    );
    newSize.x = calculateNewSize(
      startNodeSize.x,
      -deltaX,
      startNodeBounds.width,
      parentCalculated,
      'x'
    );
  }
  if (handle.includes('e')) {
    // Right edge: width increases
    newSize.x = calculateNewSize(
      startNodeSize.x,
      deltaX,
      startNodeBounds.width,
      parentCalculated,
      'x'
    );
  }

  // Update node
  const updatedNodeData = {
    ...nodeData,
    offset: newOffset,
    size: newSize,
  };

  // Update in definition
  const result = updateNodeInDefinition(
    editorState.layoutDefinition.root,
    nodeId,
    updatedNodeData
  );

  if (result) {
    updateLayout(editorState.layoutDefinition);
    updatePropertyEditor();
  }
}

function handleResizeEnd() {
  if (!editorState.resizeState.isResizing) return;

  const { nodeId, startNodeOffset, startNodeSize } = editorState.resizeState;
  const nodeData = findNodeById(nodeId);

  // Only create history snapshot if size or offset actually changed
  // Normalize values to match how they're stored initially
  const currentOffsetX = nodeData?.offset?.x || '0px';
  const currentOffsetY = nodeData?.offset?.y || '0px';
  const currentSizeX = nodeData?.size?.x || 'auto';
  const currentSizeY = nodeData?.size?.y || 'auto';

  const changed =
    nodeData &&
    (currentOffsetX !== startNodeOffset.x ||
      currentOffsetY !== startNodeOffset.y ||
      currentSizeX !== startNodeSize.x ||
      currentSizeY !== startNodeSize.y);

  if (changed) {
    const snapshot = preActionSnapshot(`Resize ${nodeId}`);
    postActionSnapshot(snapshot);
    editorState.dirty = true;
    updateTitle();
  }

  // Reset resize state
  editorState.resizeState = {
    isResizing: false,
    nodeId: null,
    handle: null,
    startMousePos: { x: 0, y: 0 },
    startNodeBounds: { x: 0, y: 0, width: 0, height: 0 },
    startNodeOffset: { x: '0px', y: '0px' },
    startNodeSize: { x: 'auto', y: 'auto' },
  };

  // Reset cursor
  canvas.style.cursor = 'default';

  console.log('Resize ended');
}

function handleTreeSelection(event) {
  console.log('Tree selection changed:', event.detail);

  const { selectedItems } = event.detail;
  if (selectedItems && selectedItems.length > 0) {
    // Get the first selected item
    const selectedItem = selectedItems[0];
    const nodeId = selectedItem.id;
    console.log('Selected node:', nodeId);

    // Set selected node
    editorState.selectedNodeId = nodeId;

    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  } else {
    console.log('No node selected in tree view');

    // Clear selection
    editorState.selectedNodeId = null;

    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  }
}

function handleHistorySelection(event) {
  console.log('History selection changed:', event.detail);

  const { selectedItems } = event.detail;
  if (selectedItems && selectedItems.length > 0) {
    // Get the first selected item
    const selectedItem = selectedItems[0];
    const historyIndex = parseInt(selectedItem.id, 10);

    console.log('Selected history index:', historyIndex);

    // Jump to the selected history point
    jumpToHistoryIndex(historyIndex);
  }
}

function handleNodePropertyChange(event) {
  console.log('Node property changed:', event.detail);

  if (!propertyEditor.nodeId) return;

  propertyEditor.validate();
  if (propertyEditor.isValid()) {
    updateNode(
      propertyEditor.nodeId,
      propertyEditor.value,
      event.detail.path.join('.')
    );
  }
}

function handleSettingsChange(event) {
  console.log('Settings changed:', event.detail);

  settingsEditor.validate();
  if (settingsEditor.isValid()) {
    editorState.settings = {
      ...editorState.settings,
      ...settingsEditor.value,
    };
    resizeCanvas();
  }
}

// -----------------------------------------------------------------------------
// UI
// -----------------------------------------------------------------------------

function updateTitle() {
  document.title = `${TITLE} - ${editorState.layoutName || 'Untitled'}${
    editorState.dirty ? ' (modified)' : ''
  }`;
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

function updatePropertyEditor() {
  if (!propertyEditor) return;

  if (!editorState.selectedNodeId || !editorState.layout) {
    // Clear property editor
    propertyEditor.value = {};
    propertyEditor.schema = undefined;
    propertyEditor.nodeId = null;
    propertiesTitle.innerText = 'Node Properties';
    return;
  }

  try {
    // Get node data from layout definition
    const nodeData = findNodeInDefinition(
      editorState.layoutDefinition.root,
      editorState.selectedNodeId
    );

    if (nodeData) {
      let properties, schema;
      switch (nodeData.type) {
        case 'leaf':
          properties = {
            ...getBaseNodePropertiesWithDefaults(DEFAULT_LEAF_NODE, nodeData),
          };
          schema = LEAF_NODE_SCHEMA;
          break;
        case 'dock':
          properties = {
            ...getBaseNodePropertiesWithDefaults(DEFAULT_DOCK_NODE, nodeData),
          };
          schema = DOCK_NODE_SCHEMA;
          break;
        case 'stack':
          properties = {
            ...getBaseNodePropertiesWithDefaults(DEFAULT_STACK_NODE, nodeData),
            direction: nodeData.direction ?? DEFAULT_STACK_NODE.direction,
            align: nodeData.align ?? DEFAULT_STACK_NODE.align,
            gap: nodeData.gap ?? DEFAULT_STACK_NODE.gap,
          };
          schema = STACK_NODE_SCHEMA;
          break;
      }
      propertyEditor.value = properties;
      propertyEditor.schema = schema;
      propertyEditor.nodeId = nodeData.id;
      propertiesTitle.innerText = `${formatNodeTypeForPropertiesView(
        nodeData.type
      )} Properties`;
    }
  } catch (error) {
    console.error('Error updating property editor:', error);
  }
}

function updateHistoryView() {
  if (!historyView) return;

  try {
    const { history } = editorState;

    // Build history items
    const items = history.snapshots.map(({ action, date }, index) => ({
      id: index.toString(),
      label: (index + 1).toString(),
      data: {
        action,
        date: formatDateForHistoryView(date),
        current: index === history.currentIndex ? '✅' : '⬛',
      },
    }));

    historyView.items = items;

    // Select the current history item
    if (history.currentIndex >= 0 && history.currentIndex < items.length) {
      historyView.deselectAll();
      historyView.selectItem(history.currentIndex.toString());
    }
  } catch (error) {
    console.error('Error updating history view:', error);
  }
}

function updateToolbarButtons() {
  const hasSelection = !!editorState.selectedNodeId;
  const selectedNode = hasSelection
    ? findNodeById(editorState.selectedNodeId)
    : null;
  const selectedNodeParent = hasSelection
    ? findParentNodeById(editorState.selectedNodeId)
    : null;

  // Delete toolbar button enabled when a non-root node is selected
  if (hasSelection) {
    deleteNodeToolbarButton?.removeAttribute('disabled');
  } else {
    deleteNodeToolbarButton?.setAttribute('disabled', '');
  }

  // Undo/redo toolbar buttons enabled when undo/redo available
  if (canUndo()) {
    undoToolbarButton?.removeAttribute('disabled');
  } else {
    undoToolbarButton?.setAttribute('disabled', '');
  }
  if (canRedo()) {
    redoToolbarButton?.removeAttribute('disabled');
  } else {
    redoToolbarButton?.setAttribute('disabled', '');
  }

  // Toolbar buttons
  // Check if a layout is available
  if (editorState.layout) {
    // All buttons enabled
    newDockNodeToolbarButton?.removeAttribute('disabled');
    newStackNodeToolbarButton?.removeAttribute('disabled');
    newLeafNodeToolbarButton?.removeAttribute('disabled');
    newDockNodeToolbarMenu?.removeAttribute('disabled');
    newStackNodeToolbarMenu?.removeAttribute('disabled');
    newLeafNodeToolbarMenu?.removeAttribute('disabled');
    moveNodeFirstButton?.removeAttribute('disabled');
    moveNodeBackwardsButton?.removeAttribute('disabled');
    moveNodeForwardsButton?.removeAttribute('disabled');
    moveNodeLastButton?.removeAttribute('disabled');
  } else {
    // No layout available
    // All buttons disabled
    newDockNodeToolbarButton?.setAttribute('disabled', '');
    newStackNodeToolbarButton?.setAttribute('disabled', '');
    newLeafNodeToolbarButton?.setAttribute('disabled', '');
    newDockNodeToolbarMenu?.setAttribute('disabled', '');
    newStackNodeToolbarMenu?.setAttribute('disabled', '');
    newLeafNodeToolbarMenu?.setAttribute('disabled', '');
    moveNodeFirstButton?.setAttribute('disabled', '');
    moveNodeBackwardsButton?.setAttribute('disabled', '');
    moveNodeForwardsButton?.setAttribute('disabled', '');
    moveNodeLastButton?.setAttribute('disabled', '');

    // New node buttons displayed
    newDockNodeToolbarButton?.classList.remove('hidden');
    newStackNodeToolbarButton?.classList.remove('hidden');
    newLeafNodeToolbarButton?.classList.remove('hidden');

    // New node menus hidden
    newDockNodeToolbarMenu?.classList.add('hidden');
    newStackNodeToolbarMenu?.classList.add('hidden');
    newLeafNodeToolbarMenu?.classList.add('hidden');
  }

  // Layout available and no selection
  if (editorState.layout && !hasSelection) {
    // New node buttons displayed
    newDockNodeToolbarButton?.classList.remove('hidden');
    newStackNodeToolbarButton?.classList.remove('hidden');
    newLeafNodeToolbarButton?.classList.remove('hidden');

    // New node menus hidden
    newDockNodeToolbarMenu?.classList.add('hidden');
    newStackNodeToolbarMenu?.classList.add('hidden');
    newLeafNodeToolbarMenu?.classList.add('hidden');

    // Enable based on root node type
    switch (editorState.layoutDefinition.root.type) {
      case 'leaf':
        newDockNodeToolbarButton?.removeAttribute('disabled');
        newStackNodeToolbarButton?.removeAttribute('disabled');
        newLeafNodeToolbarButton?.setAttribute('disabled', '');
        break;
      case 'dock':
      case 'stack':
        newDockNodeToolbarButton?.setAttribute('disabled', '');
        newStackNodeToolbarButton?.setAttribute('disabled', '');
        newLeafNodeToolbarButton?.setAttribute('disabled', '');
        break;
      default:
        break;
    }
  }

  // Layout available and selection
  if (editorState.layout && hasSelection) {
    switch (selectedNode?.type) {
      case 'leaf':
        // New node buttons displayed
        newDockNodeToolbarButton?.classList.remove('hidden');
        newStackNodeToolbarButton?.classList.remove('hidden');
        newLeafNodeToolbarButton?.classList.remove('hidden');

        // New node buttons enabled (except leaf)
        newDockNodeToolbarButton?.removeAttribute('disabled');
        newStackNodeToolbarButton?.removeAttribute('disabled');
        newLeafNodeToolbarButton?.setAttribute('disabled', '');

        // New node menus hidden
        newDockNodeToolbarMenu?.classList.add('hidden');
        newStackNodeToolbarMenu?.classList.add('hidden');
        newLeafNodeToolbarMenu?.classList.add('hidden');
        break;
      case 'dock':
        // New node buttons hidden
        newDockNodeToolbarButton?.classList.add('hidden');
        newStackNodeToolbarButton?.classList.add('hidden');
        newLeafNodeToolbarButton?.classList.add('hidden');

        // New node menus displayed
        newDockNodeToolbarMenu?.classList.remove('hidden');
        newStackNodeToolbarMenu?.classList.remove('hidden');
        newLeafNodeToolbarMenu?.classList.remove('hidden');
        break;
      case 'stack':
        // New node buttons hidden
        newDockNodeToolbarButton?.classList.remove('hidden');
        newStackNodeToolbarButton?.classList.remove('hidden');
        newLeafNodeToolbarButton?.classList.remove('hidden');

        // New node menus displayed
        newDockNodeToolbarMenu?.classList.add('hidden');
        newStackNodeToolbarMenu?.classList.add('hidden');
        newLeafNodeToolbarMenu?.classList.add('hidden');
        break;
      default:
        break;
    }
  }

  // Move node buttons visible when parent node is stack
  if (
    editorState.layout &&
    hasSelection &&
    selectedNodeParent &&
    selectedNodeParent.type === 'stack'
  ) {
    moveNodeToolbarSeparator?.classList.remove('hidden');
    moveNodeFirstButton?.classList.remove('hidden');
    moveNodeBackwardsButton?.classList.remove('hidden');
    moveNodeForwardsButton?.classList.remove('hidden');
    moveNodeLastButton?.classList.remove('hidden');
  } else {
    moveNodeToolbarSeparator?.classList.add('hidden');
    moveNodeFirstButton?.classList.add('hidden');
    moveNodeBackwardsButton?.classList.add('hidden');
    moveNodeForwardsButton?.classList.add('hidden');
    moveNodeLastButton?.classList.add('hidden');
  }
}

function updateContextMenuButtons() {
  const hasContext = !!editorState.contextNodeId;
  const contextNode = hasContext
    ? findNodeById(editorState.contextNodeId)
    : null;
  const contextNodeParent = hasContext
    ? findParentNodeById(editorState.contextNodeId)
    : null;

  // Check if a layout is available
  if (editorState.layout) {
    // All items enabled
    newDockNodeContextMenuItem?.removeAttribute('disabled');
    newStackNodeContextMenuItem?.removeAttribute('disabled');
    newLeafNodeContextMenuItem?.removeAttribute('disabled');
    newDockNodeContextMenuMenu?.removeAttribute('disabled');
    newStackNodeContextMenuMenu?.removeAttribute('disabled');
    newLeafNodeContextMenuMenu?.removeAttribute('disabled');
    moveNodeFirstContextMenuItem?.removeAttribute('disabled');
    moveNodeBackwardsContextMenuItem?.removeAttribute('disabled');
    moveNodeForwardsContextMenuItem?.removeAttribute('disabled');
    moveNodeLastContextMenuItem?.removeAttribute('disabled');
  } else {
    // No layout available
    // All items disabled
    newDockNodeContextMenuItem?.setAttribute('disabled', '');
    newStackNodeContextMenuItem?.setAttribute('disabled', '');
    newLeafNodeContextMenuItem?.setAttribute('disabled', '');
    newDockNodeContextMenuMenu?.setAttribute('disabled', '');
    newStackNodeContextMenuMenu?.setAttribute('disabled', '');
    newLeafNodeContextMenuMenu?.setAttribute('disabled', '');
    moveNodeFirstContextMenuItem?.setAttribute('disabled', '');
    moveNodeBackwardsContextMenuItem?.setAttribute('disabled', '');
    moveNodeForwardsContextMenuItem?.setAttribute('disabled', '');
    moveNodeLastContextMenuItem?.setAttribute('disabled', '');

    // New node items displayed
    newDockNodeContextMenuItem?.classList.remove('hidden');
    newStackNodeContextMenuItem?.classList.remove('hidden');
    newLeafNodeContextMenuItem?.classList.remove('hidden');

    // New node menus hidden
    newDockNodeContextMenuMenu?.classList.add('hidden');
    newStackNodeContextMenuMenu?.classList.add('hidden');
    newLeafNodeContextMenuMenu?.classList.add('hidden');
  }

  // Layout available and no contextual item clicked
  if (editorState.layout && !hasContext) {
    // New node items displayed
    newDockNodeContextMenuItem?.classList.remove('hidden');
    newStackNodeContextMenuItem?.classList.remove('hidden');
    newLeafNodeContextMenuItem?.classList.remove('hidden');

    // New node menus hidden
    newDockNodeContextMenuMenu?.classList.add('hidden');
    newStackNodeContextMenuMenu?.classList.add('hidden');
    newLeafNodeContextMenuMenu?.classList.add('hidden');

    // New node items disabled
    newDockNodeContextMenuItem?.setAttribute('disabled', '');
    newStackNodeContextMenuItem?.setAttribute('disabled', '');
    newLeafNodeContextMenuItem?.setAttribute('disabled', '');
  }

  // Layout available and contextual item clicked
  if (editorState.layout && hasContext) {
    switch (contextNode?.type) {
      case 'leaf':
        // New node items displayed
        newDockNodeContextMenuItem?.classList.remove('hidden');
        newStackNodeContextMenuItem?.classList.remove('hidden');
        newLeafNodeContextMenuItem?.classList.remove('hidden');

        // New node items enabled (except leaf)
        newDockNodeContextMenuItem?.removeAttribute('disabled');
        newStackNodeContextMenuItem?.removeAttribute('disabled');
        newLeafNodeContextMenuItem?.setAttribute('disabled', '');

        // New node menus hidden
        newDockNodeContextMenuMenu?.classList.add('hidden');
        newStackNodeContextMenuMenu?.classList.add('hidden');
        newLeafNodeContextMenuMenu?.classList.add('hidden');
        break;
      case 'dock':
        // New node items hidden
        newDockNodeContextMenuItem?.classList.add('hidden');
        newStackNodeContextMenuItem?.classList.add('hidden');
        newLeafNodeContextMenuItem?.classList.add('hidden');

        // New node menus displayed
        newDockNodeContextMenuMenu?.classList.remove('hidden');
        newStackNodeContextMenuMenu?.classList.remove('hidden');
        newLeafNodeContextMenuMenu?.classList.remove('hidden');
        break;
      case 'stack':
        // New node items displayed
        newDockNodeContextMenuItem?.classList.remove('hidden');
        newStackNodeContextMenuItem?.classList.remove('hidden');
        newLeafNodeContextMenuItem?.classList.remove('hidden');

        // New node menus hidden
        newDockNodeContextMenuMenu?.classList.add('hidden');
        newStackNodeContextMenuMenu?.classList.add('hidden');
        newLeafNodeContextMenuMenu?.classList.add('hidden');
        break;
      default:
        break;
    }
  }

  // Move node items visible when parent node is stack
  if (
    editorState.layout &&
    hasContext &&
    contextNodeParent &&
    contextNodeParent.type === 'stack'
  ) {
    moveNodeContextMenuSeparator?.classList.remove('hidden');
    moveNodeFirstContextMenuItem?.classList.remove('hidden');
    moveNodeBackwardsContextMenuItem?.classList.remove('hidden');
    moveNodeForwardsContextMenuItem?.classList.remove('hidden');
    moveNodeLastContextMenuItem?.classList.remove('hidden');
  } else {
    moveNodeContextMenuSeparator?.classList.add('hidden');
    moveNodeFirstContextMenuItem?.classList.add('hidden');
    moveNodeBackwardsContextMenuItem?.classList.add('hidden');
    moveNodeForwardsContextMenuItem?.classList.add('hidden');
    moveNodeLastContextMenuItem?.classList.add('hidden');
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

  // Start the render loop
  render();
}

function drawCanvas() {
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
  const styles = getCanvasStyles();
  if (editorState.settings.showGrid) {
    drawGrid(
      { x: 0, y: 0 },
      { x: canvas.width, y: canvas.height },
      {
        stroke: true,
        ...styles[editorState.settings.theme].grid,
        grid: {
          cellSize: editorState.settings.gridSize,
        },
      }
    );
  }

  // Render the layout
  drawLayoutNodes(styles);

  // Draw guide
  drawGuide(styles);

  // Update debug display
  Debug.draw(context);
}

function drawLayoutNodes(styles) {
  if (!editorState.layout) return;

  const nodeIds = editorState.layout.getNodeIds();
  nodeIds.forEach(nodeId => {
    const calculatedNode = editorState.layout.get(nodeId);
    if (calculatedNode) {
      drawNode(calculatedNode, nodeId, styles);
    }
  });
}

function drawNode(calculatedNode, nodeId, styles) {
  const isSelected = editorState.selectedNodeId === nodeId;
  const isHidden = !calculatedNode.visible;

  // Determine which style to use
  let nodeStyle;
  if (isHidden && isSelected) {
    nodeStyle = styles[editorState.settings.theme].selectedHiddenNode;
  } else if (isHidden) {
    nodeStyle = styles[editorState.settings.theme].hiddenNode;
  } else if (isSelected) {
    nodeStyle = styles[editorState.settings.theme].selectedNode;
  } else {
    nodeStyle = styles[editorState.settings.theme].node;
  }

  // Apply opacity if the node is hidden
  if (isHidden) {
    context.save();
    context.globalAlpha = 0.5;
  }

  drawRectangle(
    { x: calculatedNode.left, y: calculatedNode.top },
    { x: calculatedNode.width, y: calculatedNode.height },
    nodeStyle
  );

  if (isSelected) {
    // Draw node ID label with (hidden) suffix if not visible
    const labelText = isHidden ? `${nodeId} (hidden)` : nodeId;
    Debug.marker(
      `${nodeId}-label`,
      labelText,
      {
        x: calculatedNode.left + 4,
        y: calculatedNode.top + 4,
      },
      {
        showMarker: false,
        showLabel: false,
        ...styles[editorState.settings.theme].selectedNodeLabel,
      }
    );

    // Draw center marker
    Debug.marker(`${nodeId}-center`, nodeId, calculatedNode.center, {
      showLabel: false,
      showValue: false,
      ...styles[editorState.settings.theme].selectedNodeCenterMarker,
    });
  }

  // Restore opacity if it was changed
  if (isHidden) {
    context.restore();
  }
}

function drawGuide(styles) {
  if (editorState.settings.showGuide) {
    const guideColour = Color.ColorUtils.rgbaToString(
      Color.ColorUtils.fadeOut(
        Color.ColorUtils.stringToRGBA(editorState.settings.guideColour),
        0.5
      )
    );
    const size = editorState.settings.guideSize;
    const halfSize = { x: size.x / 2, y: size.y / 2 };
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    drawRectangle(
      { x: center.x - halfSize.x, y: center.y - halfSize.y },
      size,
      {
        ...styles.guide,
        strokeColor: guideColour,
      }
    );
  }
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

function generateUniqueId(prefix = 'node') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getCanvasStyles() {
  const colour = Color.ColorUtils.stringToRGBA(editorState.settings.nodeColour);
  const styles = CANVAS_STYLES;
  styles.light.selectedNode.fillColor = Color.ColorUtils.rgbaToString(
    Color.ColorUtils.fadeOut(colour, 0.9)
  );
  styles.light.selectedNode.strokeColor = Color.ColorUtils.rgbaToString(colour);
  styles.light.selectedNodeCenterMarker.markerColour =
    Color.ColorUtils.rgbaToString(colour);
  styles.dark.selectedNode.fillColor = Color.ColorUtils.rgbaToString(
    Color.ColorUtils.fadeOut(colour, 0.9)
  );
  styles.dark.selectedNode.strokeColor = Color.ColorUtils.rgbaToString(colour);
  styles.dark.selectedNodeCenterMarker.markerColour =
    Color.ColorUtils.rgbaToString(colour);
  return styles;
}

function createDockNode() {
  return {
    ...DOCK_NODE,
    id: generateUniqueId('dock'),
  };
}

function createStackNode() {
  return {
    ...STACK_NODE,
    id: generateUniqueId('stack'),
    children: [],
  };
}

function createLeafNode() {
  return {
    ...LEAF_NODE,
    id: generateUniqueId('leaf'),
  };
}

function createLayout() {
  return {
    ...LAYOUT,
    root: createLeafNode(),
  };
}

function newLayout() {
  clearHistory();
  const snapshot = preActionSnapshot('New layout');

  initialiseLayout(createLayout());

  postActionSnapshot(snapshot);

  editorState.layoutName = '';
  editorState.dirty = false;
  saveToolbarButton?.removeAttribute('disabled');
  updateTitle();

  // Show success message
  E2.Toast.success('New layout created!');
}

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
          clearHistory();
          const snapshot = preActionSnapshot('Load layout');

          initialiseLayout(data);

          postActionSnapshot(snapshot);

          editorState.layoutName = file.name.replace(/\.json$/i, '');
          editorState.dirty = false;
          saveToolbarButton?.removeAttribute('disabled');
          updateTitle();

          // Show success message
          E2.Toast.success('Layout loaded successfully!');
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

function initialiseLayout(layoutDefinition) {
  try {
    console.log('Initialising layout:', layoutDefinition);
    editorState.layoutDefinition = layoutDefinition;

    // Create layout instance
    editorState.layout = new Layout(layoutDefinition);
    console.log('Layout instance created:', editorState.layout);

    // Update layout with current canvas size
    if (editorState.canvasSize.x > 0 && editorState.canvasSize.y > 0) {
      editorState.layout.update(editorState.canvasSize);
    }

    // Clear selected node
    editorState.selectedNodeId = null;

    updateTitle();
    updateTreeView();
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();

    console.log('Layout initialised successfully');
    console.log('Available nodes:', editorState.layout.getNodeIds());
  } catch (error) {
    console.error('Error initialising layout:', error);
    return false;
  }

  return true;
}

function updateLayout(layoutDefinition) {
  try {
    console.log('Updating layout:', layoutDefinition);
    editorState.layoutDefinition = layoutDefinition;

    // Create layout instance
    editorState.layout = new Layout(layoutDefinition);
    console.log('Layout instance created:', editorState.layout);

    // Update layout with current canvas size
    if (editorState.canvasSize.x > 0 && editorState.canvasSize.y > 0) {
      editorState.layout.update(editorState.canvasSize);
    }

    console.log('Layout updated successfully');
    console.log('Available nodes:', editorState.layout.getNodeIds());
  } catch (error) {
    console.error('Error updating layout:', error);
    return false;
  }

  return true;
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

  editorState.dirty = false;
  updateTitle();

  // Show success message
  E2.Toast.success('Layout saved successfully!');
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

function findNodeById(id) {
  if (!editorState.layoutDefinition) return null;
  return findNodeInDefinition(editorState.layoutDefinition.root, id);
}

function findParentNodeById(id) {
  if (!editorState.layoutDefinition) return null;
  if (id === editorState.layoutDefinition.root.id) {
    return null; // Root node has no parent
  }
  return findParentNodeInDefinition(editorState.layoutDefinition.root, id);
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

function findParentNodeInDefinition(node, targetId) {
  // Check children based on node type
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
          if (node[position].id === targetId) {
            return node; // Found parent
          }
          const result = findParentNodeInDefinition(node[position], targetId);
          if (result) return result;
        }
      }
      break;
    case 'stack':
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          if (child.id === targetId) {
            return node; // Found parent
          }
          const result = findParentNodeInDefinition(child, targetId);
          if (result) return result;
        }
      }
      break;
  }
  return null;
}

function findNodeIdAtPosition(x, y) {
  if (!editorState.layout) return null;

  const nodeIds = editorState.layout.getNodeIds();

  // Search from smallest to largest nodes (to prioritize child nodes)
  const nodeAreas = nodeIds
    .map(id => {
      const node = editorState.layout.get(id);
      if (!node) return null;
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

function formatDateForHistoryView(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

function formatNodeTypeForPropertiesView(nodeType) {
  return (
    {
      leaf: 'Leaf Node',
      dock: 'Dock Node',
      stack: 'Stack Node',
    }[nodeType] || 'Unknown Node'
  );
}

function getBaseNodePropertiesWithDefaults(defaultNode, nodeData) {
  return {
    id: nodeData.id ?? '',
    offset: {
      ...defaultNode.offset,
      ...nodeData.offset,
    },
    padding: {
      ...defaultNode.padding,
      ...nodeData.padding,
    },
    size: {
      ...defaultNode.size,
      ...nodeData.size,
    },
    minSize: {
      ...defaultNode.minSize,
      ...nodeData.minSize,
    },
    maxSize: {
      ...defaultNode.maxSize,
      ...nodeData.maxSize,
    },
    aspectRatio: nodeData.aspectRatio ?? defaultNode.aspectRatio,
    visible: nodeData.visible ?? defaultNode.visible,
  };
}

function debounce(fn, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

function parseMeasurement(value) {
  if (value === 'auto') return { value: 0, unit: 'auto' };

  const match = value.match(/^([0-9.-]+)(px|%)$/);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2],
    };
  }

  // Default to px
  return { value: 0, unit: 'px' };
}

function calculateNewOffset(originalOffset, delta, parentCalculated, axis) {
  const parsed = parseMeasurement(originalOffset);

  // Auto always means 0
  if (parsed.unit === 'auto') {
    return `${delta}px`;
  }

  // For px, just add the delta
  if (parsed.unit === 'px') {
    return `${Math.round(parsed.value + delta)}px`;
  }

  // For %, calculate relative to parent size
  if (parsed.unit === '%' && parentCalculated) {
    const parentSize =
      axis === 'x' ? parentCalculated.width : parentCalculated.height;
    const currentPx = (parsed.value / 100) * parentSize;
    const newPx = currentPx + delta;
    const newPercent = (newPx / parentSize) * 100;
    return `${Math.round(newPercent * 100) / 100}%`;
  }

  // Fallback to px
  return `${Math.round(parsed.value + delta)}px`;
}

function calculateNewSize(
  originalSize,
  delta,
  currentSizePx,
  parentCalculated,
  axis
) {
  const parsed = parseMeasurement(originalSize);

  // Auto: convert to px with the delta applied
  if (parsed.unit === 'auto') {
    const newSize = currentSizePx + delta;
    return `${Math.max(0, Math.round(newSize))}px`;
  }

  // For px, just add the delta
  if (parsed.unit === 'px') {
    const newSize = parsed.value + delta;
    return `${Math.max(0, Math.round(newSize))}px`;
  }

  // For %, calculate relative to parent size
  if (parsed.unit === '%' && parentCalculated) {
    const parentSize =
      axis === 'x' ? parentCalculated.width : parentCalculated.height;
    const currentPx = (parsed.value / 100) * parentSize;
    const newPx = currentPx + delta;
    const newPercent = (newPx / parentSize) * 100;
    return `${Math.max(0, Math.round(newPercent * 100) / 100)}%`;
  }

  // Fallback to px
  const newSize = currentSizePx + delta;
  return `${Math.max(0, Math.round(newSize))}px`;
}

function updateNodeInDefinition(node, targetId, updatedData) {
  if (node.id === targetId) {
    // Update the node properties
    Object.assign(node, updatedData);
    return true;
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
        if (
          node[position] &&
          updateNodeInDefinition(node[position], targetId, updatedData)
        ) {
          return true;
        }
      }
      break;
    case 'stack':
      if (node.children) {
        for (const child of node.children) {
          if (updateNodeInDefinition(child, targetId, updatedData)) {
            return true;
          }
        }
      }
      break;
  }
  return false;
}

// -----------------------------------------------------------------------------
// Undo/Redo
// -----------------------------------------------------------------------------

function cloneLayoutDefinition(layoutDefinition) {
  return JSON.parse(JSON.stringify(layoutDefinition));
}

function preActionSnapshot(action = 'Unknown') {
  const { history } = editorState;

  // If we're not at the end of the action history, remove everything after
  // current position
  if (history.currentIndex < history.snapshots.length - 1) {
    history.snapshots = history.snapshots.slice(0, history.currentIndex + 1);
    history.snapshots[history.snapshots.length - 1].post =
      cloneLayoutDefinition(editorState.layoutDefinition);
  }

  const snapshot = {
    action,
    date: new Date(),
    pre: cloneLayoutDefinition(editorState.layoutDefinition),
  };

  // Add new snapshot
  history.snapshots.push(snapshot);
  history.currentIndex = history.snapshots.length - 1;

  return snapshot;
}

function postActionSnapshot(snapshot) {
  snapshot.post = cloneLayoutDefinition(editorState.layoutDefinition);
  updateHistoryView();
}

function undo() {
  const { history } = editorState;

  if (history.currentIndex <= 0) {
    console.warn('Nothing to undo');
    return false;
  }

  // Move back one position
  history.currentIndex--;
  const snapshot = history.snapshots[history.currentIndex].post;

  initialiseLayout(snapshot);
  editorState.dirty = true;

  updateTitle();
  updateHistoryView();

  console.log(
    `Undo performed. History: ${history.currentIndex + 1}/${
      history.snapshots.length
    }`
  );

  return true;
}

function redo() {
  const { history } = editorState;

  if (history.currentIndex >= history.snapshots.length - 1) {
    console.warn('Nothing to redo');
    return false;
  }

  // Move forward one position
  history.currentIndex++;
  const snapshot = history.snapshots[history.currentIndex].post;

  // Load the snapshot (preserve history to avoid clearing it)
  initialiseLayout(snapshot);
  editorState.dirty = true;

  updateTitle();
  updateHistoryView();

  console.log(
    `Redo performed. History: ${history.currentIndex + 1}/${
      history.snapshots.length
    }`
  );

  return true;
}

function canUndo() {
  return editorState.history.currentIndex > 0;
}

function canRedo() {
  const { history } = editorState;
  return history.currentIndex < history.snapshots.length - 1;
}

function clearHistory() {
  editorState.history.snapshots = [];
  editorState.history.currentIndex = -1;

  updateHistoryView();

  console.log('History cleared');
}

function jumpToHistoryIndex(targetIndex) {
  const { history } = editorState;

  if (targetIndex < 0 || targetIndex >= history.snapshots.length) {
    console.error('Invalid history index:', targetIndex);
    return false;
  }

  if (targetIndex === history.currentIndex) {
    console.warn('Already at history index:', targetIndex);
    return false;
  }

  // Update current index
  history.currentIndex = targetIndex;
  const snapshot = history.snapshots[targetIndex].post;

  // Load the snapshot (preserve history to avoid clearing it)
  initialiseLayout(snapshot, true);
  editorState.dirty = true;

  console.log(
    `Jumped to history index ${targetIndex + 1}/${history.snapshots.length}`
  );

  updateTitle();
  updateHistoryView();
  updateToolbarButtons();

  return true;
}

// -----------------------------------------------------------------------------
// Node manipulation
// -----------------------------------------------------------------------------

function replaceRootNode(nodeType) {
  if (!editorState.layoutDefinition) {
    console.warn('No layout loaded');
    return;
  }
  if (!['dock', 'stack', 'leaf'].includes(nodeType)) {
    console.warn('Invalid node type:', nodeType);
    return;
  }

  console.log('Replacing root node with type:', nodeType);

  try {
    const snapshot = preActionSnapshot('Replace root node');

    // Create new root node
    let newRootNode;
    switch (nodeType) {
      case 'dock':
        newRootNode = createDockNode();
        break;
      case 'stack':
        newRootNode = createStackNode();
        break;
      case 'leaf':
        newRootNode = createLeafNode();
        break;
    }

    // Replace the root node
    editorState.layoutDefinition.root = {
      ...newRootNode,
      id: editorState.layoutDefinition.root.id, // Preserve original ID
    };

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Clear selection since the root node has changed
    editorState.selectedNodeId = null;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Root node replaced successfully');
  } catch (error) {
    console.error('Error replacing root node:', error);
  }
}

function replaceNode(nodeId, nodeType) {
  if (!editorState.layoutDefinition || !nodeId) {
    console.warn('No node selected for replacement');
    return;
  }
  if (!['dock', 'stack', 'leaf'].includes(nodeType)) {
    console.warn('Invalid node type:', nodeType);
    return;
  }

  console.log('Replacing node', nodeId, 'with type:', nodeType);

  try {
    const snapshot = preActionSnapshot('Replace node');

    // Create new node
    let newNode;
    switch (nodeType) {
      case 'dock':
        newNode = createDockNode();
        break;
      case 'stack':
        newNode = createStackNode();
        break;
      case 'leaf':
        newNode = createLeafNode();
        break;
    }

    // Find parent of the target node
    const parentNode = findParentNodeById(nodeId);
    if (!parentNode) {
      console.error('Cannot replace root node with this method');
      return;
    }

    // Replace the target node in its parent
    let replaced = false;
    switch (parentNode.type) {
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
          if (parentNode[position] && parentNode[position].id === nodeId) {
            parentNode[position] = {
              ...newNode,
              id: nodeId, // Preserve original ID
            };
            replaced = true;
            break;
          }
        }
        break;
      case 'stack':
        if (parentNode.children && Array.isArray(parentNode.children)) {
          for (let i = 0; i < parentNode.children.length; i++) {
            if (parentNode.children[i].id === nodeId) {
              parentNode.children[i] = {
                ...newNode,
                id: nodeId, // Preserve original ID
              };
              replaced = true;
              break;
            }
          }
        }
        break;
    }

    if (!replaced) {
      console.error('Failed to replace node:', nodeId);
      return;
    }

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Select the newly created node
    editorState.selectedNodeId = newNode.id;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Node replaced successfully:', newNode);
  } catch (error) {
    console.error('Error replacing node:', error);
  }
}

function createNodeInStack(parentStackNode, nodeType) {
  if (!editorState.layoutDefinition) {
    console.warn('No layout loaded');
    return;
  }
  if (!parentStackNode || parentStackNode.type !== 'stack') {
    console.warn('Invalid parent stack node');
    return;
  }
  if (!['dock', 'stack', 'leaf'].includes(nodeType)) {
    console.warn('Invalid node type:', nodeType);
    return;
  }

  console.log(
    'Creating node of type',
    nodeType,
    'in stack',
    parentStackNode.id
  );

  try {
    const snapshot = preActionSnapshot('Create node in stack');

    // Create new node
    let newNode;
    switch (nodeType) {
      case 'dock':
        newNode = createDockNode();
        break;
      case 'stack':
        newNode = createStackNode();
        break;
      case 'leaf':
        newNode = createLeafNode();
        break;
    }

    // Add new node to the end of the parent's children array
    parentStackNode.children.push(newNode);

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Select the newly created node
    editorState.selectedNodeId = newNode.id;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Node created successfully in stack:', newNode);
  } catch (error) {
    console.error('Error creating node in stack:', error);
  }
}

function createNodeInDock(parentDockNode, position, nodeType) {
  if (!editorState.layoutDefinition) {
    console.warn('No layout loaded');
    return;
  }
  if (!parentDockNode || parentDockNode.type !== 'dock') {
    console.warn('Invalid parent dock node');
    return;
  }
  if (!['dock', 'stack', 'leaf'].includes(nodeType)) {
    console.warn('Invalid node type:', nodeType);
    return;
  }
  const validPositions = [
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
  if (!validPositions.includes(position)) {
    console.warn('Invalid dock position:', position);
    return;
  }

  console.log(
    'Creating node of type',
    nodeType,
    'in dock',
    parentDockNode.id,
    'at position',
    position
  );

  try {
    const snapshot = preActionSnapshot('Create node in dock');

    // Create new node
    let newNode;
    switch (nodeType) {
      case 'dock':
        newNode = createDockNode();
        break;
      case 'stack':
        newNode = createStackNode();
        break;
      case 'leaf':
        newNode = createLeafNode();
        break;
    }

    // Add new node to the specified position
    parentDockNode[position] = newNode;

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Select the newly created node
    editorState.selectedNodeId = newNode.id;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Node created successfully in dock:', newNode);
  } catch (error) {
    console.error('Error creating node in dock:', error);
  }
}

function moveNodeInStack(parentStackNode, nodeId, movement) {
  // movement = 'first' | 'backwards' | 'forwards' | 'last'

  if (!editorState.layoutDefinition) {
    console.warn('No layout loaded');
    return;
  }
  if (!parentStackNode || parentStackNode.type !== 'stack') {
    console.warn('Invalid parent stack node');
    return;
  }
  if (!nodeId) {
    console.warn('No node selected for movement');
    return;
  }
  if (!['first', 'backwards', 'forwards', 'last'].includes(movement)) {
    console.warn('Invalid movement type:', movement);
    return;
  }

  console.log(
    `Moving node ${nodeId} ${movement} in stack ${parentStackNode.id}`
  );

  try {
    const snapshot = preActionSnapshot('Move node in stack');

    const index = parentStackNode.children.findIndex(n => n.id === nodeId);
    if (index === -1) {
      console.error('Node not found in parent stack:', nodeId);
      return;
    }

    let newIndex = index;
    switch (movement) {
      case 'first':
        newIndex = 0;
        break;
      case 'backwards':
        newIndex = Math.max(0, index - 1);
        break;
      case 'forwards':
        newIndex = Math.min(parentStackNode.children.length - 1, index + 1);
        break;
      case 'last':
        newIndex = parentStackNode.children.length - 1;
        break;
    }

    if (newIndex !== index) {
      const [movedNode] = parentStackNode.children.splice(index, 1);
      parentStackNode.children.splice(newIndex, 0, movedNode);
      editorState.dirty = true;
    } else {
      console.warn('Node is already in the desired position');
    }

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Keep the node selected
    editorState.selectedNodeId = parentStackNode.children[newIndex].id;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Node moved successfully in stack');
  } catch (error) {
    console.error('Error moving node in stack:', error);
  }
}

function updateNode(nodeId, nodeData, propertyName = '') {
  if (!editorState.layoutDefinition || !nodeId) {
    console.warn('No node selected for update');
    return;
  }

  console.log('Updating node:', nodeId, nodeData);

  try {
    const snapshot = preActionSnapshot(`Update ${nodeId} ${propertyName}`);

    // Find the target node
    const targetNode = findNodeInDefinition(
      editorState.layoutDefinition.root,
      nodeId
    );
    if (!targetNode) {
      console.error('Node not found for update:', nodeId);
      return;
    }

    // Update the node's properties
    Object.assign(targetNode, nodeData);

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Keep the node selected
    editorState.selectedNodeId = targetNode.id;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Node updated successfully');
  } catch (error) {
    console.error('Error updating node:', error);
  }
}

function deleteNode(nodeId) {
  if (!editorState.layoutDefinition || !nodeId) {
    console.warn('No node selected for deletion');
    return;
  }

  console.log('Deleting node:', nodeId);

  try {
    const snapshot = preActionSnapshot('Delete node');

    // Special case: if deleting root node, convert it to a leaf
    if (nodeId === editorState.layoutDefinition.root.id) {
      console.log('Converting root node to leaf');
      editorState.layoutDefinition.root = {
        id: nodeId,
        type: 'leaf',
      };
    } else {
      // Find and remove the node from its parent
      const deleted = deleteNodeFromDefinition(
        editorState.layoutDefinition.root,
        nodeId
      );
      if (!deleted) {
        console.error('Failed to delete node:', nodeId);
        return;
      }
    }

    // Reload layout with updated definition (preserve history)
    const updatedDefinition = editorState.layoutDefinition;
    updateLayout(updatedDefinition);

    // Clear selection since the node is gone
    editorState.selectedNodeId = null;
    editorState.dirty = true;

    updateTitle();
    updatePropertyEditor();
    updateStatusBar();
    updateTreeView();
    updateToolbarButtons();

    postActionSnapshot(snapshot);

    console.log('Node deleted successfully');
  } catch (error) {
    console.error('Error deleting node:', error);
  }
}

function deleteNodeFromDefinition(node, targetId) {
  if (!node || node.id === targetId) {
    return false; // Can't delete self or invalid node
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
          if (node[position].id === targetId) {
            // Found the target node, delete it
            delete node[position];
            return true;
          } else {
            // Recursively search in child
            if (deleteNodeFromDefinition(node[position], targetId)) {
              return true;
            }
          }
        }
      }
      break;

    case 'stack':
      if (node.children && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].id === targetId) {
            // Found the target node, remove it from the array
            node.children.splice(i, 1);

            return true;
          } else {
            // Recursively search in child
            if (deleteNodeFromDefinition(node.children[i], targetId)) {
              return true;
            }
          }
        }
      }
      break;

    case 'leaf':
      // Leaf nodes have no children
      break;
  }

  return false;
}

// -----------------------------------------------------------------------------
// Properties editor defaults and schemas
// -----------------------------------------------------------------------------

const DEFAULT_NODE = {
  offset: { x: '0px', y: '0px' },
  padding: { x: '0px', y: '0px' },
  size: { x: 'auto', y: 'auto' },
  minSize: { x: '0px', y: '0px' },
  maxSize: { x: '100%', y: '100%' },
  aspectRatio: 0,
  visible: true,
};

const DEFAULT_DOCK_NODE = {
  ...DEFAULT_NODE,
};

const DEFAULT_STACK_NODE = {
  ...DEFAULT_NODE,
  direction: 'vertical',
  align: 'stretch',
  gap: '0px',
};

const DEFAULT_LEAF_NODE = {
  ...DEFAULT_NODE,
};

const NUMBER_REGEX = '-?[0-9]+(\\.[0-9]+)?';
const POSITIVE_NUMBER_REGEX = '[0-9]+(\\.[0-9]+)?';

const MEASUREMENT_SCHEMA = {
  oneOf: [
    { type: 'string', pattern: `^${NUMBER_REGEX}(px|%)$` },
    { type: 'string', enum: ['auto'] },
  ],
};

const LAYOUT_VEC2_SCHEMA = {
  type: 'object',
  properties: {
    x: MEASUREMENT_SCHEMA,
    y: MEASUREMENT_SCHEMA,
  },
  required: ['x', 'y'],
};

const PARTIAL_LAYOUT_VEC2_SCHEMA = {
  type: 'object',
  properties: {
    x: MEASUREMENT_SCHEMA,
    y: MEASUREMENT_SCHEMA,
  },
};

const POSITIVE_MEASUREMENT_SCHEMA = {
  oneOf: [
    { type: 'string', pattern: `^${POSITIVE_NUMBER_REGEX}(px|%)$` },
    { type: 'string', enum: ['auto'] },
  ],
};

const LAYOUT_POSITIVE_VEC2_SCHEMA = {
  type: 'object',
  properties: {
    x: POSITIVE_MEASUREMENT_SCHEMA,
    y: POSITIVE_MEASUREMENT_SCHEMA,
  },
  required: ['x', 'y'],
};

const PARTIAL_LAYOUT_POSITIVE_VEC2_SCHEMA = {
  type: 'object',
  properties: {
    x: POSITIVE_MEASUREMENT_SCHEMA,
    y: POSITIVE_MEASUREMENT_SCHEMA,
  },
};

const NODE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    offset: LAYOUT_VEC2_SCHEMA,
    padding: LAYOUT_POSITIVE_VEC2_SCHEMA,
    size: PARTIAL_LAYOUT_POSITIVE_VEC2_SCHEMA,
    minSize: PARTIAL_LAYOUT_POSITIVE_VEC2_SCHEMA,
    maxSize: PARTIAL_LAYOUT_POSITIVE_VEC2_SCHEMA,
    aspectRatio: { type: 'number', minimum: 0 },
    visible: { type: 'boolean' },
  },
  required: ['id'],
};

const DOCK_NODE_SCHEMA = {
  ...NODE_SCHEMA,
  properties: {
    ...NODE_SCHEMA.properties,
  },
};

const STACK_NODE_SCHEMA = {
  ...NODE_SCHEMA,
  properties: {
    ...NODE_SCHEMA.properties,
    direction: { type: 'string', enum: ['horizontal', 'vertical'] },
    align: { type: 'string', enum: ['start', 'center', 'end', 'stretch'] },
    gap: MEASUREMENT_SCHEMA,
  },
  required: [...NODE_SCHEMA.required, 'direction'],
};

const LEAF_NODE_SCHEMA = {
  ...NODE_SCHEMA,
  properties: {
    ...NODE_SCHEMA.properties,
  },
};

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

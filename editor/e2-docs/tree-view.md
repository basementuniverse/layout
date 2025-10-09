# TreeView

A hierarchical tree component that displays nested data structures with expand/collapse functionality, item selection, and multi-select capabilities.

## Usage

```html
<e2-tree-view id="myTreeView"></e2-tree-view>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Sets the color theme |
| `disabled` | `boolean` | `false` | Disables the tree view |
| `multi-select` | `boolean` | `false` | Enables multi-item selection |

## Properties

### `items: TreeViewItem[]`
Gets or sets the tree data. Each item should conform to the `TreeViewItem` interface:

```typescript
interface TreeViewItem {
  id: string;           // Unique identifier
  label: string;        // Display text
  icon?: string;        // Optional icon (emoji or text)
  data?: any;          // Optional custom data
  children?: TreeViewItem[]; // Child items
  expanded?: boolean;   // Initial expanded state
  selected?: boolean;   // Initial selected state
  disabled?: boolean;   // Disabled state
}
```

### `selectedItems: TreeViewItem[]` (read-only)
Returns array of currently selected items.

### `selectedIds: string[]` (read-only)
Returns array of currently selected item IDs.

### `multiSelect: boolean`
Gets or sets multi-select mode.

## Methods

### Selection Methods
- `selectItem(itemId: string)` - Select an item by ID
- `deselectItem(itemId: string)` - Deselect an item by ID
- `clearSelection()` - Clear all selections

### Expand/Collapse Methods
- `expandItem(itemId: string)` - Expand an item by ID
- `collapseItem(itemId: string)` - Collapse an item by ID
- `expandAll()` - Expand all items
- `collapseAll()` - Collapse all items

## Events

### `tree-expand`
Fired when an item is expanded.

```typescript
interface TreeViewExpandEvent {
  detail: {
    treeViewId: string;
    treeView: HTMLElement;
    item: TreeViewItem;
    itemId: string;
  }
}
```

### `tree-collapse`
Fired when an item is collapsed.

```typescript
interface TreeViewCollapseEvent {
  detail: {
    treeViewId: string;
    treeView: HTMLElement;
    item: TreeViewItem;
    itemId: string;
  }
}
```

### `tree-selection-change`
Fired when the selection changes.

```typescript
interface TreeViewSelectionChangeEvent {
  detail: {
    treeViewId: string;
    treeView: HTMLElement;
    selectedItems: TreeViewItem[];
    selectedIds: string[];
    addedItems: TreeViewItem[];    // Items added to selection
    removedItems: TreeViewItem[];  // Items removed from selection
  }
}
```

### `tree-item-click`
Fired when an item is clicked.

```typescript
interface TreeViewItemClickEvent {
  detail: {
    treeViewId: string;
    treeView: HTMLElement;
    item: TreeViewItem;
    itemId: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  }
}
```

### `tree-item-dblclick`
Fired when an item is double-clicked.

```typescript
interface TreeViewItemDoubleClickEvent {
  detail: {
    treeViewId: string;
    treeView: HTMLElement;
    item: TreeViewItem;
    itemId: string;
  }
}
```

## Examples

### Basic Tree Structure

```javascript
const treeView = document.querySelector('e2-tree-view');

treeView.items = [
  {
    id: 'folder1',
    label: 'Documents',
    icon: '📁',
    children: [
      {
        id: 'file1',
        label: 'report.pdf',
        icon: '📄'
      },
      {
        id: 'file2',
        label: 'presentation.pptx',
        icon: '📊'
      }
    ]
  },
  {
    id: 'folder2',
    label: 'Images',
    icon: '📁',
    expanded: true, // Initially expanded
    children: [
      {
        id: 'img1',
        label: 'photo.jpg',
        icon: '🖼️',
        selected: true // Initially selected
      }
    ]
  }
];
```

### Multi-Select Mode

```html
<e2-tree-view multi-select></e2-tree-view>
```

```javascript
const treeView = document.querySelector('e2-tree-view');

// Enable multi-select programmatically
treeView.multiSelect = true;

// Listen for selection changes
treeView.addEventListener('tree-selection-change', (e) => {
  console.log(`Selected ${e.detail.selectedItems.length} items:`,
              e.detail.selectedItems.map(item => item.label));
});
```

### Event Handling

```javascript
const treeView = document.querySelector('e2-tree-view');

treeView.addEventListener('tree-expand', (e) => {
  console.log(`Expanded: ${e.detail.item.label}`);
});

treeView.addEventListener('tree-collapse', (e) => {
  console.log(`Collapsed: ${e.detail.item.label}`);
});

treeView.addEventListener('tree-item-click', (e) => {
  console.log(`Clicked: ${e.detail.item.label}`);

  // Handle modifier keys
  if (e.detail.ctrlKey) {
    console.log('Ctrl key was held');
  }
});

treeView.addEventListener('tree-item-dblclick', (e) => {
  console.log(`Double-clicked: ${e.detail.item.label}`);
  // Could trigger editing, opening, etc.
});
```

### Programmatic Control

```javascript
const treeView = document.querySelector('e2-tree-view');

// Expand/collapse programmatically
treeView.expandAll();
treeView.collapseAll();
treeView.expandItem('folder1');
treeView.collapseItem('folder2');

// Selection control
treeView.selectItem('file1');
treeView.selectItem('file2'); // Only works in multi-select mode
treeView.deselectItem('file1');
treeView.clearSelection();

// Get current state
console.log('Selected items:', treeView.selectedItems);
console.log('Selected IDs:', treeView.selectedIds);
```

## CSS Custom Properties

The TreeView component supports various CSS custom properties for theming:

```css
e2-tree-view {
  /* Colors */
  --treeview-bg: #fff;
  --treeview-border: #ccc;
  --treeview-item-hover-bg: #f0f0f0;
  --treeview-item-selected-bg: #0078d4;
  --treeview-item-selected-text: #fff;
  --treeview-expand-hover-bg: rgba(0, 0, 0, 0.1);
  --treeview-guide-color: #ccc;
  --treeview-empty-text: #666;

  /* Dark theme variants */
  --treeview-bg-dark: #1e1e1e;
  --treeview-border-dark: #555;
  --treeview-item-hover-bg-dark: #2d2d2d;
  --treeview-item-selected-bg-dark: #0078d4;
  --treeview-item-selected-text-dark: #fff;
  --treeview-expand-hover-bg-dark: rgba(255, 255, 255, 0.1);
  --treeview-guide-color-dark: #555;
  --treeview-empty-text-dark: #999;

  /* Typography */
  --font-family: system-ui, sans-serif;
  --font-size: 14px;
}
```

## Accessibility

The TreeView component includes basic accessibility features:

- Semantic HTML structure
- Keyboard navigation support (planned)
- ARIA attributes (planned)
- High contrast theme support
- Focus management (planned)

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM v1
- ES6 Classes
- CSS Custom Properties

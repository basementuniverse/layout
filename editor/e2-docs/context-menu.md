# Context Menu Components

The E2 context menu system provides a flexible way to add right-click context menus to your editor applications. The system consists of three components that work together to create rich, interactive context menus.

## Components

### `<e2-context-menu>`

The main container for context menu items.

### `<e2-context-menu-item>`

Individual clickable items within a context menu.

### `<e2-context-menu-separator>`

Visual separator lines between menu items.

## Basic Usage

### Declarative Markup

Define context menus directly in your HTML:

```html
<e2-context-menu id="my-menu" target="#my-element">
  <e2-context-menu-item
    label="Cut"
    icon="✂️"
    shortcut="Ctrl+X"
    value="cut"
  ></e2-context-menu-item>
  <e2-context-menu-item
    label="Copy"
    icon="📋"
    shortcut="Ctrl+C"
    value="copy"
  ></e2-context-menu-item>
  <e2-context-menu-item
    label="Paste"
    icon="📄"
    shortcut="Ctrl+V"
    value="paste"
  ></e2-context-menu-item>
  <e2-context-menu-separator></e2-context-menu-separator>
  <e2-context-menu-item
    label="Properties"
    icon="⚙️"
    value="properties"
  ></e2-context-menu-item>
</e2-context-menu>
```

### Programmatic Control

Show and hide context menus programmatically:

```javascript
const menu = document.querySelector('#my-menu');

// Show at specific coordinates
menu.show(x, y, triggerElement);

// Hide the menu
menu.hide();
```

## Component Reference

### `<e2-context-menu>`

#### Attributes

| Attribute  | Type                          | Default  | Description                                                                    |
| ---------- | ----------------------------- | -------- | ------------------------------------------------------------------------------ |
| `target`   | `string`                      | -        | CSS selector for elements that should trigger this context menu on right-click |
| `theme`    | `'light' \| 'dark' \| 'auto'` | `'auto'` | Visual theme                                                                   |
| `disabled` | `boolean`                     | `false`  | Whether the menu is disabled                                                   |
| `visible`  | `boolean`                     | `false`  | Whether the menu is currently visible (read-only)                              |

#### Properties

```typescript
interface ContextMenu {
  target: string | null;
  theme: Theme;
  disabled: boolean;
  visible: boolean; // read-only
}
```

#### Methods

```typescript
// Show the context menu at specific coordinates
show(x: number, y: number, trigger?: HTMLElement): void;

// Hide the context menu
hide(): void;

// Apply a theme
applyTheme(theme: Theme): void;
```

#### Events

| Event               | Detail                            | Description                   |
| ------------------- | --------------------------------- | ----------------------------- |
| `context-menu-show` | `{ menuId, menu, x, y, trigger }` | Fired when the menu is shown  |
| `context-menu-hide` | `{ menuId, menu }`                | Fired when the menu is hidden |

### `<e2-context-menu-item>`

#### Attributes

| Attribute  | Type                          | Default  | Description                                      |
| ---------- | ----------------------------- | -------- | ------------------------------------------------ |
| `label`    | `string`                      | -        | Text label for the item                          |
| `icon`     | `string`                      | -        | Icon (emoji or text) to display before the label |
| `value`    | `string`                      | `label`  | Value sent in click events                       |
| `shortcut` | `string`                      | -        | Keyboard shortcut text (display only)            |
| `theme`    | `'light' \| 'dark' \| 'auto'` | `'auto'` | Visual theme                                     |
| `disabled` | `boolean`                     | `false`  | Whether the item is disabled                     |

#### Properties

```typescript
interface ContextMenuItem {
  label: string;
  icon: string;
  value: string;
  shortcut: string;
  theme: Theme;
  disabled: boolean;
}
```

#### Methods

```typescript
// Programmatically click the item
click(): void;

// Focus the item
focus(): void;

// Apply a theme
applyTheme(theme: Theme): void;
```

#### Events

| Event                     | Detail                                  | Description                    |
| ------------------------- | --------------------------------------- | ------------------------------ |
| `context-menu-item-click` | `{ itemId, item, menuId, menu, value }` | Fired when the item is clicked |

### `<e2-context-menu-separator>`

#### Attributes

| Attribute | Type                          | Default  | Description  |
| --------- | ----------------------------- | -------- | ------------ |
| `theme`   | `'light' \| 'dark' \| 'auto'` | `'auto'` | Visual theme |

#### Properties

```typescript
interface ContextMenuSeparator {
  theme: Theme;
}
```

## Usage Patterns

### Target-Based Context Menus

Use the `target` attribute to automatically bind context menus to specific elements:

```html
<!-- Menu appears when right-clicking any .toolbar element -->
<e2-context-menu target=".toolbar">
  <e2-context-menu-item
    label="Customize"
    value="customize"
  ></e2-context-menu-item>
  <e2-context-menu-item label="Reset" value="reset"></e2-context-menu-item>
</e2-context-menu>

<!-- Menu appears when right-clicking #editor-area -->
<e2-context-menu target="#editor-area">
  <e2-context-menu-item label="Insert" value="insert"></e2-context-menu-item>
  <e2-context-menu-item label="Format" value="format"></e2-context-menu-item>
</e2-context-menu>
```

### Different Menus for Different Areas

Create multiple context menus for different parts of your application:

```html
<!-- Toolbar context menu -->
<e2-context-menu id="toolbar-menu" target="#toolbar">
  <e2-context-menu-item
    label="Show/Hide Labels"
    value="toggle-labels"
  ></e2-context-menu-item>
  <e2-context-menu-item
    label="Customize..."
    value="customize"
  ></e2-context-menu-item>
</e2-context-menu>

<!-- Canvas context menu -->
<e2-context-menu id="canvas-menu" target="#canvas">
  <e2-context-menu-item
    label="Add Object"
    value="add-object"
  ></e2-context-menu-item>
  <e2-context-menu-item label="Paste" value="paste"></e2-context-menu-item>
  <e2-context-menu-separator></e2-context-menu-separator>
  <e2-context-menu-item label="Clear All" value="clear"></e2-context-menu-item>
</e2-context-menu>

<!-- Properties panel context menu -->
<e2-context-menu id="properties-menu" target="#properties">
  <e2-context-menu-item
    label="Reset to Default"
    value="reset"
  ></e2-context-menu-item>
  <e2-context-menu-item
    label="Copy Properties"
    value="copy-props"
  ></e2-context-menu-item>
</e2-context-menu>
```

### Dynamic Menu Content

Modify menu items dynamically based on application state:

```javascript
const menu = document.querySelector('#dynamic-menu');
const cutItem = menu.querySelector('[value="cut"]');
const copyItem = menu.querySelector('[value="copy"]');
const pasteItem = menu.querySelector('[value="paste"]');

// Update menu based on selection state
function updateContextMenu(hasSelection, hasClipboard) {
  cutItem.disabled = !hasSelection;
  copyItem.disabled = !hasSelection;
  pasteItem.disabled = !hasClipboard;
}

// Listen for context menu show events to update state
document.addEventListener('context-menu-show', e => {
  if (e.detail.menuId === 'dynamic-menu') {
    const hasSelection = getSelectionState();
    const hasClipboard = getClipboardState();
    updateContextMenu(hasSelection, hasClipboard);
  }
});
```

### Handling Menu Actions

Listen for item click events to handle menu actions:

```javascript
document.addEventListener('context-menu-item-click', e => {
  const { value, menuId } = e.detail;

  switch (menuId) {
    case 'toolbar-menu':
      handleToolbarAction(value);
      break;
    case 'canvas-menu':
      handleCanvasAction(value);
      break;
    case 'properties-menu':
      handlePropertiesAction(value);
      break;
  }
});

function handleCanvasAction(action) {
  switch (action) {
    case 'add-object':
      addObjectToCanvas();
      break;
    case 'paste':
      pasteFromClipboard();
      break;
    case 'clear':
      clearCanvas();
      break;
  }
}
```

### Programmatic Menu Control

Show menus programmatically for custom triggers:

```javascript
const customButton = document.querySelector('#custom-button');
const menu = document.querySelector('#custom-menu');

customButton.addEventListener('click', e => {
  const rect = e.target.getBoundingClientRect();
  // Show menu below the button
  menu.show(rect.left, rect.bottom + 5, e.target);
});

// Or show on long press
let longPressTimer;
customButton.addEventListener('mousedown', e => {
  longPressTimer = setTimeout(() => {
    menu.show(e.clientX, e.clientY, e.target);
  }, 500); // 500ms long press
});

customButton.addEventListener('mouseup', () => {
  clearTimeout(longPressTimer);
});
```

## Keyboard Navigation

Context menus support full keyboard navigation:

- **Arrow Keys**: Navigate between items
- **Enter/Space**: Activate the focused item
- **Escape**: Close the menu

## Theming

Context menus support the same theming system as other E2 components:

```javascript
// Set theme programmatically
menu.theme = 'dark';

// Or via attributes
menu.setAttribute('theme', 'light');
```

### CSS Custom Properties

Customize the appearance using CSS custom properties:

```css
:root {
  /* Light theme */
  --context-menu-bg: #ffffff;
  --context-menu-border: #d0d0d0;
  --context-menu-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --context-menu-item-color: #333;
  --context-menu-item-hover-bg: rgba(0, 0, 0, 0.1);
  --context-menu-item-shortcut-color: #666;
  --context-menu-separator-color: #e0e0e0;

  /* Dark theme */
  --context-menu-bg-dark: #2a2a2a;
  --context-menu-border-dark: #444444;
  --context-menu-shadow-dark: 0 2px 8px rgba(0, 0, 0, 0.4);
  --context-menu-item-color-dark: #fff;
  --context-menu-item-hover-bg-dark: rgba(255, 255, 255, 0.1);
  --context-menu-item-shortcut-color-dark: #aaa;
  --context-menu-separator-color-dark: #555;
}
```

## Best Practices

### Menu Organization

- Group related items together
- Use separators to create logical groups
- Place the most common actions at the top
- Disable items that aren't applicable rather than hiding them

### Item Design

- Use clear, descriptive labels
- Include keyboard shortcuts when available
- Use consistent iconography
- Keep menu height reasonable (consider scrolling for very long menus)

### Event Handling

- Always handle `context-menu-item-click` events
- Update menu state before showing (in `context-menu-show` handlers)
- Provide feedback for actions (loading states, confirmations)

### Accessibility

- Ensure all functionality is available via keyboard
- Use semantic HTML in menu items when possible
- Test with screen readers
- Provide alternative access methods for critical functions

## TypeScript Support

The context menu components include full TypeScript definitions:

```typescript
import type {
  ContextMenuShowEvent,
  ContextMenuHideEvent,
  ContextMenuItemClickEvent,
} from '@basementuniverse/e2';

// Type-safe event handling
document.addEventListener(
  'context-menu-item-click',
  (e: ContextMenuItemClickEvent) => {
    const { itemId, value, menuId } = e.detail;
    // TypeScript knows the structure of e.detail
  }
);
```

## Browser Compatibility

Context menus work in all modern browsers that support:

- Custom Elements v1
- Shadow DOM v1
- ES2017+ features

For older browser support, use appropriate polyfills.

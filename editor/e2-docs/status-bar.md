# Status Bar Components

The status bar components provide a horizontal status display typically placed at the bottom of an application window, showing various types of status information, progress indicators, and interactive elements.

## Components

- [`<e2-status-bar>`](#e2-status-bar) - Main status bar container
- [`<e2-status-item>`](#e2-status-item) - Individual status display item
- [`<e2-status-section>`](#e2-status-section) - Sectioned container for organizing items

## `<e2-status-bar>`

A horizontal container that displays status information across three sections (left, center, right) with support for temporary messages and theming.

### Attributes

| Attribute  | Type                          | Default  | Description                                         |
| ---------- | ----------------------------- | -------- | --------------------------------------------------- |
| `theme`    | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode for the status bar                       |
| `disabled` | boolean                       | `false`  | Disables the entire status bar and all its contents |

### Events

#### `status-message`

Fired when a temporary message is shown via the `showMessage()` method.

```typescript
interface StatusMessageEvent extends CustomEvent {
  detail: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    temporary?: boolean;
  };
}
```

### CSS Custom Properties

```css
:root {
  --statusbar-bg: #f8f8f8;
  --statusbar-border: #e0e0e0;
  --statusbar-bg-dark: #252526;
  --statusbar-border-dark: #3e3e42;
  --text-color-dark: #cccccc;
  --font-family: system-ui, sans-serif;
  --font-size-small: 12px;

  /* Temporary message colors */
  --statusbar-info-bg: #e3f2fd;
  --statusbar-info-text: #1565c0;
  --statusbar-success-bg: #e8f5e8;
  --statusbar-success-text: #2e7d32;
  --statusbar-warning-bg: #fff3e0;
  --statusbar-warning-text: #f57c00;
  --statusbar-error-bg: #ffebee;
  --statusbar-error-text: #c62828;

  /* Dark theme message colors */
  --statusbar-info-bg-dark: #1e3a8a;
  --statusbar-info-text-dark: #93c5fd;
  --statusbar-success-bg-dark: #166534;
  --statusbar-success-text-dark: #86efac;
  --statusbar-warning-bg-dark: #92400e;
  --statusbar-warning-text-dark: #fcd34d;
  --statusbar-error-bg-dark: #991b1b;
  --statusbar-error-text-dark: #fca5a5;
}
```

### Usage

```html
<e2-status-bar theme="light">
  <e2-status-section slot="left" position="left">
    <e2-status-item type="indicator" label="Ready" value="●"></e2-status-item>
    <e2-status-item type="text" label="Ln" value="42"></e2-status-item>
    <e2-status-item type="text" label="Col" value="15"></e2-status-item>
  </e2-status-section>

  <e2-status-section slot="center" position="center">
    <e2-status-item
      type="progress"
      label="Loading"
      value="0.7"
    ></e2-status-item>
  </e2-status-section>

  <e2-status-section slot="right" position="right">
    <e2-status-item type="text" label="100%" value=""></e2-status-item>
    <e2-status-item type="text" label="UTF-8" value=""></e2-status-item>
  </e2-status-section>
</e2-status-bar>
```

### TypeScript API

```typescript
// Access the status bar element
const statusBar = document.querySelector('e2-status-bar') as StatusBar;

// Set theme programmatically
statusBar.theme = 'dark';

// Show temporary messages
statusBar.showMessage('File saved successfully!', 'success', 3000);
statusBar.showMessage('Warning: Unsaved changes', 'warning', 5000);
statusBar.showMessage('Processing...', 'info', 0); // No auto-hide

// Hide temporary message manually
statusBar.hideMessage();

// Utility methods for managing sections
const leftItems = statusBar.getItemsInSection('left');
statusBar.clearSection('center');
```

## `<e2-status-item>`

A flexible status display item that can show text, progress indicators, tools, messages, and status indicators with various interaction states.

### Attributes

| Attribute   | Type                                                         | Default  | Description                                    |
| ----------- | ------------------------------------------------------------ | -------- | ---------------------------------------------- |
| `type`      | `'text' \| 'progress' \| 'tool' \| 'message' \| 'indicator'` | `'text'` | The display type of the status item            |
| `value`     | string \| number                                             | `''`     | The primary value displayed by the item        |
| `label`     | string                                                       | `''`     | Optional label text displayed before the value |
| `theme`     | `'light' \| 'dark' \| 'auto'`                                | `'auto'` | Theme mode for the item                        |
| `clickable` | boolean                                                      | `false`  | Makes the item interactive and clickable       |
| `disabled`  | boolean                                                      | `false`  | Disables the item interaction                  |

### Events

#### `status-item-click`

Fired when a clickable status item is clicked (not fired when disabled).

```typescript
interface StatusItemClickEvent extends CustomEvent {
  detail: {
    itemId: string;
    item: HTMLElement;
    itemType: 'text' | 'progress' | 'tool' | 'message' | 'indicator';
    value?: string | number;
  };
}
```

#### `status-item-update`

Fired when the status item's value is programmatically updated.

```typescript
interface StatusItemUpdateEvent extends CustomEvent {
  detail: {
    itemId: string;
    item: HTMLElement;
    oldValue?: string | number;
    newValue?: string | number;
  };
}
```

### CSS Custom Properties

```css
:root {
  --text-color: #333;
  --text-color-dark: #cccccc;
  --status-item-hover-bg: rgba(0, 0, 0, 0.05);
  --status-item-hover-bg-dark: rgba(255, 255, 255, 0.1);
  --status-item-active-bg: rgba(0, 0, 0, 0.1);
  --status-item-active-bg-dark: rgba(255, 255, 255, 0.15);

  /* Progress bar colors */
  --progress-bg: #e0e0e0;
  --progress-bg-dark: #3e3e42;
  --progress-fill: #007acc;
  --progress-fill-dark: #0e7afe;

  /* Tool item colors */
  --tool-item-bg: rgba(0, 120, 204, 0.1);
  --tool-item-color: #007acc;
  --tool-item-border: rgba(0, 120, 204, 0.2);
  --tool-item-bg-dark: rgba(14, 122, 254, 0.15);
  --tool-item-color-dark: #0e7afe;
  --tool-item-border-dark: rgba(14, 122, 254, 0.3);

  /* Indicator colors */
  --indicator-color: #28a745;
  --indicator-color-dark: #40d865;
}
```

### Item Types

#### Text Item

Basic text display with optional label.

```html
<e2-status-item type="text" label="Line" value="42"></e2-status-item>
<e2-status-item type="text" value="UTF-8"></e2-status-item>
```

#### Progress Item

Shows a progress bar with percentage display.

```html
<e2-status-item type="progress" label="Loading" value="0.75"></e2-status-item>
```

#### Tool Item

Displays current tool information with special styling.

```html
<e2-status-item
  type="tool"
  label="Brush"
  value="10px"
  clickable
></e2-status-item>
```

#### Message Item

Shows informational messages with italic styling.

```html
<e2-status-item type="message" value="File saved successfully"></e2-status-item>
```

#### Indicator Item

Displays status indicators with colored dot icons.

```html
<e2-status-item type="indicator" label="Ready" value="●"></e2-status-item>
```

### TypeScript API

```typescript
// Access the status item element
const item = document.querySelector('e2-status-item') as StatusItem;

// Set properties programmatically
item.type = 'progress';
item.label = 'Loading';
item.value = 0.5;
item.clickable = true;

// Progress-specific methods
item.setProgress(0.75); // Set progress to 75%

// Custom icon support
item.setIcon('🎨');

// Listen for events
item.addEventListener('status-item-click', event => {
  console.log('Item clicked:', event.detail.itemId);
});

item.addEventListener('status-item-update', event => {
  console.log(
    'Value changed:',
    event.detail.oldValue,
    '→',
    event.detail.newValue
  );
});
```

## `<e2-status-section>`

A container that organizes status items within specific areas of the status bar (left, center, right) with responsive behavior support.

### Attributes

| Attribute  | Type                            | Default  | Description                    |
| ---------- | ------------------------------- | -------- | ------------------------------ |
| `position` | `'left' \| 'center' \| 'right'` | `'left'` | Position within the status bar |
| `theme`    | `'light' \| 'dark' \| 'auto'`   | `'auto'` | Theme mode for the section     |
| `disabled` | boolean                         | `false`  | Disables the entire section    |

### Usage

```html
<e2-status-bar>
  <e2-status-section slot="left" position="left">
    <e2-status-item type="indicator" label="Ready" value="●"></e2-status-item>
    <e2-status-item type="text" label="Ln" value="42"></e2-status-item>
  </e2-status-section>

  <e2-status-section slot="center" position="center">
    <e2-status-item
      type="message"
      value="Welcome to the editor"
    ></e2-status-item>
  </e2-status-section>

  <e2-status-section slot="right" position="right">
    <e2-status-item
      type="text"
      value="100%"
      data-priority="medium"
    ></e2-status-item>
    <e2-status-item
      type="text"
      value="UTF-8"
      data-priority="low"
    ></e2-status-item>
  </e2-status-section>
</e2-status-bar>
```

### Responsive Behavior

Status sections support responsive behavior through priority attributes:

- `data-priority="high"` - Always visible
- `data-priority="medium"` - Hidden on screens < 480px
- `data-priority="low"` - Hidden on screens < 768px

### TypeScript API

```typescript
// Access the status section element
const section = document.querySelector('e2-status-section') as StatusSection;

// Set position and theme
section.position = 'right';
section.theme = 'dark';

// Manage items programmatically
const statusItem = document.createElement('e2-status-item');
statusItem.type = 'text';
statusItem.value = 'New Item';

section.addItem(statusItem, 'medium'); // Add with medium priority
section.removeItem(statusItem);
section.clear(); // Remove all items

// Query items
const allItems = section.getItems();
const lowPriorityItems = section.getItemsByPriority('low');
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Status Bar Example</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .content {
        flex: 1;
        padding: 20px;
        background: #f5f5f5;
      }

      e2-status-bar {
        position: sticky;
        bottom: 0;
      }
    </style>
  </head>
  <body>
    <div class="content">
      <h1>Editor Application</h1>
      <p>Main application content here...</p>

      <button onclick="simulateProgress()">Start Operation</button>
      <button onclick="changeTool()">Change Tool</button>
      <button onclick="showMessage()">Show Message</button>
    </div>

    <e2-status-bar id="main-status" theme="light">
      <e2-status-section slot="left" position="left">
        <e2-status-item
          id="status-indicator"
          type="indicator"
          label="Ready"
          value="●"
        >
        </e2-status-item>
        <e2-status-item type="text" label="Ln" value="1"></e2-status-item>
        <e2-status-item type="text" label="Col" value="1"></e2-status-item>
      </e2-status-section>

      <e2-status-section slot="center" position="center">
        <e2-status-item
          id="progress"
          type="progress"
          label="Processing"
          value="0"
          style="display: none;"
        >
        </e2-status-item>
      </e2-status-section>

      <e2-status-section slot="right" position="right">
        <e2-status-item
          id="current-tool"
          type="tool"
          label="Tool"
          value="Select"
          clickable
        >
        </e2-status-item>
        <e2-status-item
          type="text"
          label="Zoom"
          value="100%"
          clickable
          data-priority="medium"
        >
        </e2-status-item>
        <e2-status-item type="text" value="UTF-8" data-priority="low">
        </e2-status-item>
      </e2-status-section>
    </e2-status-bar>

    <script src="../build/e2.min.js"></script>
    <script>
      const statusBar = document.getElementById('main-status');
      const progressItem = document.getElementById('progress');
      const toolItem = document.getElementById('current-tool');

      // Event listeners
      document.addEventListener('status-item-click', event => {
        const { itemId, itemType, value } = event.detail;
        console.log(`Status item clicked: ${itemId} (${itemType}) - ${value}`);

        if (itemId === 'current-tool') {
          changeTool();
        }
      });

      document.addEventListener('status-message', event => {
        const { message, type } = event.detail;
        console.log(`Status message (${type}): ${message}`);
      });

      // Demo functions
      function simulateProgress() {
        progressItem.style.display = 'inline-flex';
        let progress = 0;

        const interval = setInterval(() => {
          progress += 0.1;
          progressItem.setProgress(progress);

          if (progress >= 1) {
            clearInterval(interval);
            statusBar.showMessage('Operation completed!', 'success', 3000);
            setTimeout(() => {
              progressItem.style.display = 'none';
              progressItem.setProgress(0);
            }, 1000);
          }
        }, 200);
      }

      function changeTool() {
        const tools = ['Select', 'Brush', 'Eraser', 'Fill', 'Text'];
        const current = toolItem.value;
        const currentIndex = tools.indexOf(current);
        const nextIndex = (currentIndex + 1) % tools.length;

        toolItem.value = tools[nextIndex];
        statusBar.showMessage(
          `Tool changed to ${tools[nextIndex]}`,
          'info',
          2000
        );
      }

      function showMessage() {
        const messages = [
          { text: 'File saved successfully!', type: 'success' },
          { text: 'Warning: Unsaved changes', type: 'warning' },
          { text: 'Processing image...', type: 'info' },
          { text: 'Error: Operation failed', type: 'error' },
        ];

        const msg = messages[Math.floor(Math.random() * messages.length)];
        statusBar.showMessage(msg.text, msg.type, 3000);
      }

      // Initialize
      statusBar.showMessage('Application ready', 'info', 2000);
    </script>
  </body>
</html>
```

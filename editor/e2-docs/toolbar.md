# Toolbar Components

The toolbar components provide a horizontal container for buttons and other controls, commonly used in desktop-like applications for tool palettes and action bars.

## Components

- [`<e2-toolbar>`](#e2-toolbar) - Toolbar container
- [`<e2-toolbar-button>`](#e2-toolbar-button) - Interactive toolbar button
- [`<e2-toolbar-separator>`](#e2-toolbar-separator) - Visual separator

## `<e2-toolbar>`

A horizontal container that groups toolbar buttons and other controls with consistent spacing and theming.

### Attributes

| Attribute  | Type                          | Default  | Description                                      |
| ---------- | ----------------------------- | -------- | ------------------------------------------------ |
| `theme`    | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode for the toolbar                       |
| `disabled` | boolean                       | `false`  | Disables the entire toolbar and all its contents |

### CSS Custom Properties

```css
:root {
  --toolbar-bg: #f0f0f0;
  --toolbar-border: #ccc;
  --toolbar-bg-dark: #2d2d2d;
  --toolbar-border-dark: #555;
  --text-color-dark: #fff;
  --font-family: system-ui, sans-serif;
  --font-size: 14px;
}
```

### Usage

```html
<e2-toolbar theme="light">
  <e2-toolbar-button label="New" icon="📄"></e2-toolbar-button>
  <e2-toolbar-button label="Open" icon="📁"></e2-toolbar-button>
  <e2-toolbar-button label="Save" icon="💾"></e2-toolbar-button>
  <e2-toolbar-separator></e2-toolbar-separator>
  <e2-toolbar-button label="Play" icon="▶️"></e2-toolbar-button>
  <e2-toolbar-button label="Stop" icon="⏹️" disabled></e2-toolbar-button>
</e2-toolbar>
```

### TypeScript API

```typescript
// Access the toolbar element
const toolbar = document.querySelector('e2-toolbar') as Toolbar;

// Set theme programmatically
toolbar.theme = 'dark';

// Disable the entire toolbar
toolbar.setAttribute('disabled', '');
```

## `<e2-toolbar-button>`

An interactive button designed for use within toolbars, supporting icons, labels, and various states.

### Attributes

| Attribute  | Type                          | Default  | Description                                        |
| ---------- | ----------------------------- | -------- | -------------------------------------------------- |
| `label`    | string                        | `''`     | Text label displayed on the button                 |
| `icon`     | string                        | `''`     | Icon character or emoji displayed before the label |
| `theme`    | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode for the button                          |
| `disabled` | boolean                       | `false`  | Disables the button interaction                    |
| `active`   | boolean                       | `false`  | Shows the button in an active/pressed state        |

### Events

#### `toolbar-button-click`

Fired when the button is clicked (not fired when disabled).

```typescript
interface ToolbarButtonClickEvent extends CustomEvent {
  detail: {
    buttonId: string;
    button: HTMLElement;
  };
}
```

### CSS Custom Properties

```css
:root {
  --button-hover-bg: rgba(0, 0, 0, 0.1);
  --button-active-bg: rgba(0, 0, 0, 0.2);
  --button-hover-bg-dark: rgba(255, 255, 255, 0.1);
  --button-active-bg-dark: rgba(255, 255, 255, 0.2);
  --text-color: #333;
  --text-color-dark: #fff;
}
```

### Usage

```html
<!-- Icon only -->
<e2-toolbar-button icon="🎨"></e2-toolbar-button>

<!-- Label only -->
<e2-toolbar-button label="Export"></e2-toolbar-button>

<!-- Icon and label -->
<e2-toolbar-button icon="💾" label="Save"></e2-toolbar-button>

<!-- Different states -->
<e2-toolbar-button icon="▶️" label="Play" active></e2-toolbar-button>
<e2-toolbar-button icon="⏸️" label="Pause" disabled></e2-toolbar-button>
```

### TypeScript API

```typescript
// Access the button element
const button = document.querySelector('e2-toolbar-button') as ToolbarButton;

// Set properties programmatically
button.label = 'New Label';
button.icon = '🎯';
button.active = true;

// Listen for click events
button.addEventListener('toolbar-button-click', event => {
  console.log('Button clicked:', event.detail.buttonId);
});
```

## `<e2-toolbar-separator>`

A visual separator that creates a thin vertical line between toolbar items.

### Attributes

| Attribute | Type                          | Default  | Description                  |
| --------- | ----------------------------- | -------- | ---------------------------- |
| `theme`   | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode for the separator |

### CSS Custom Properties

```css
:root {
  --separator-color: #ccc;
  --separator-color-dark: #555;
}
```

### Usage

```html
<e2-toolbar>
  <e2-toolbar-button icon="📄" label="New"></e2-toolbar-button>
  <e2-toolbar-button icon="📁" label="Open"></e2-toolbar-button>

  <e2-toolbar-separator></e2-toolbar-separator>

  <e2-toolbar-button icon="✂️" label="Cut"></e2-toolbar-button>
  <e2-toolbar-button icon="📋" label="Copy"></e2-toolbar-button>
</e2-toolbar>
```

### TypeScript API

```typescript
// Access the separator element
const separator = document.querySelector(
  'e2-toolbar-separator'
) as ToolbarSeparator;

// Set theme programmatically
separator.theme = 'dark';
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Toolbar Example</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 20px;
      }

      /* Custom toolbar styling */
      e2-toolbar {
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h1>Editor Toolbar</h1>

    <e2-toolbar theme="light">
      <!-- File operations -->
      <e2-toolbar-button id="new-btn" icon="📄" label="New"></e2-toolbar-button>
      <e2-toolbar-button
        id="open-btn"
        icon="📁"
        label="Open"
      ></e2-toolbar-button>
      <e2-toolbar-button
        id="save-btn"
        icon="💾"
        label="Save"
      ></e2-toolbar-button>

      <e2-toolbar-separator></e2-toolbar-separator>

      <!-- Edit operations -->
      <e2-toolbar-button id="cut-btn" icon="✂️" label="Cut"></e2-toolbar-button>
      <e2-toolbar-button
        id="copy-btn"
        icon="📋"
        label="Copy"
      ></e2-toolbar-button>
      <e2-toolbar-button
        id="paste-btn"
        icon="📄"
        label="Paste"
      ></e2-toolbar-button>

      <e2-toolbar-separator></e2-toolbar-separator>

      <!-- Playback controls -->
      <e2-toolbar-button
        id="play-btn"
        icon="▶️"
        label="Play"
      ></e2-toolbar-button>
      <e2-toolbar-button
        id="pause-btn"
        icon="⏸️"
        label="Pause"
        disabled
      ></e2-toolbar-button>
      <e2-toolbar-button
        id="stop-btn"
        icon="⏹️"
        label="Stop"
        disabled
      ></e2-toolbar-button>
    </e2-toolbar>

    <script src="../build/e2.min.js"></script>
    <script>
      // Add event listeners
      document.addEventListener('toolbar-button-click', event => {
        const { buttonId, button } = event.detail;
        console.log(`Button clicked: ${buttonId}`);

        // Example: Toggle play/pause buttons
        if (buttonId === 'play-btn') {
          button.active = true;
          document.getElementById('pause-btn').removeAttribute('disabled');
          document.getElementById('stop-btn').removeAttribute('disabled');
        } else if (buttonId === 'pause-btn') {
          document.getElementById('play-btn').active = false;
        }
      });
    </script>
  </body>
</html>
```

# Design Token to CSS Conversion

This folder contains a conversion system for design tokens that transforms your Figma design tokens (JSON) into CSS variables.

## Files

- **convert-tokens-to-css.js** - JavaScript script that performs the conversion
- **color-tokens.tokens.json** - Source file with color design tokens (primitive colors and color roles)
- **design-tokens.tokens.json** - Source file with typography tokens
- **colors.css** - Generated CSS file with all color variables and semantic color roles
- **typography.css** - Generated CSS file with typography variables and utility classes

## Color System Architecture

The color system is organized into two layers:

### 1. **Primitive Colors** (Available in colors.css)
These are the base colors from your design system:
- `--color-primary-color-0` to `--color-primary-color-5` - Primary color palette
- `--color-secondary-0` to `--color-secondary-2` - Secondary color palette
- `--color-accent-0` to `--color-accent-5` - Accent color palette
- `--color-error-0`, `--color-error-1` - Error states
- `--color-success-0` to `--color-success-2` - Success states
- `--color-warning` - Warning state
- `--color-background` - Background color

### 2. **Color Roles** (Available in colors.css)
These are semantic colors that your **UI should use**:
- `--color-role-primary` - Primary brand color (most saturated primary shade)
- `--color-role-secondary` - Secondary brand color
- `--color-role-accent` - Accent color
- `--color-role-background` - Background color
- `--color-role-error` - Error color (saturated)
- `--color-role-error-light` - Light error color (for backgrounds)
- `--color-role-success` - Success color (saturated)
- `--color-role-success-light` - Light success color (for backgrounds)
- `--color-role-warning` - Warning color

## Typography System

The typography system provides:

### Individual CSS Variables
All typography properties are available as individual variables:
- `--typography-{style-name}-font-size`
- `--typography-{style-name}-font-family`
- `--typography-{style-name}-font-weight`
- `--typography-{style-name}-line-height`
- `--typography-{style-name}-letter-spacing`

Example: `--typography-headline-large-font-size`, `--typography-body-medium-font-family`

### Utility Classes
Pre-built typography classes for easy use in HTML:
- `.typography-display-large`, `.typography-display-medium`, `.typography-display-small`
- `.typography-headline-large`, `.typography-headline-medium`, `.typography-headline-small`
- `.typography-title-large`, `.typography-title-medium`, `.typography-title-small`
- `.typography-body-large`, `.typography-body-medium`, `.typography-body-small`
- `.typography-label-large`, `.typography-label-medium`, `.typography-label-small`

## Usage Examples

### In HTML/CSS

**Using color roles:**
```css
button {
  background-color: var(--color-role-primary);
  color: white;
}

.error-message {
  color: var(--color-role-error);
  background-color: var(--color-role-error-light);
}
```

**Using typography classes:**
```html
<h1 class="typography-headline-large">Page Title</h1>
<p class="typography-body-medium">Regular text content</p>
```

**Using typography variables:**
```css
.custom-heading {
  font-size: var(--typography-headline-medium-font-size);
  font-family: var(--typography-headline-medium-font-family);
  font-weight: var(--typography-headline-medium-font-weight);
  line-height: var(--typography-headline-medium-line-height);
}
```

## Regenerating CSS Files

When you update your design tokens in the JSON files, regenerate the CSS files by running:

```bash
node convert-tokens-to-css.js
```

This will update both `colors.css` and `typography.css` with the latest token values.

## Integration

To use these CSS files in your project:

1. **In HTML:** Link both CSS files
```html
<link rel="stylesheet" href="colors.css">
<link rel="stylesheet" href="typography.css">
```

2. **In CSS:** Import them at the top of your stylesheet
```css
@import 'colors.css';
@import 'typography.css';
```

3. **In JavaScript/CSS-in-JS:** Reference the CSS variables directly
```javascript
const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-role-primary');
```

## Notes

- All color values are in hex format with alpha channels (RGBA)
- Typography line heights are in pixels but represent actual pixel values
- The converter automatically converts spaces in token names to hyphens (e.g., "primary color" becomes "primary-color")
- Color roles are mapped to the most saturated shades from the primitive palettes for maximum contrast

const fs = require('fs');
const path = require('path');

// Read token files
const colorTokens = JSON.parse(fs.readFileSync('./color-tokens.tokens.json', 'utf8'));
const designTokens = JSON.parse(fs.readFileSync('./design-tokens.tokens.json', 'utf8'));

// Convert color tokens to CSS variables
function convertColorTokens(colorTokens) {
  let css = `/* Color Design System - CSS Variables */\n`;
  css += `/* Generated from color-tokens.tokens.json */\n\n`;
  css += `:root {\n`;

  // Process color roles and primitive colors
  for (const [colorName, colorValue] of Object.entries(colorTokens.color)) {
    // Check if it has nested shades (like primary color, secondary, accent)
    if (typeof colorValue === 'object' && colorValue.type === undefined) {
      // Has sub-colors (0, 1, 2, etc.)
      for (const [shade, shadeValue] of Object.entries(colorValue)) {
        if (shadeValue.value) {
          // Convert camelCase to kebab-case
          const variableName = camelToKebab(colorName);
          css += `  --color-${variableName}-${shade}: ${shadeValue.value};\n`;
        }
      }
    } else if (colorValue.type === 'color') {
      // Single color (like background, warning, error)
      const variableName = camelToKebab(colorName);
      css += `  --color-${variableName}: ${colorValue.value};\n`;
    }
  }

  css += `}\n\n`;
  css += `/* Color Roles - Semantic Colors for UI */\n`;
  css += `/* These color roles are what your application should use */\n`;
  css += `/* They reference the appropriate shade from the primitive colors */\n`;
  css += `:root {\n`;

  // Define color roles that the UI will use
  // For single colors, use as-is
  // For multi-shade colors, typically use the most saturated version
  if (colorTokens.color.background) {
    css += `  --color-role-background: var(--color-background);\n`;
  }
  
  // For error, use shade 1 (most saturated)
  if (colorTokens.color.error) {
    css += `  --color-role-error: var(--color-error-1);\n`;
    css += `  --color-role-error-light: var(--color-error-0);\n`;
  }
  
  // For success, use shade 2 (most saturated)
  if (colorTokens.color.success) {
    css += `  --color-role-success: var(--color-success-2);\n`;
    css += `  --color-role-success-light: var(--color-success-0);\n`;
  }
  
  // For warning, single color
  if (colorTokens.color.warning) {
    css += `  --color-role-warning: var(--color-warning);\n`;
  }
  
  // For primary, secondary, accent - use the most saturated shades
  if (colorTokens.color['primary color']) {
    css += `  --color-role-primary: var(--color-primary-color-2);\n`;
  }
  if (colorTokens.color.secondary) {
    css += `  --color-role-secondary: var(--color-secondary-2);\n`;
  }
  if (colorTokens.color.accent) {
    css += `  --color-role-accent: var(--color-accent-5);\n`;
  }

  css += `}\n`;

  return css;
}

// Convert typography tokens to CSS variables
function convertTypographyTokens(designTokens) {
  let css = `/* Typography Design System - CSS Variables */\n`;
  css += `/* Generated from design-tokens.tokens.json */\n\n`;
  css += `:root {\n`;

  // Process typography section with individual properties
  if (designTokens.typography) {
    for (const [typeName, typeValue] of Object.entries(designTokens.typography)) {
      const variableName = camelToKebab(typeName);

      // Add individual properties
      if (typeValue.fontSize?.value !== undefined) {
        css += `  --typography-${variableName}-font-size: ${typeValue.fontSize.value}px;\n`;
      }
      if (typeValue.fontFamily?.value) {
        css += `  --typography-${variableName}-font-family: ${typeValue.fontFamily.value};\n`;
      }
      if (typeValue.fontWeight?.value !== undefined) {
        css += `  --typography-${variableName}-font-weight: ${typeValue.fontWeight.value};\n`;
      }
      if (typeValue.lineHeight?.value !== undefined) {
        css += `  --typography-${variableName}-line-height: ${typeValue.lineHeight.value}px;\n`;
      }
      if (typeValue.letterSpacing?.value !== undefined) {
        css += `  --typography-${variableName}-letter-spacing: ${typeValue.letterSpacing.value}px;\n`;
      }
      if (typeValue.fontStyle?.value) {
        css += `  --typography-${variableName}-font-style: ${typeValue.fontStyle.value};\n`;
      }
      if (typeValue.textDecoration?.value) {
        css += `  --typography-${variableName}-text-decoration: ${typeValue.textDecoration.value};\n`;
      }
    }
  }

  css += `}\n\n`;

  // Create CSS classes for typography styles
  css += `/* Typography Style Classes */\n`;
  css += `/* Use these classes for consistent typography across your application */\n\n`;

  if (designTokens.typography) {
    for (const [typeName, typeValue] of Object.entries(designTokens.typography)) {
      const variableName = camelToKebab(typeName);
      const className = variableName;

      css += `.typography-${className} {\n`;

      if (typeValue.fontSize?.value !== undefined) {
        css += `  font-size: var(--typography-${variableName}-font-size);\n`;
      }
      if (typeValue.fontFamily?.value) {
        css += `  font-family: var(--typography-${variableName}-font-family);\n`;
      }
      if (typeValue.fontWeight?.value !== undefined) {
        css += `  font-weight: var(--typography-${variableName}-font-weight);\n`;
      }
      if (typeValue.lineHeight?.value !== undefined) {
        css += `  line-height: var(--typography-${variableName}-line-height);\n`;
      }
      if (typeValue.letterSpacing?.value !== undefined) {
        css += `  letter-spacing: var(--typography-${variableName}-letter-spacing);\n`;
      }
      if (typeValue.fontStyle?.value && typeValue.fontStyle.value !== 'normal') {
        css += `  font-style: var(--typography-${variableName}-font-style);\n`;
      }
      if (typeValue.textDecoration?.value && typeValue.textDecoration.value !== 'none') {
        css += `  text-decoration: var(--typography-${variableName}-text-decoration);\n`;
      }

      css += `}\n\n`;
    }
  }

  return css;
}

// Utility function to convert camelCase to kebab-case and handle spaces
function camelToKebab(str) {
  // Replace spaces with hyphens, then convert camelCase to kebab-case
  return str
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2') // Convert camelCase
    .toLowerCase();
}

// Generate CSS files
try {
  const colorCSS = convertColorTokens(colorTokens);
  const typographyCSS = convertTypographyTokens(designTokens);

  // Write to CSS files
  fs.writeFileSync('./colors.css', colorCSS);
  fs.writeFileSync('./typography.css', typographyCSS);

  console.log('✅ Successfully converted tokens to CSS files:');
  console.log('   - colors.css');
  console.log('   - typography.css');
} catch (error) {
  console.error('❌ Error converting tokens:', error.message);
  process.exit(1);
}

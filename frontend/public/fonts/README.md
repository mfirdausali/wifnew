# Font Files Required

The design system requires the following font files to be placed in this directory:

## Inter Font
- **File**: `inter-var.woff2`
- **Download from**: https://github.com/rsms/inter/releases
- Download the "Inter Variable" font file

## JetBrains Mono Font
- **File**: `jetbrains-mono-regular.woff2`
- **Download from**: https://www.jetbrains.com/lp/mono/
- Download the regular weight in WOFF2 format

## Installation Steps

1. Download the font files from the links above
2. Place them in this `/public/fonts/` directory
3. The font-face declarations in the design system will automatically load them

## Alternative: Use CDN

If you prefer to use a CDN instead of hosting the fonts locally, update the font-face declarations in `/styles/design-system/base.css` to use these URLs:

```css
/* Inter from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

/* JetBrains Mono from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');
```

Then remove the @font-face declarations from the base.css file.
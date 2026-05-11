# 🎨 MediaVault Design System Guide

## 📦 Quick Reference to GitHub

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: MediaVault platform with design system

- 26 pages with full routing
- @figma/astraui-kit integration
- CSS variables for design tokens
- MediaVault brand colors (#F5C800)
- Responsive Tailwind CSS"

# 4. Create GitHub repo at https://github.com/new

# 5. Push to GitHub (replace USERNAME/REPO)
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

---

## 🎯 Design System Setup Status

### ✅ Already Installed
- `@figma/astraui-kit` (v0.1.3)
- CSS variables defined in `src/styles/theme.css`

### ⚠️ Needs Integration
- [ ] Install `@figma/astraui` package
- [ ] Import astraui styles
- [ ] Wrap app with ThemeProvider
- [ ] Use CSS variables consistently

---

## 📝 Step-by-Step Integration

### 1. Install Required Package

```bash
pnpm add @figma/astraui@1.0.0
```

Or manually add to `package.json`:

```json
{
  "dependencies": {
    "@figma/astraui": "1.0.0",
    "@figma/astraui-kit": "0.1.3"
  }
}
```

### 2. Import Astra UI Styles

Update `src/styles/index.css`:

```css
/* Import Astra UI styles FIRST */
@import '@figma/astraui/styles.css';

/* Then import other styles */
@import './fonts.css';
@import './theme.css';
@import './tailwind.css';
```

### 3. Wrap App with ThemeProvider

Update `src/app/App.tsx`:

```tsx
import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@figma/astraui';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
```

### 4. Use Theme Hook in Components

Example for theme toggle button:

```tsx
import { useTheme } from '@figma/astraui';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

---

## 🎨 CSS Variables Reference

### MediaVault Colors

```css
/* Primary Brand */
--mv-yellow: #F5C800         /* Electric yellow - main brand color */
--primary: #F5C800            /* Primary CTA, highlights */

/* Backgrounds */
--mv-dark-bg: #0A0A0A        /* Main dark background */
--mv-card-1: #141414          /* Card surface level 1 */
--mv-card-2: #1A1A1A          /* Card surface level 2 */

/* Text & Borders */
--mv-muted: #888888           /* Secondary/muted text */
--mv-border: #2A2A2A          /* Subtle borders */

/* Status Colors */
--mv-success: #22C55E         /* Success states */
--mv-warning: #F97316         /* Warning states */
--mv-error: #EF4444           /* Error states */
--mv-info: #3B82F6            /* Info states */
```

### Usage in Components

**❌ BAD - Hardcoded colors:**
```tsx
<div className="bg-[#0A0A0A] text-[#F5C800]">
  ...
</div>
```

**✅ GOOD - Using CSS variables:**
```tsx
<div className="bg-[var(--mv-dark-bg)] text-[var(--mv-yellow)]">
  ...
</div>
```

**✨ BEST - Using Tailwind classes:**
```tsx
<div className="bg-background text-primary">
  ...
</div>
```

---

## 🔤 Typography System

### Font Families

```css
/* Defined in src/styles/fonts.css */
--font-headline: 'Bebas Neue', sans-serif;
--font-body: 'DM Sans', sans-serif;
```

### Usage

**❌ BAD - Inline styles:**
```tsx
<h1 style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
  Title
</h1>
```

**✅ GOOD - Using CSS variable:**
```tsx
<h1 style={{ fontFamily: 'var(--font-headline)' }}>
  Title
</h1>
```

**✨ BEST - Using Tailwind (define in tailwind.config):**
```tsx
<h1 className="font-headline text-5xl">
  Title
</h1>
```

### Font Sizes (From theme.css)

```css
--text-xs: 0.75rem       /* 12px */
--text-sm: 0.875rem      /* 14px */
--text-base: 1rem        /* 16px */
--text-lg: 1.125rem      /* 18px */
--text-xl: 1.25rem       /* 20px */
--text-2xl: 1.5rem       /* 24px */
--text-3xl: 1.875rem     /* 30px */
--text-4xl: 2.25rem      /* 36px */
--text-5xl: 3rem         /* 48px */
```

---

## 📏 Spacing & Borders

### Border Radius

```css
--radius-sm: 0.25rem    /* 4px - small elements */
--radius-md: 0.425rem   /* ~7px - medium */
--radius-lg: 0.625rem   /* 10px - cards */
--radius-xl: 1.025rem   /* ~16px - large cards */
```

**Usage:**
```tsx
/* Cards */
<div className="rounded-[var(--radius-lg)]">...</div>

/* Buttons */
<button className="rounded-lg">...</button>

/* Pills */
<span className="rounded-full">...</span>
```

### Border Width

```tsx
<div className="border border-[var(--mv-border)]">...</div>
```

---

## 🎯 Component Pattern Examples

### Button Component

```tsx
// ❌ BAD - Hardcoded
<button className="px-6 py-3 bg-[#F5C800] text-black rounded-lg">
  Click me
</button>

// ✅ GOOD - Using CSS variables
<button className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-lg)]">
  Click me
</button>

// ✨ BEST - Using Tailwind classes
<button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:shadow-[0_0_20px_var(--primary)]">
  Click me
</button>
```

### Card Component

```tsx
// ✅ GOOD
<div className="bg-[var(--mv-card-1)] border border-[var(--mv-border)] rounded-[var(--radius-lg)] p-6">
  <h3 className="text-[var(--foreground)] font-[var(--font-weight-medium)]">
    Card Title
  </h3>
  <p className="text-[var(--mv-muted)]">
    Card description
  </p>
</div>

// ✨ BEST
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-card-foreground font-medium">
    Card Title
  </h3>
  <p className="text-muted">
    Card description
  </p>
</div>
```

### Status Badge

```tsx
// Using status colors
<span className="px-3 py-1 bg-[var(--mv-success)] text-white rounded-full">
  Available
</span>

<span className="px-3 py-1 bg-[var(--mv-warning)] text-white rounded-full">
  Pending
</span>

<span className="px-3 py-1 bg-[var(--mv-error)] text-white rounded-full">
  Error
</span>
```

---

## 📋 Update Checklist

Use this to refactor existing components:

### Colors
- [ ] Replace `#0A0A0A` → `var(--mv-dark-bg)` or `bg-background`
- [ ] Replace `#141414` → `var(--mv-card-1)` or `bg-card`
- [ ] Replace `#1A1A1A` → `var(--mv-card-2)`
- [ ] Replace `#F5C800` → `var(--mv-yellow)` or `bg-primary`
- [ ] Replace `#888888` → `var(--mv-muted)` or `text-muted`
- [ ] Replace `#2A2A2A` → `var(--mv-border)` or `border-border`

### Typography
- [ ] Replace inline `fontFamily: 'Bebas Neue'` → CSS variable
- [ ] Replace inline `fontFamily: 'DM Sans'` → CSS variable
- [ ] Use `font-headline` class for headlines
- [ ] Use `font-body` class for body text

### Spacing
- [ ] Replace `rounded-lg` → `rounded-[var(--radius-lg)]` (if needed)
- [ ] Use consistent spacing scale

---

## 🔧 Tailwind Configuration (Optional)

If you want better Tailwind integration, add to `tailwind.config.js`:

```js
export default {
  theme: {
    extend: {
      fontFamily: {
        headline: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        'mv-yellow': 'var(--mv-yellow)',
        'mv-dark': 'var(--mv-dark-bg)',
        'mv-card-1': 'var(--mv-card-1)',
        'mv-card-2': 'var(--mv-card-2)',
        'mv-muted': 'var(--mv-muted)',
        'mv-border': 'var(--mv-border)',
        'mv-success': 'var(--mv-success)',
        'mv-warning': 'var(--mv-warning)',
        'mv-error': 'var(--mv-error)',
        'mv-info': 'var(--mv-info)',
      },
      borderRadius: {
        'sm-custom': 'var(--radius-sm)',
        'md-custom': 'var(--radius-md)',
        'lg-custom': 'var(--radius-lg)',
        'xl-custom': 'var(--radius-xl)',
      }
    }
  }
}
```

Then use:
```tsx
<div className="bg-mv-dark text-mv-yellow border border-mv-border rounded-lg-custom">
  ...
</div>
```

---

## 🎨 Example Component Refactor

### Before (Hardcoded):
```tsx
export default function FeatureCard({ title, description }) {
  return (
    <div 
      className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6"
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      <h3 
        className="text-2xl mb-3"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#FFFFFF' }}
      >
        {title}
      </h3>
      <p style={{ color: '#888888' }}>
        {description}
      </p>
    </div>
  );
}
```

### After (Design System):
```tsx
export default function FeatureCard({ title, description }) {
  return (
    <div className="bg-[var(--mv-card-1)] border border-[var(--mv-border)] rounded-[var(--radius-xl)] p-6 font-body">
      <h3 className="text-2xl mb-3 text-[var(--foreground)] font-headline">
        {title}
      </h3>
      <p className="text-[var(--mv-muted)]">
        {description}
      </p>
    </div>
  );
}
```

### Best Practice (Tailwind + Variables):
```tsx
export default function FeatureCard({ title, description }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-2xl mb-3 text-card-foreground font-headline">
        {title}
      </h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
```

---

## 🚀 Benefits of Using Design System

1. **Consistency**: All components use same colors/spacing
2. **Easy Updates**: Change CSS variable → updates everywhere
3. **Theme Support**: Light/dark mode with one toggle
4. **Maintainability**: Clear design tokens
5. **Scalability**: Add new themes easily
6. **Performance**: CSS variables are fast

---

## 📚 Additional Resources

- **Astra UI Docs**: `node_modules/@figma/astraui-kit/guidelines/`
- **Theme CSS**: `src/styles/theme.css`
- **Fonts CSS**: `src/styles/fonts.css`
- **Tailwind Docs**: https://tailwindcss.com/docs/customizing-colors

---

**Need help?** Check `DEPLOY_TO_GITHUB.md` for Git/GitHub instructions!

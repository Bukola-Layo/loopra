# Design System Rules

## Philosophy

Loopra's UI embodies the product's core value: **simplicity first**. Every design decision should reduce cognitive load. The interface should feel calm, guided, and approachable for non-technical users (creators, small business owners, newsletter writers).

---

## Styling Stack

- **Tailwind CSS** — utility-first. Use CSS variable tokens defined below via `style` props or a `globals.css` import when Tailwind doesn't cover a value directly.
- **shadcn/ui** — base component library. Add components via `npx shadcn-ui@latest add [component]`.
- **Lucide React** — icon set. Use consistently; no mixing icon libraries.
- **`cn()` utility** — always merge classNames with `cn()` from `@/lib/utils`.
- **Font** — `Plus Jakarta Sans` (imported via Google Fonts or `next/font`). This is the sole typeface across all scales.

```ts
import { cn } from "@/lib/utils";
<div className={cn("base-classes", conditional && "extra-class", className)} />
```

---

## Color Tokens

All colors come from `colors.css`. Import it in `globals.css`. **Never hardcode hex values** — always reference the CSS variable.

### Primitive Palette

| CSS Variable | Hex | Notes |
|---|---|---|
| `--color-primary-color-0` | `#dd2d4a1a` | Primary tint (10% alpha) |
| `--color-primary-color-1` | `#f27b8c` | Primary light |
| `--color-primary-color-2` | `#ec3952` | Primary base |
| `--color-primary-color-3` | `#ca132d` | Primary dark |
| `--color-primary-color-4` | `#880d1e` | Primary deeper |
| `--color-primary-color-5` | `#500812` | Primary darkest |
| `--color-secondary-0` | `#dd2d4a1a` | Secondary tint |
| `--color-secondary-1` | `#e87386` | Secondary light |
| `--color-secondary-2` | `#dd2d4a` | Secondary base |
| `--color-accent-0` | `#cbeef380` | Accent 50% alpha |
| `--color-accent-1` | `#cbeef31a` | Accent 10% alpha |
| `--color-accent-2` | `#cbeef3` | Accent lightest |
| `--color-accent-3` | `#92dbe6` | Accent light |
| `--color-accent-4` | `#59c9d9` | Accent mid |
| `--color-accent-5` | `#2cadc0` | Accent base |
| `--color-background` | `#fafafa` | App background |
| `--color-error-0` | `#d00416` | Error dark |
| `--color-error-1` | `#fb3748` | Error base |
| `--color-success-0` | `#1fc16b1a` | Success tint |
| `--color-success-1` | `#84ebb4` | Success light |
| `--color-success-2` | `#1fc16b` | Success base |
| `--color-warning` | `#ffdb43` | Warning |

### Semantic Color Roles

Use **these role variables** in component code — not the raw primitives above. Roles communicate intent and make future theme changes trivial.

| CSS Variable | Maps to | When to use |
|---|---|---|
| `--color-role-primary` | `--color-primary-color-2` (`#ec3952`) | Primary CTAs, active states, key actions |
| `--color-role-secondary` | `--color-secondary-2` (`#dd2d4a`) | Secondary actions, hover states |
| `--color-role-accent` | `--color-accent-5` (`#2cadc0`) | Highlights, badges, info indicators |
| `--color-role-background` | `--color-background` (`#fafafa`) | Page and surface backgrounds |
| `--color-role-error` | `--color-error-1` (`#fb3748`) | Error messages, destructive states |
| `--color-role-error-light` | `--color-error-0` | Error background tints |
| `--color-role-success` | `--color-success-2` (`#1fc16b`) | Success confirmations, active badges |
| `--color-role-success-light` | `--color-success-0` | Success background tints |
| `--color-role-warning` | `--color-warning` (`#ffdb43`) | Warnings, plan limits |

**Usage in Tailwind** — apply via inline style or extend the Tailwind config:

```tsx
// Inline (always works)
<button style={{ backgroundColor: "var(--color-role-primary)" }}>Send</button>

// Or extend tailwind.config.ts to map tokens to utilities:
// colors: { primary: "var(--color-role-primary)", ... }
// Then: <button className="bg-primary text-white">Send</button>
```

---

## Typography

Font: **Plus Jakarta Sans** — import at the root level:

```ts
// app/layout.tsx
import { Plus_Jakarta_Sans } from "next/font/google";
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
```

All type styles are defined in `typography.css` as both CSS variables and utility classes (`.typography-[scale]-[size]`). Reference the class or compose from variables.

### Type Scale

| Class | CSS Var prefix | Size | Line Height | Letter Spacing | Use for |
|---|---|---|---|---|---|
| `.typography-display-large` | `--typography-display-large-*` | 64px | 96px | −1.28px | Hero headlines (marketing) |
| `.typography-display-medium` | `--typography-display-medium-*` | 54px | 81px | −1.08px | Large marketing sections |
| `.typography-display-small` | `--typography-display-small-*` | 40px | 60px | −0.8px | Page hero titles |
| `.typography-headline-large` | `--typography-headline-large-*` | 32px | 48px | −0.64px | Page titles (dashboard h1) |
| `.typography-headline-medium` | `--typography-headline-medium-*` | 28px | 42px | −0.56px | Section headings |
| `.typography-headline-small` | `--typography-headline-small-*` | 24px | 36px | −0.48px | Card/modal headings |
| `.typography-title-large` | `--typography-title-large-*` | 22px | 33px | −0.44px | Sub-section titles |
| `.typography-title-medium` | `--typography-title-medium-*` | 16px | 24px | −0.32px | Body emphasis, form labels |
| `.typography-title-small` | `--typography-title-small-*` | 14px | 21px | −0.28px | Small labels, tags |
| `.typography-body-large` | `--typography-body-large-*` | 16px | 24px | −0.32px | Primary body text |
| `.typography-body-medium` | `--typography-body-medium-*` | 14px | 21px | −0.28px | Secondary body text |
| `.typography-body-small` | `--typography-body-small-*` | 12px | 18px | −0.24px | Captions, helper text |
| `.typography-label-large` | `--typography-label-large-*` | 14px | 21px | −0.28px | Form labels, nav items |
| `.typography-label-medium` | `--typography-label-medium-*` | 12px | 18px | −0.24px | Small labels, meta |
| `.typography-label-small` | `--typography-label-small-*` | 11px | 16.5px | −0.22px | Micro labels, timestamps |

### Dashboard Typography Mapping

| UI Role | Token Class |
|---|---|
| Page title (h1) | `.typography-headline-large` |
| Section heading (h2) | `.typography-headline-small` |
| Card title | `.typography-title-large` |
| Body text | `.typography-body-medium` |
| Form label | `.typography-label-large` |
| Helper / caption text | `.typography-body-small` |
| Stat / metric value | `.typography-headline-medium` |
| Nav item | `.typography-label-large` |
| Button text | `.typography-title-small` |
| Timestamp / meta | `.typography-label-small` |

---

## Spacing & Layout

- Dashboard layout: fixed left sidebar (240px) + main content area.
- Content max-width: `max-w-5xl` for forms/detail pages; `max-w-7xl` for list/table pages.
- Card padding: `p-6`.
- Section gap: `gap-6` or `space-y-6`.
- Page top padding: `pt-8`.

---

## Component Patterns

### Buttons

Use shadcn/ui `<Button>` with variants driven by semantic color roles:

| Variant | Color role | When to use |
|---|---|---|
| `default` | `--color-role-primary` (`#ec3952`) | Primary CTA — one per section max |
| `outline` | Border only | Secondary actions |
| `ghost` | Transparent | Tertiary / icon buttons |
| `destructive` | `--color-role-error` | Delete / irreversible actions |

Always pair a destructive action with a confirmation dialog.

### Status & Feedback Colors

| State | Background token | Text / border token |
|---|---|---|
| Error message | `--color-role-error-light` | `--color-role-error` |
| Success message | `--color-role-success-light` | `--color-role-success` |
| Warning notice | `--color-role-warning` (at 20% opacity) | `--color-role-warning` |
| Accent badge / highlight | `--color-accent-1` | `--color-accent-5` |

### Forms

- Use shadcn/ui `<Input>`, `<Textarea>`, `<Select>`, `<Checkbox>`.
- Every field must have a visible `<Label>` — use `.typography-label-large`.
- Show inline validation errors below the field — use `.typography-body-small` + `--color-role-error`.
- Disable the submit button while the form is submitting; show a loading spinner on the button.

### Empty States

Every list or table must have an empty state component:

```tsx
<EmptyState
  icon={<Mail className="h-8 w-8" style={{ color: "var(--color-accent-5)" }} />}
  title="No campaigns yet"
  description="Send your first newsletter to get started."
  action={<Button>Create Campaign</Button>}
/>
```

### Loading States

- Use skeleton loaders (`<Skeleton>`) for content areas — never full-page spinners.
- Skeleton background: use `--color-primary-color-0` (the 10% alpha tint) for a subtle branded shimmer.

### Toasts / Notifications

Use shadcn/ui `useToast`:

- **Success:** `--color-role-success` accent. Auto-dismiss after 3s.
- **Error:** `--color-role-error`. Never auto-dismiss.
- **Warning:** `--color-role-warning`. Auto-dismiss after 5s.

### Modals / Dialogs

- Use shadcn/ui `<Dialog>` for confirmations and short forms.
- Use a full page or slide-over for complex forms (e.g., Loop builder).
- Always include a close button and handle `Escape` key.

---

## Loop Builder UI (Special Case)

The Loop builder is the product's flagship feature. Its UX must feel:

- **Visual** — nodes/steps connected by arrows, not a form list.
- **Forgiving** — changes auto-save; no "save" button required mid-edit.
- **Guided** — empty state shows recommended Loop templates.
- **Accented** — use `--color-accent-4` / `--color-accent-5` for connector lines and active node highlights to distinguish the builder from the red-primary brand chrome.

Trigger → Delay → Action node pattern. Keep the visual language consistent with a "pipeline" metaphor.

---

## Responsive Design

- Dashboard: not designed for mobile. Show a "use desktop" message on screens < 768px.
- Marketing / embed pages: fully responsive. Use `sm:`, `md:`, `lg:` breakpoints.
- Form embeds: must render correctly at widths as small as 320px.

---

## Accessibility

- All interactive elements must be keyboard-accessible.
- Use semantic HTML: `<button>`, `<nav>`, `<main>`, `<section>`, `<label>`.
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text.
  - Note: `--color-role-warning` (`#ffdb43`) on white fails contrast — always pair with dark text and never use as a text color itself.
- Always provide `alt` text for meaningful images; `alt=""` for decorative ones.
- Use `aria-label` on icon-only buttons.
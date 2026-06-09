# Workflow: New Component

Use this workflow every time you need to create a new UI component for Loopra.

---

## 1. Classify the Component

Answer these questions before writing a line of code:

| Question | Answer → Action |
|---|---|
| Does shadcn/ui already have it? | Use it directly from `@/components/ui/` |
| Is it reusable across 2+ features? | Place in `components/shared/` |
| Is it specific to one feature? | Place in `components/[feature]/` |
| Does it need browser APIs or interactivity? | Add `"use client"` directive |
| Does it fetch its own data? | Don't — pass data as props from a Server Component |

---

## 2. Read the Rules

Before writing code, read:

- `.agents/rules/design-system.md` — tokens, spacing, patterns
- `.agents/rules/code-styles.md` — naming, TypeScript, imports
- `.agents/skills/component-builder/SKILL.md` — templates and checklist

---

## 3. Create the File

**Path pattern:**
```
components/[feature]/ComponentName.tsx      ← feature-specific
components/shared/ComponentName.tsx         ← reusable
components/ui/[shadcn-component].tsx        ← shadcn primitives (never edit directly)
```

**Scaffold using the template in `component-builder/SKILL.md`.**

Minimum structure:
```tsx
// "use client"; — only if needed

type ComponentNameProps = {
  // typed props
  className?: string;
};

export function ComponentName({ className }: ComponentNameProps) {
  return <div className={cn("...", className)}>{/* ... */}</div>;
}
```

---

## 4. Handle All States

Every component that displays data must handle:

- **Loading** — skeleton that matches the content shape
- **Empty** — `<EmptyState>` with icon, title, description, optional action
- **Error** — inline error message or toast
- **Populated** — the happy path

---

## 5. Style with Tokens

Use only the color and typography tokens from `design-system.md`. Do not use arbitrary Tailwind values like `text-[#3b2f8a]` unless adding a new design token.

Primary accent: `violet-600` / `violet-700` (hover)
Text: `gray-900` (primary), `gray-500` (muted)
Borders: `gray-200`

---

## 6. Wire Up (if interactive)

If the component submits data:

1. Use `react-hook-form` + `zodResolver`.
2. Import the Zod schema from `types/[feature].ts` (shared with the API route).
3. `POST` to the relevant `app/api/` route.
4. Show a loading state on the button during submission.
5. On success: call `onSuccess()` prop or show a toast.
6. On error: show inline field errors or a toast.

---

## 7. Review Checklist

Before marking the task done:

- [ ] Props typed with `type` (not `interface`)
- [ ] `className` prop included
- [ ] `cn()` used for class merging
- [ ] `"use client"` only if truly needed
- [ ] Named export (not default)
- [ ] Loading state
- [ ] Empty state (lists/tables)
- [ ] File in correct folder
- [ ] No hardcoded colors outside design tokens
- [ ] Keyboard-accessible (focusable, operable via Enter/Space)
- [ ] Meaningful `aria-label` on icon-only buttons
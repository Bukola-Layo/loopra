# Skill: Component Builder

## Purpose

Scaffold consistent, production-ready React components for Loopra following the design system and code style rules.

---

## When to Use This Skill

- Creating a new UI component (feature-specific or shared)
- Building a data table, form, card, or empty state
- Adding a new page section with interactive elements

---

## Pre-Checks Before Building

1. Check `components/ui/` — does shadcn/ui already have this? Use it.
2. Check `components/shared/` — does a reusable variant already exist?
3. Read `rules/design-system.md` for tokens, spacing, and patterns.
4. Read `rules/code-styles.md` for naming and TypeScript conventions.

---

## Component Template

```tsx
// components/[feature]/ComponentName.tsx
"use client"; // only if interactive

import { cn } from "@/lib/utils";
// ... other imports

type ComponentNameProps = {
  // required props first, optional last
  requiredProp: string;
  optionalProp?: boolean;
  className?: string; // always include for composability
};

export function ComponentName({
  requiredProp,
  optionalProp = false,
  className,
}: ComponentNameProps) {
  return (
    <div className={cn("base-classes", optionalProp && "conditional-class", className)}>
      {/* content */}
    </div>
  );
}
```

---

## Component Categories & Patterns

### Feature Card

Use for: Audience stats, campaign summaries, Loop status cards.

```tsx
export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {trend && <p className="mt-1 text-sm text-gray-500">{trend}</p>}
    </div>
  );
}
```

### Data Table

Use shadcn/ui `<Table>` primitives. Always include:
- Loading skeleton state
- Empty state (no data)
- Pagination if rows > 25

```tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export function SubscriberTable({ subscribers, isLoading }: SubscriberTableProps) {
  if (isLoading) return <SubscriberTableSkeleton />;
  if (!subscribers.length) return <EmptyState ... />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscribers.map((sub) => (
          <TableRow key={sub.id}>
            <TableCell>{sub.email}</TableCell>
            <TableCell><StatusBadge status={sub.status} /></TableCell>
            <TableCell>{formatDate(sub.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Form Component

Always use react-hook-form + Zod resolver:

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({ name: z.string().min(1, "Required") });
type FormData = z.infer<typeof schema>;

export function ExampleForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/example", { method: "POST", body: JSON.stringify(data) });
    if (res.ok) onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

### Empty State

```tsx
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-10 w-10 text-gray-400" />
      <h3 className="mt-4 text-base font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

---

## Checklist Before Committing

- [ ] Props are typed with a `type` (not `interface`) above the component
- [ ] `className` prop included for composability
- [ ] `cn()` used for class merging
- [ ] Loading state handled
- [ ] Empty state handled (for lists/tables)
- [ ] `"use client"` only added if truly needed
- [ ] Component is exported as a named export (not default)
- [ ] File lives in the correct `components/[feature]/` folder
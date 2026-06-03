---
name: QPX toast pattern
description: The app uses shadcn/ui's useToast hook, not Sonner. All toast calls must go through useToast.
---

The app's App.tsx wires up `<Toaster>` from `@/components/ui/toaster` which is shadcn/ui's Radix-based toaster, not Sonner.

**Rule:** Always use `const { toast } = useToast()` from `@/hooks/use-toast`. Call as `toast({ title: "...", description?: "...", variant?: "destructive" })`.

**Why:** Importing `toast` from `sonner` produces toasts that never render because the Sonner `<Toaster>` is not in the component tree.

**How to apply:** Every new page/component that needs toasts must import `useToast` from `@/hooks/use-toast` and call the hook inside the component body.

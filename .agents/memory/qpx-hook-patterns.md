---
name: QPX hook patterns
description: Orval-generated hook call patterns for the QPX api-client-react package — avoids common mistakes
---

## useClaimDailyLogin
Takes `void` — call as `claimLogin.mutateAsync()` with no arguments.

**Why:** The OpenAPI spec defines this as POST with no request body.

## Query key naming
Query key helpers follow the `getGet<Resource>QueryKey()` pattern (double "Get"):
- `getGetPlayerProfileQueryKey()`
- `getGetQuestsQueryKey()`
- `getGetBossBattlesQueryKey()`
- `getGetInventoryQueryKey()`
- `getGetDailyLoginCalendarQueryKey()`

**Why:** Orval prefixes `get` onto the resource name, and the resource is already named `getXxx` in the spec, producing `getGet`.

## Hook export style
Query hooks are exported as `export function useGetXxx(...)` not `export const`. Mutation hooks are `export const useXxx`. Both are accessible from `@workspace/api-client-react`.

## Mutation argument shapes
All mutation hooks that take a body use the form `{ data: BodyType<InputType> }`:
- `completeOnboarding.mutateAsync({ data: onboardingInput })`
- `updatePlayerProfile.mutateAsync({ data: profileUpdate })`
- `createQuest.mutateAsync({ data: questInput })`
- `updateJournalEntry.mutateAsync({ id, data: entryUpdate })`
- `updateBossBattleProgress.mutateAsync({ id, data: { increment: 1 } })`

ID-only mutations use `{ id: number }`:
- `completeQuest.mutateAsync({ id })`
- `deleteQuest.mutateAsync({ id })`
- `deleteJournalEntry.mutateAsync({ id })`
- `equipItem.mutateAsync({ itemId })`

## JSX string escaping
Avoid `\"` inside JSX attribute strings — use `{' '}` template or single-quote outer, e.g.:
`placeholder={'e.g. 5\'10" or 178cm'}` not `placeholder="e.g. 5'10\" or 178cm"`.

# Phase B — /starter Page Design

**Date:** 2026-05-03
**Author:** Charlie
**Status:** Approved

## Overview

A `/starter` landing page showcasing a curated "Vibe Coding Essentials" pack of ~12 hand-picked skills. The page lets visitors browse what's included and copy all install commands in one click.

## Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Skill identification | `starter: true` frontmatter field | Jake curates content; this keeps it in his lane without code changes |
| Layout | Card grid (2-col desktop / 1-col mobile) | Consistent with rest of site; more browsable than a list |
| "Copy all" placement | Top of page, above the grid | Page purpose is fast installation; don't make users scroll |
| Button label | "Copy Coding Essentials" | More branded than "Copy all 12 install commands" |
| Copy format | Newline-separated commands | Resilient to individual failures; works in bash/zsh paste; readable |
| Skills without `install` | Include a commented fallback line | User isn't left wondering; `#` comment is a terminal no-op |
| Nav link | Not added now | `Layout.astro` is shared — Jake coordinates when to add it; label should be "Essentials" |
| npx meta-command | Out of scope | Stretch goal deferred to later |

## Files Changed

| File | Change | Lane |
|---|---|---|
| `src/content/config.ts` | Add `starter: z.boolean().default(false)` to `baseEntry` | Shared — coordinate with Jake |
| `src/pages/starter.astro` | New page | Charlie |
| Skill `.md` files | Jake sets `starter: true` on chosen entries | Jake |

## Schema Change

Add to `baseEntry` in `src/content/config.ts`:

```ts
starter: z.boolean().default(false),
```

Non-breaking — all existing entries implicitly default to `false`.

## Page Structure (`/starter`)

### Hero section
- Title: **"Vibe Coding Essentials"**
- Subtitle: one-line description (e.g. "The skills every vibe coder should have installed.")
- **"Copy Coding Essentials"** button — blue (`var(--color-accent)`), full-width on mobile, auto-width on desktop

### Card grid
- Queries all skills where `data.starter === true`
- Sorted by GitHub stars descending (uses existing `withStars()`); skills with `null` stars sort to the end
- Renders using existing `Card.astro` component
- 2 columns on desktop (`lg:grid-cols-2`), 1 column on mobile
- Cards link to individual skill detail pages as normal

### No sidebar, no filters — the list is intentionally curated and small

## "Copy Coding Essentials" Button Behaviour

Clicking copies a newline-separated string built from the starter skills:

- Skills **with** an `install` field: include the command as-is
- Skills **without** an `install` field: include a commented fallback line:
  ```
  # [Skill Name] — no install command, see https://vybify.com/skills/[slug]
  ```

Example copy payload:
```
npx skills add anthropics/skills --skill frontend-design
npx -y @upstash/context7-mcp
npx skills add anthropics/skills --skill gsd
# Some Skill — no install command, see https://vybify.com/skills/some-skill
```

Button text changes to **"Copied!"** for 1.5 seconds after click, then resets. Uses the same `navigator.clipboard.writeText` pattern as `CopyableCommand.astro` — no new JS dependencies.

## Out of Scope

- `npx skills add vybify/essentials` meta-command (stretch goal, deferred)
- Nav link in header (Jake's call, coordinates separately)
- Per-card individual copy buttons (not needed; "Copy Coding Essentials" covers the use case)
- Filtering or toggling which skills to include (static, curated list)

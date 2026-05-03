# Phase B — /starter Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/starter` page showing Jake's curated "Vibe Coding Essentials" skill pack with a "Copy Coding Essentials" button that copies all install commands.

**Architecture:** Add a `starter` boolean field to the shared content schema, then create a single new Astro page that queries skills where `starter === true`, renders them as a card grid (reusing `Card.astro`), and wires a copy button whose payload is built at compile time and passed via a `data-payload` attribute.

**Tech Stack:** Astro 5 (static), Tailwind CSS 4, existing `Card.astro` and `withStars()` lib, `navigator.clipboard` Web API.

---

## File Map

| File | Action | Notes |
|---|---|---|
| `src/content/config.ts` | Modify | Add `starter` field to `baseEntry` schema |
| `src/pages/starter.astro` | Create | New page — hero, card grid, copy button + script |

---

## Pre-flight

- [ ] **Create and switch to a new branch**

```bash
git checkout main
git pull origin main
git checkout -b charlie/phase-b-starter
```

---

## Task 1: Add `starter` field to content schema

**Files:**
- Modify: `src/content/config.ts`

- [ ] **Add `starter` to `baseEntry`**

Open `src/content/config.ts`. The current `baseEntry` looks like this:

```ts
const baseEntry = z.object({
  name: z.string(),
  tagline: z.string().max(160),
  url: z.string().url(),
  github: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

Add `starter` after `featured`:

```ts
const baseEntry = z.object({
  name: z.string(),
  tagline: z.string().max(160),
  url: z.string().url(),
  github: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  starter: z.boolean().default(false),
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

- [ ] **Verify the dev server still starts cleanly**

```bash
npm run dev
```

Expected: server starts at `http://localhost:4321` with no TypeScript errors in the terminal. All existing pages (`/`, `/skills`, `/projects`) load normally.

- [ ] **Commit**

```bash
git add src/content/config.ts
git commit -m "feat(schema): add starter boolean field to baseEntry"
```

---

## Task 2: Create `starter.astro` — skeleton with data query

**Files:**
- Create: `src/pages/starter.astro`

- [ ] **Create the page with imports and data query**

Create `src/pages/starter.astro` with this content:

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../layouts/Layout.astro';
import Card from '../components/Card.astro';
import { withStars } from '../lib/github';

const allSkills = await withStars(await getCollection('skills'));
const starterSkills = allSkills
  .filter((e) => e.data.starter)
  .sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));

const copyPayload = starterSkills
  .map((e) =>
    e.data.install
      ? e.data.install
      : `# ${e.data.name} — no install command, see https://vybify.com/skills/${e.id}`
  )
  .join('\n');
---

<Layout
  title="Vibe Coding Essentials · vybify"
  description="The skills every vibe coder should have installed. Hand-picked by the Vybify team."
>
  <p>starter page placeholder</p>
</Layout>
```

- [ ] **Verify the page loads**

With `npm run dev` running, open `http://localhost:4321/starter`.

Expected: page loads with the site header/footer and the text "starter page placeholder". No console errors.

- [ ] **Commit**

```bash
git add src/pages/starter.astro
git commit -m "feat(starter): scaffold page with data query"
```

---

## Task 3: Add hero section and "Copy Coding Essentials" button

**Files:**
- Modify: `src/pages/starter.astro`

- [ ] **Replace the placeholder with the hero section**

Replace `<p>starter page placeholder</p>` with:

```astro
  <section class="mb-8">
    <h1 class="text-2xl sm:text-3xl font-semibold text-[var(--color-fg)] mb-2">
      Vibe Coding Essentials
    </h1>
    <p class="text-[var(--color-fg-muted)] mb-5">
      The skills every vibe coder should have installed. Hand-picked by the Vybify team.
    </p>
    <button
      id="copy-essentials-btn"
      data-payload={copyPayload}
      class="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold rounded-lg transition"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy Coding Essentials
    </button>
  </section>
```

- [ ] **Verify hero renders correctly**

Open `http://localhost:4321/starter`.

Expected: title "Vibe Coding Essentials", subtitle text, and a blue "Copy Coding Essentials" button. Button is not yet wired (clicking does nothing).

- [ ] **Commit**

```bash
git add src/pages/starter.astro
git commit -m "feat(starter): add hero section and copy button"
```

---

## Task 4: Add card grid

**Files:**
- Modify: `src/pages/starter.astro`

- [ ] **Add the card grid below the hero section**

Add this after the closing `</section>` tag, still inside the `<Layout>` slot:

```astro
  {starterSkills.length > 0 ? (
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {starterSkills.map((entry) => (
        <Card
          name={entry.data.name}
          tagline={entry.data.tagline}
          href={`/skills/${entry.id}`}
          url={entry.data.url}
          github={entry.data.github}
          author={entry.data.author}
          tags={entry.data.tags ?? []}
          stars={entry.stars}
          delta7d={entry.delta7d}
          featured={entry.data.featured}
        />
      ))}
    </div>
  ) : (
    <p class="text-[var(--color-fg-muted)]">
      No essentials yet — check back soon.
    </p>
  )}
```

- [ ] **Test the empty state first**

Since no skills have `starter: true` yet, `http://localhost:4321/starter` should show:

Expected: hero section intact, then "No essentials yet — check back soon." text below. No errors.

- [ ] **Add `starter: true` to one skill temporarily to verify cards render**

Open any skill file, e.g. `src/content/skills/context7.md`, and add `starter: true` to its frontmatter:

```yaml
starter: true
```

Reload `http://localhost:4321/starter`.

Expected: the card appears in the grid, linking to `/skills/context7`, showing stars and tags correctly.

- [ ] **Remove the temporary `starter: true`** — Jake owns this curation

```bash
# revert the test change
git checkout src/content/skills/context7.md
```

- [ ] **Commit**

```bash
git add src/pages/starter.astro
git commit -m "feat(starter): add skill card grid with empty state"
```

---

## Task 5: Wire copy button JS

**Files:**
- Modify: `src/pages/starter.astro`

- [ ] **Add the script block at the bottom of the file** (after `</Layout>`)

```astro
<script>
  const btn = document.getElementById('copy-essentials-btn') as HTMLButtonElement | null;
  if (btn) {
    btn.addEventListener('click', async () => {
      const payload = btn.dataset.payload ?? '';
      try {
        await navigator.clipboard.writeText(payload);
        const original = btn.innerHTML;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.innerHTML = original;
        }, 1500);
      } catch {
        console.error('Clipboard write failed');
      }
    });
  }
</script>
```

- [ ] **Verify copy works end-to-end**

Temporarily add `starter: true` to two skills — one with an `install` field and one without (add a dummy skill or use an existing one that lacks `install`).

Open `http://localhost:4321/starter`. Click "Copy Coding Essentials".

Expected:
- Button text changes to "✓ Copied!" for ~1.5 seconds then resets
- Paste into a text editor — you should see the install commands, one per line, with a `#` comment line for any skill missing an `install` field

Revert the temporary frontmatter changes:

```bash
git checkout src/content/skills/
```

- [ ] **Run a full build to confirm no errors**

```bash
npm run build
```

Expected: build completes with no errors. Check `dist/starter/index.html` exists.

- [ ] **Commit**

```bash
git add src/pages/starter.astro
git commit -m "feat(starter): wire copy-to-clipboard button"
```

---

## Task 6: Push and open PR

- [ ] **Push the branch**

```bash
git push -u origin charlie/phase-b-starter
```

- [ ] **Open a PR on GitHub**

Title: `feat(phase-b): /starter page — Vibe Coding Essentials`

Body:
```
## What
Adds a /starter page at vybify.com/starter showing Jake's curated
"Vibe Coding Essentials" skill pack.

## How it works
- Skills marked `starter: true` in frontmatter appear on the page
- "Copy Coding Essentials" button copies all install commands (newline-separated)
- Skills without an `install` field get a `#` comment fallback in the copy payload
- Jake curates the list by adding `starter: true` to skill frontmatter

## For Jake
Once this merges, add `starter: true` to your chosen skills and the
page will populate. Also, when ready, add "Essentials" to the nav in
Layout.astro pointing to /starter.

## No breaking changes
`starter` defaults to `false` — all existing entries unaffected.
```

- [ ] **Ping Jake** to review and add `starter: true` to his chosen skills after merge.

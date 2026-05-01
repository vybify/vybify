---
name: Colorize
tagline: "The design language that makes your AI harness better at design."
url: "https://skills.sh/pbakaus/impeccable/colorize"
github: pbakaus/impeccable
author: pbakaus
tags:
  - "claude-code"
  - pbakaus
kind: "claude-code-skill"
install: "npx skills add pbakaus/impeccable --skill colorize"
addedAt: "2026-04-30"
---


# Impeccable

The vocabulary you didn't know you needed. 1 skill, 23 commands, and curated anti-patterns for impeccable frontend design.

> **Quick start:** Visit [impeccable.style](https://impeccable.style) to download ready-to-use bundles.

## Why Impeccable?

Anthropic created [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design), a skill that guides Claude toward better UI design. Impeccable builds on that foundation with deeper expertise and more control.

Every LLM learned from the same generic templates. Without guidance, you get the same predictable mistakes: Inter font, purple gradients, cards nested in cards, gray text on colored backgrounds.

Impeccable fights that bias with:
- **An expanded skill** with 7 domain-specific reference files ([view source](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/))
- **23 commands** to audit, review, polish, distill, animate, and more
- **Curated anti-patterns** that explicitly tell the AI what NOT to do

## What's Included

### The Skill: impeccable

A comprehensive design skill with 7 domain-specific references ([view skill](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/SKILL.md)):

| Reference | Covers |
|-----------|--------|
| [typography](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/typography.md) | Type systems, font pairing, modular scales, OpenType |
| [color-and-contrast](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/color-and-contrast.md) | OKLCH, tinted neutrals, dark mode, accessibility |
| [spatial-design](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/spatial-design.md) | Spacing systems, grids, visual hierarchy |
| [motion-design](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/motion-design.md) | Easing curves, staggering, reduced motion |
| [interaction-design](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/interaction-design.md) | Forms, focus states, loading patterns |
| [responsive-design](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/responsive-design.md) | Mobile-first, fluid design, container queries |
| [ux-writing](https://github.com/pbakaus/impeccable/blob/HEAD/source/skills/impeccable/reference/ux-writing.md) | Button labels, error messages, empty states |

### 23 Commands

All commands are accessed through `/impeccable`:

| Command | What it does |
|---------|--------------|
| `/impeccable craft` | Full shape-then-build flow with visual iteration |
| `/impeccable teach` | One-time setup: gather design context, write PRODUCT.md and DESIGN.md |
| `/impeccable document` | Generate DESIGN.md from existing project code |
| `/impeccable extract` | Pull reusable components and tokens into the design system |
| `/impeccable shape` | Plan UX/UI before writing code |
| `/impeccable critique` | UX design review: hierarchy, clarity, emotional resonance |
| `/impeccable audit` | Run technical quality checks (a11y, performance, responsive) |
| `/impeccable polish` | Final pass, design system alignment, and shipping readiness |
| `/impeccable bolder` | Amplify boring designs |
| `/impeccable quieter` | Tone down overly bold designs |
| `/impeccable distill` | Strip to essence |
| `/impeccable harden` | Error handling, i18n, text overflow, edge cases |
| `/impeccable onboard` | First-run flows, empty states, activation paths |
| `/impeccable animate` | Add purposeful motion |
| `/impeccable colorize` | Introduce strategic color |
| `/impeccable typeset` | Fix font choices, hierarchy, sizing |
| `/impeccable layout` | Fix layout, spacing, visual rhythm |
| `/impeccable delight` | Add moments of joy |
| `/impeccable overdrive` | Add technically extraordinary effects |
| `/impeccable clarify` | Improve unclear UX copy |
| `/impeccable adapt` | Adapt for different devices |
| `/impeccable optimize` | Performance improvements |
| `/impeccable live` | Visual variant mode: iterate on elements in the browser |

Use `/impeccable pin <command>` to create standalone shortcuts (e.g., `pin audit` creates `/audit`).

#### Usage Examples

[Read the full README on GitHub →](https://github.com/pbakaus/impeccable)

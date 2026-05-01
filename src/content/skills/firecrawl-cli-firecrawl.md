---
name: Firecrawl
tagline: "Skill firecrawl from firecrawl/cli."
url: "https://skills.sh/firecrawl/cli/firecrawl"
github: firecrawl/cli
author: firecrawl
tags:
  - "claude-code"
  - firecrawl
kind: "claude-code-skill"
install: "npx skills add firecrawl/cli --skill firecrawl"
addedAt: "2026-04-30"
---


# 🔥 Firecrawl CLI

Command-line interface for Firecrawl. Search, scrape, and interact with the web directly from your terminal.

## Installation

```bash
npm install -g firecrawl-cli
```

Or set up everything in one command (install CLI globally, authenticate, and add skills across all detected coding editors):

```bash
npx -y firecrawl-cli@1.14.8 init -y --browser
```

- `-y` runs setup non-interactively
- `--browser` opens the browser for Firecrawl authentication automatically
- skills install globally to every detected AI coding agent by default

### Setup Skills and MCP

If you are using an AI coding agent like Claude Code, you can also install the skill individually with:

```bash
firecrawl setup skills
```

This installs skills globally across all detected coding editors by default. Use `--agent <agent>` to scope it to one editor.

### Agent skills

The init command installs both sets of Firecrawl agent skills into AI coding agents (Cursor, Claude Code, Windsurf, etc.):

- **CLI skills** — teach agents how to use the Firecrawl CLI for live web work (search, scrape, interact, map, crawl)
- **Build skills** — teach agents how to integrate Firecrawl into application code (choose endpoints, wire SDKs, set up API keys)

To reinstall skills manually:

```bash
firecrawl setup skills
```

To install the Firecrawl MCP server into your editors (Cursor, Claude Code, VS Code, etc.):

```bash
firecrawl setup mcp
```

## Quick Start

Just run a command - the CLI will prompt you to authenticate if needed:

```bash
firecrawl https://example.com
```

## Authentication

On first run, you'll be prompted to authenticate:

```
  🔥 firecrawl cli
  Search, scrape, and interact with the web

Welcome! To get started, authenticate with your Firecrawl account.

  1. Login with browser (recommended)
  2. Enter API key manually

Tip: You can also set FIRECRAWL_API_KEY environment variable

Enter choice [1/2]:
```

### Authentication Methods

```bash
# Interactive (prompts automatically when needed)
firecrawl

# Browser login
firecrawl login

# Direct API key
firecrawl login --api-key fc-your-api-key

# Environment variable
export FIRECRAWL_API_KEY=fc-your-api-key

# Per-command API key
firecrawl scrape https://example.com --api-key fc-your-api-key
```

### Self-hosted / Local Development

For self-hosted Firecrawl instances or local development, use the `--api-url` option:

```bash
# Use a local Firecrawl instance (no API key required)
firecrawl --api-url http://localhost:3002 scrape https://example.com

# Or set via environment variable
export FIRECRAWL_API_URL=http://localhost:3002
firecrawl scrape https://example.com

# Self-hosted with API key
firecrawl --api-url https://firecrawl.mycompany.com --api-key fc-xxx scrape https://example.com
```

When using a custom API URL (anything other than `https://api.firecrawl.dev`), authentication is automatically skipped, allowing you to use local instances without an API key.

---

## Commands

### `scrape` - Scrape URLs

Extract content from any webpage. Pass multiple URLs to scrape them concurrently -- each result is saved to `.firecrawl/` automatically.

```bash
# Basic usage (outputs markdown)
firecrawl https://example.com
firecrawl scrape https://example.com

# Get raw HTML
firecrawl https://example.com --html
firecrawl https://example.com -H

# Multiple formats (outputs JSON)
firecrawl https://example.com --format markdown,links,images

# Save to file
firecrawl https://example.com -o output.md
firecrawl https://example.com --format json -o data.json --pretty

# Multiple URLs (scraped concurrently, each saved to .firecrawl/)
firecrawl scrape https://firecrawl.dev https://firecrawl.dev/blog https://docs.firecrawl.dev
```

#### Scrape Options

[Read the full README on GitHub →](https://github.com/firecrawl/cli)

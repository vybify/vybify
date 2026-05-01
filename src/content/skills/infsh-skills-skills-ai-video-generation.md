---
name: Ai Video Generation
tagline: "inference.sh Agent skills for using our API to give your agents access to hundreds of apps and other agents"
url: "https://skills.sh/infsh-skills/skills/ai-video-generation"
github: "infsh-skills/skills"
author: "infsh-skills"
tags:
  - "claude-code"
  - "infsh-skills"
kind: "claude-code-skill"
install: "npx skills add infsh-skills/skills --skill ai-video-generation"
addedAt: "2026-04-30"
---


# inference.sh skills

AI agent skills for 250+ models via [inference.sh](https://inference.sh) CLI. Generate images, videos, call LLMs, search the web, and more.

![inference.sh](https://cloud.inference.sh/app/files/u/4mg21r6ta37mpaz6ktzwtt8krr/01kgvqa60jjrqa47j3g5s6ce6v.jpeg)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Contents

- [Install as Claude Code Plugin](#claude-code-plugin)
- [Install as Skills](#install-as-skills)
- [CLI Setup](#cli-setup)
- [Available Skills](#available-skills)
- [Documentation](#documentation)

---

## Claude Code Plugin

Install all skills as a Claude Code plugin:

```bash
/plugin install inference-sh
```

Or add from GitHub:

```bash
/plugin marketplace add inference-sh/skills
/plugin install inference-sh@inference-sh-skills
```

After install, skills are available as `/inference-sh:flux-image`, `/inference-sh:google-veo`, etc.

---

## Install as Skills

### All Skills

```bash
npx skills add inference-sh/skills
```

### Specific Skills

```bash
npx skills add inference-sh/skills@flux-image
npx skills add inference-sh/skills@google-veo
npx skills add inference-sh/skills@llm-models
npx skills add inference-sh/skills@web-search
```

### Manual

```bash
cp -r tools/* ui/* sdk/* guides/* ~/.claude/skills/
```

---

## CLI Setup

> Requires inference.sh CLI (`belt`). [Install instructions](https://raw.githubusercontent.com/inference-sh/skills/refs/heads/main/cli-install.md)

```bash
belt login
```

Browse apps: `belt app list`

---

## Available Skills

### Tools

| Skill | Description |
|-------|-------------|
| [ai-image-generation](https://github.com/infsh-skills/skills/blob/HEAD/tools/image/) | 50+ image models (FLUX, Gemini, Reve, etc.) |
| [ai-video-generation](https://github.com/infsh-skills/skills/blob/HEAD/tools/video/) | 40+ video models (Veo, Seedance, Wan, etc.) |
| [llm-models](https://github.com/infsh-skills/skills/blob/HEAD/tools/llm/) | Claude, Gemini, Kimi, GLM |
| [web-search](https://github.com/infsh-skills/skills/blob/HEAD/tools/llm/) | Tavily, Exa search |
| [twitter-automation](https://github.com/infsh-skills/skills/blob/HEAD/tools/social/) | X/Twitter API |

### SDKs

| Skill | Description |
|-------|-------------|
| [javascript-sdk](https://github.com/infsh-skills/skills/blob/HEAD/sdk/javascript-sdk/) | JS/TS SDK with streaming, tools, React |
| [python-sdk](https://github.com/infsh-skills/skills/blob/HEAD/sdk/python-sdk/) | Python SDK with async, streaming |

### UI Components

| Skill | Description |
|-------|-------------|
| [agent-ui](https://github.com/infsh-skills/skills/blob/HEAD/ui/agent-ui/) | Full agent interface |
| [chat-ui](https://github.com/infsh-skills/skills/blob/HEAD/ui/chat-ui/) | Chat components |
| [tools-ui](https://github.com/infsh-skills/skills/blob/HEAD/ui/tools-ui/) | Tool call/result rendering |

### Guides

| Category | Topics |
|----------|--------|
| [prompting](https://github.com/infsh-skills/skills/blob/HEAD/guides/prompting/) | Prompt engineering, video prompts |
| [design](https://github.com/infsh-skills/skills/blob/HEAD/guides/design/) | Landing pages, thumbnails, logos |
| [video](https://github.com/infsh-skills/skills/blob/HEAD/guides/video/) | Storyboards, explainers, ads |
| [writing](https://github.com/infsh-skills/skills/blob/HEAD/guides/writing/) | Blogs, case studies, newsletters |
| [social](https://github.com/infsh-skills/skills/blob/HEAD/guides/social/) | LinkedIn, Twitter threads, carousels |
| [product](https://github.com/infsh-skills/skills/blob/HEAD/guides/product/) | Competitor analysis, personas, launches |

---

## Documentation

- [Getting Started](https://inference.sh/docs/getting-started/introduction)
- [Running Apps](https://inference.sh/docs/apps/running)
- [CLI Setup](https://inference.sh/docs/extend/cli-setup)
- [API & SDK](https://inference.sh/docs/api/overview)

**Links:** [Website](https://inference.sh) | [App Store](https://app.inference.sh) | [Docs](https://inference.sh/docs) | [Blog](https://inference.sh/blog)

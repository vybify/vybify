---
name: Azure Cost Optimization
tagline: "Official agent plugin providing skills and MCP server configurations for Azure scenarios."
url: "https://skills.sh/microsoft/azure-skills/azure-cost-optimization"
github: "microsoft/azure-skills"
author: microsoft
tags:
  - "claude-code"
  - microsoft
  - "agent-skills"
kind: "claude-code-skill"
install: "npx skills add microsoft/azure-skills --skill azure-cost-optimization"
addedAt: "2026-04-30"
---


# Azure Skills Plugin

Azure work is not just a code problem. It is a decision problem: which service fits this app, what needs to be validated before deployment, which tools should run, and what guardrails matter. The Azure Skills Plugin packages Azure expertise and MCP-backed execution together so compatible coding agents can do real Azure work instead of giving generic cloud advice.

**[Install the plugin](#install-in-60-seconds)**

## One install, three layers of capability

### Azure skills: the brain

This plugin ships **25 curated Azure skills** that teach an agent how Azure work gets done. They provide workflows, decision trees, and guardrails for scenarios such as:

- **Build, deploy, and evolve** with `azure-prepare`, `azure-validate`, `azure-deploy`, `azure-upgrade`, `azure-enterprise-infra-planner`, `azure-hosted-copilot-sdk`, `azure-kubernetes`, and `airunway-aks-setup`
- **Troubleshoot, monitor, and govern** with `azure-diagnostics`, `appinsights-instrumentation`, `azure-compliance`, `azure-resource-lookup`, and `azure-quotas`
- **Optimize architecture and cost** with `azure-cost`, `azure-compute`, `azure-resource-visualizer`, and `azure-cloud-migrate`
- **Work across data, AI, identity, and platform services** with `azure-ai`, `azure-aigateway`, `azure-storage`, `azure-kusto`, `azure-messaging`, `azure-rbac`, `entra-app-registration`, and `microsoft-foundry`

### Azure MCP Server: the hands

The plugin wires in the **Azure MCP Server**, which gives your agent **200+ structured tools across 40+ Azure services**. That is the execution layer for listing resources, checking prices, querying logs, diagnosing issues, and driving real Azure workflows.

### Foundry MCP: the AI specialist

The plugin also includes **Foundry MCP** for Microsoft Foundry scenarios such as model discovery, model deployment, and agent workflows.

## Why this plugin is different

This is not a prompt pack. It is a packaged Azure capability layer:

- **Skills** teach the agent when to use Azure workflows and what to avoid.
- **MCP tools** let the agent act on live Azure and Foundry resources.
- **The plugin** keeps the guidance layer and execution layer aligned in one install.
- **Multi-host support** lets you use the same Azure capability across environments such as GitHub Copilot in VS Code, Copilot CLI, Claude Code, and other compatible hosts.

## What you get

| Component | What it adds | Examples |
| --- | --- | --- |
| **Azure skills** | Azure expertise, workflows, and guardrails | Prepare, validate, deploy, diagnostics, cost, AI, RBAC |
| **Azure MCP Server** | Live Azure tooling | Resource inventory, monitoring, pricing, storage, databases, messaging |
| **Foundry MCP** | Microsoft Foundry workflows | Model catalog, deployments, agents, evaluations |

The plugin payload lives in `.github/plugins/azure-skills/`, and the included MCP configuration shows how Azure and Foundry connectivity are wired for compatible hosts.

## Install in 60 seconds

### Prerequisites

Before you install, make sure you have:

- An Azure account or subscription
- **Node.js 18+** available on your PATH (`npx` is used to start the MCP servers)
- **Azure CLI** installed and authenticated with `az login`
- **Azure Developer CLI** installed and authenticated with `azd auth login` if you plan to use deployment workflows

### GitHub Copilot CLI

**Add the marketplace** (first time only):

```
/plugin marketplace add microsoft/azure-skills
```

**Install the plugin**:

```
/plugin install azure@azure-skills
```

**Update the plugin**:

```
/plugin update azure@azure-skills
```

### VS Code

Install the **Azure MCP** extension from the Visual Studio Marketplace:

👉 [Azure MCP Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-mcp-server)

The Azure MCP extension will also install a companion extension that brings the Azure skills into VS Code. Together they configure the Azure MCP Server, Foundry MCP, and the full skills layer automatically.

> **Note:** The skills extension requires **Git CLI** to be installed on your machine. If you don't have it, ask Copilot to help you install Git for your OS.

[Read the full README on GitHub →](https://github.com/microsoft/azure-skills)

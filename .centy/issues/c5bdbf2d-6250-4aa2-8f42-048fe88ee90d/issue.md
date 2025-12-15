# Add agent configuration UI with user-scope and project-scope support

Add UI to configure LLM agents at both user-scope (global) and project-scope levels.

## User Scope (Settings page /settings):

- Default agent selection dropdown
- Agent list management (add/remove/edit agents)
- Agent configuration: name, command, default arguments, plan template, implement template
- Environment variables for agents

## Project Scope (Project Config page /project/config):

- Override default agent for this project
- Project-specific agent configurations (override global)
- Project-specific environment variables

## Technical context:

- Backend already supports LocalLlmConfig with user + project scope merging
- API methods exist: getLocalLlmConfig, updateLocalLlmConfig
- Config stored in ~/.centy/config.local.json (global) and .centy/config.local.json (project)
- Predefined agents: Claude, Gemini, Codex, Opencode, Custom

## Files to reference:

- centy-app/components/settings/GeneralSettings.tsx (user-scope pattern)
- centy-app/components/settings/ProjectConfig.tsx (project-scope pattern)
- centy-daemon/src/llm/config.rs (backend config structure)

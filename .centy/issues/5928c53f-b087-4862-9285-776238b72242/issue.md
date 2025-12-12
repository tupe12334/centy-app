# LLM integration - Web App

Add LLM integration UI to the web app:

- Add LLM settings page to configure agents (default agent, agent list, env vars)
- Show active work session indicator in the UI
- Add 'Plan with AI' and 'Implement with AI' buttons on issue detail pages
- Agent selection dropdown when spawning
- Work session status panel showing current agent, issue, action, and PID
- Prompt preview modal before confirming spawn
- Template editor for plan/implement templates

Should integrate with daemon via existing API layer.

Parent issue: cf64f3d7-832f-4ba9-831b-2589a1c8e790 (centy-daemon)

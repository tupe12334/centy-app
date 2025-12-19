# Runtime TypeError: Cannot read properties of undefined (reading 'map') in AgentConfigEditor

## Error Type

Runtime TypeError

## Error Message

Cannot read properties of undefined (reading 'map')

## Stack Trace

```
at AgentConfigEditor (components/settings/AgentConfigEditor.tsx:57:27)
at GeneralSettings (components/settings/GeneralSettings.tsx:255:11)
at SettingsPage (app/settings/page.tsx:6:10)
```

## Code Frame

```tsx
55 |
56 |   const allAgentNames = [
57 |     ...localConfig.agents.map(a => a.name),
   |                           ^
58 |     ...inheritedAgents.map(a => a.name),
59 |   ]
60 |
```

## Environment

- Next.js version: 16.0.10 (Turbopack)

## Root Cause

`localConfig.agents` is undefined when the component renders. The code assumes `localConfig.agents` always exists, but it may not be initialized yet or could be missing from the config object.

## Suggested Fix

Add a null check or default value:

```tsx
const allAgentNames = [
  ...(localConfig?.agents ?? []).map(a => a.name),
  ...inheritedAgents.map(a => a.name),
]
```

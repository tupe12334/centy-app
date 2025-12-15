# Show actionable error in web app when AI agent is not configured

When user clicks 'AI Plan' or 'AI Implement' and no agent is configured or available, show an informative error with the ability to configure the agent directly.

## Requirements:

- Detect when SpawnAgent fails due to missing/unavailable agent
- Show error modal or inline error with:
  - Clear message: 'No AI agent configured' or 'Agent X not found'
  - Instructions on how to fix
  - Quick action button: 'Configure Agent' (links to Settings)
  - Option to select from available agents if any exist
- Follow existing error patterns (danger color #ef4444, modal or toast)

## Technical context:

- SpawnAgentResponse returns success: false with error message
- Can use DaemonDisconnectedOverlay pattern for actionable errors
- Error should differentiate between 'no default agent' vs 'agent command not found'

## Files to reference:

- centy-app/components/layout/DaemonDisconnectedOverlay.tsx (actionable error pattern)
- centy-app/components/issues/IssueDetail.tsx (handleSpawnPlan function)
- centy-app/styles/index.css (danger color variables)

'use client'

import {
  type ProjectInfo,
  type Issue,
  type IssueMetadata,
  type Doc,
  type DocMetadata,
  type PullRequest,
  type PrMetadata,
  type User,
  type Organization,
  type Config,
  type DaemonInfo,
  type Link,
  type Asset,
  LinkTargetType,
} from '@/gen/centy_pb'

// Demo project path - virtual path for demo mode
export const DEMO_PROJECT_PATH = '/demo/centy-showcase'

// Demo organization
export const DEMO_ORGANIZATION: Organization = {
  $typeName: 'centy.Organization',
  slug: 'demo-org',
  name: 'Demo Organization',
  description: 'A sample organization for demonstration purposes',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-12-01T14:30:00Z',
  projectCount: 1,
}

// Demo project
export const DEMO_PROJECT: ProjectInfo = {
  $typeName: 'centy.ProjectInfo',
  path: DEMO_PROJECT_PATH,
  firstAccessed: '2024-01-15T10:00:00Z',
  lastAccessed: new Date().toISOString(),
  issueCount: 7,
  docCount: 3,
  initialized: true,
  name: 'centy-showcase',
  displayPath: '~/demo/centy-showcase',
  isFavorite: true,
  isArchived: false,
  organizationSlug: 'demo-org',
  organizationName: 'Demo Organization',
  userTitle: '',
  projectTitle: 'Centy Showcase Project',
}

// Demo users
export const DEMO_USERS: User[] = [
  {
    $typeName: 'centy.User',
    id: 'alice-developer',
    name: 'Alice Developer',
    email: 'alice@example.com',
    gitUsernames: ['alice-dev', 'alicedev'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T14:30:00Z',
  },
  {
    $typeName: 'centy.User',
    id: 'bob-engineer',
    name: 'Bob Engineer',
    email: 'bob@example.com',
    gitUsernames: ['bob-eng'],
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-11-15T11:00:00Z',
  },
  {
    $typeName: 'centy.User',
    id: 'charlie-designer',
    name: 'Charlie Designer',
    email: 'charlie@example.com',
    gitUsernames: ['charlie-design'],
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-10-20T16:00:00Z',
  },
]

// Helper to create issue metadata
function createIssueMetadata(
  displayNumber: number,
  status: string,
  priority: number,
  createdAt: string,
  updatedAt: string,
  customFields: Record<string, string> = {},
  draft = false,
  compacted = false
): IssueMetadata {
  return {
    $typeName: 'centy.IssueMetadata',
    displayNumber,
    status,
    priority,
    priorityLabel: priority === 1 ? 'high' : priority === 2 ? 'medium' : 'low',
    createdAt,
    updatedAt,
    customFields,
    draft,
    compacted,
    compactedAt: compacted ? updatedAt : '',
  }
}

// Demo issues
export const DEMO_ISSUES: Issue[] = [
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-1',
    displayNumber: 1,
    issueNumber: 'demo-issue-1',
    title: 'Implement dark mode toggle',
    description: `## Overview
Add a dark mode toggle to the application settings that allows users to switch between light and dark themes.

## Requirements
- Toggle switch in settings panel
- Persist user preference in localStorage
- Smooth transition between themes
- Support system preference detection

## Acceptance Criteria
- [ ] Dark mode toggle is visible in settings
- [ ] Theme persists across page reloads
- [ ] Respects system preference by default`,
    metadata: createIssueMetadata(
      1,
      'open',
      1,
      '2024-12-01T10:00:00Z',
      '2024-12-15T14:30:00Z',
      { component: 'ui', effort: 'medium' }
    ),
  },
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-2',
    displayNumber: 2,
    issueNumber: 'demo-issue-2',
    title: 'Fix login timeout issue',
    description: `## Bug Description
Users are being logged out unexpectedly after 5 minutes of inactivity instead of the configured 30 minutes.

## Steps to Reproduce
1. Log into the application
2. Leave the browser idle for 5 minutes
3. Try to perform any action
4. User is redirected to login page

## Expected Behavior
Session should remain active for 30 minutes of inactivity.

## Root Cause Analysis
Investigating the session management middleware...`,
    metadata: createIssueMetadata(
      2,
      'in-progress',
      2,
      '2024-12-05T09:00:00Z',
      '2024-12-18T11:00:00Z',
      { component: 'auth', effort: 'small' }
    ),
  },
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-3',
    displayNumber: 3,
    issueNumber: 'demo-issue-3',
    title: 'Update API documentation',
    description: `## Task
Update the API documentation to reflect the new endpoints added in v2.0.

## Sections to Update
- Authentication endpoints
- User management endpoints
- Project endpoints
- Webhook configurations

## Notes
Include example requests and responses for each endpoint.`,
    metadata: createIssueMetadata(
      3,
      'closed',
      3,
      '2024-11-20T14:00:00Z',
      '2024-12-01T16:00:00Z',
      { component: 'docs', effort: 'medium' },
      false,
      true
    ),
  },
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-4',
    displayNumber: 4,
    issueNumber: 'demo-issue-4',
    title: 'Add search functionality to project list',
    description: `## Feature Request
Implement a search bar in the project list view that allows users to quickly find projects by name or description.

## Requirements
- Real-time filtering as user types
- Search by project name
- Search by project description
- Highlight matching text
- Show "No results" message when appropriate`,
    metadata: createIssueMetadata(
      4,
      'open',
      2,
      '2024-12-10T11:00:00Z',
      '2024-12-17T09:00:00Z',
      { component: 'ui', effort: 'medium' }
    ),
  },
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-5',
    displayNumber: 5,
    issueNumber: 'demo-issue-5',
    title: 'Performance optimization for large datasets',
    description: `## Problem
The application becomes slow when loading projects with more than 1000 issues.

## Proposed Solution
- Implement virtual scrolling for issue lists
- Add pagination to API endpoints
- Optimize database queries
- Add caching layer

## Technical Notes
This is still in the planning phase. Need to profile the application first.`,
    metadata: createIssueMetadata(
      5,
      'open',
      1,
      '2024-12-15T16:00:00Z',
      '2024-12-18T10:00:00Z',
      { component: 'performance', effort: 'large' },
      true
    ),
  },
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-6',
    displayNumber: 6,
    issueNumber: 'demo-issue-6',
    title: 'Add keyboard shortcuts',
    description: `## Feature
Add keyboard shortcuts for common actions to improve productivity.

## Proposed Shortcuts
- \`Ctrl+K\` - Quick search
- \`Ctrl+N\` - New issue
- \`Ctrl+S\` - Save
- \`Esc\` - Close modal
- \`J/K\` - Navigate list`,
    metadata: createIssueMetadata(
      6,
      'for-validation',
      3,
      '2024-12-08T13:00:00Z',
      '2024-12-16T15:00:00Z',
      { component: 'ui', effort: 'small' }
    ),
  },
  {
    $typeName: 'centy.Issue',
    id: 'demo-issue-7',
    displayNumber: 7,
    issueNumber: 'demo-issue-7',
    title: 'Implement webhook notifications',
    description: `## Feature
Allow users to configure webhooks to receive notifications when issues are created or updated.

## Requirements
- Webhook URL configuration
- Event type selection
- Secret key for verification
- Retry logic for failed deliveries
- Activity log for webhook calls`,
    metadata: createIssueMetadata(
      7,
      'open',
      2,
      '2024-12-12T10:00:00Z',
      '2024-12-18T08:00:00Z',
      { component: 'integrations', effort: 'large' }
    ),
  },
]

// Helper to create doc metadata
function createDocMetadata(createdAt: string, updatedAt: string): DocMetadata {
  return {
    $typeName: 'centy.DocMetadata',
    createdAt,
    updatedAt,
  }
}

// Demo docs
export const DEMO_DOCS: Doc[] = [
  {
    $typeName: 'centy.Doc',
    slug: 'getting-started',
    title: 'Getting Started',
    content: `# Getting Started with Centy

Welcome to Centy! This guide will help you get up and running quickly.

## Installation

\`\`\`bash
npm install -g centy
\`\`\`

## Quick Start

1. Initialize a new project:
\`\`\`bash
centy init
\`\`\`

2. Create your first issue:
\`\`\`bash
centy create issue --title "My first issue"
\`\`\`

3. List all issues:
\`\`\`bash
centy list issues
\`\`\`

## Next Steps

- Read the [API Reference](api-reference) for detailed documentation
- Check out the [Contributing Guide](contributing) to learn how to contribute
`,
    metadata: createDocMetadata('2024-01-15T10:00:00Z', '2024-12-01T14:00:00Z'),
  },
  {
    $typeName: 'centy.Doc',
    slug: 'api-reference',
    title: 'API Reference',
    content: `# API Reference

This document describes the Centy API endpoints and their usage.

## Issues API

### List Issues
\`GET /api/issues\`

Returns a list of all issues in the project.

**Query Parameters:**
- \`status\` - Filter by status (open, in-progress, closed)
- \`priority\` - Filter by priority (1-3)
- \`limit\` - Maximum number of results

### Create Issue
\`POST /api/issues\`

Creates a new issue.

**Request Body:**
\`\`\`json
{
  "title": "Issue title",
  "description": "Issue description",
  "priority": 2,
  "status": "open"
}
\`\`\`

## Projects API

### List Projects
\`GET /api/projects\`

Returns all tracked projects.

### Get Project
\`GET /api/projects/:path\`

Returns details for a specific project.
`,
    metadata: createDocMetadata('2024-02-01T09:00:00Z', '2024-11-15T11:00:00Z'),
  },
  {
    $typeName: 'centy.Doc',
    slug: 'contributing',
    title: 'Contributing Guide',
    content: `# Contributing to Centy

We welcome contributions! Here's how you can help.

## Development Setup

1. Clone the repository
2. Install dependencies: \`pnpm install\`
3. Start the development server: \`pnpm dev\`

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Code Style

- Use TypeScript
- Follow the existing code patterns
- Add comments for complex logic
- Write meaningful commit messages

## Reporting Issues

Please use the issue tracker to report bugs or request features.
`,
    metadata: createDocMetadata('2024-03-01T08:00:00Z', '2024-10-20T16:00:00Z'),
  },
]

// Helper to create PR metadata
function createPrMetadata(
  displayNumber: number,
  status: string,
  priority: number,
  sourceBranch: string,
  targetBranch: string,
  createdAt: string,
  updatedAt: string,
  customFields: Record<string, string> = {},
  mergedAt = '',
  closedAt = ''
): PrMetadata {
  return {
    $typeName: 'centy.PrMetadata',
    displayNumber,
    status,
    priority,
    priorityLabel: priority === 1 ? 'high' : priority === 2 ? 'medium' : 'low',
    sourceBranch,
    targetBranch,
    reviewers: [],
    createdAt,
    updatedAt,
    mergedAt,
    closedAt,
    customFields,
  }
}

// Demo PRs
export const DEMO_PRS: PullRequest[] = [
  {
    $typeName: 'centy.PullRequest',
    id: 'demo-pr-1',
    displayNumber: 1,
    title: 'feat: Add dark mode support',
    description: `## Summary
This PR implements dark mode support for the application.

## Changes
- Added theme toggle component
- Implemented CSS variables for theming
- Added localStorage persistence
- Updated all components to use theme variables

## Testing
- Tested in Chrome, Firefox, Safari
- Verified persistence across reloads
- Checked accessibility contrast ratios`,
    metadata: createPrMetadata(
      1,
      'open',
      1,
      'feature/dark-mode',
      'main',
      '2024-12-16T10:00:00Z',
      '2024-12-18T09:00:00Z'
    ),
  },
  {
    $typeName: 'centy.PullRequest',
    id: 'demo-pr-2',
    displayNumber: 2,
    title: 'fix: Resolve login timeout issue',
    description: `## Problem
Users were being logged out after 5 minutes instead of 30.

## Root Cause
The session middleware was using milliseconds instead of minutes.

## Solution
Fixed the timeout calculation in the session configuration.

## Testing
- Verified session persists for 30 minutes
- Added unit tests for session management`,
    metadata: createPrMetadata(
      2,
      'merged',
      2,
      'fix/session-timeout',
      'main',
      '2024-12-10T14:00:00Z',
      '2024-12-12T16:00:00Z',
      {},
      '2024-12-12T16:00:00Z'
    ),
  },
  {
    $typeName: 'centy.PullRequest',
    id: 'demo-pr-3',
    displayNumber: 3,
    title: 'docs: Update README with new features',
    description: `## Changes
- Updated installation instructions
- Added new configuration options
- Fixed typos and formatting
- Added screenshots`,
    metadata: createPrMetadata(
      3,
      'open',
      3,
      'docs/update-readme',
      'main',
      '2024-12-17T11:00:00Z',
      '2024-12-18T08:00:00Z'
    ),
  },
]

// Demo config
export const DEMO_CONFIG: Config = {
  $typeName: 'centy.Config',
  customFields: [
    {
      $typeName: 'centy.CustomFieldDefinition',
      name: 'component',
      fieldType: 'enum',
      required: false,
      defaultValue: '',
      enumValues: ['ui', 'auth', 'docs', 'performance', 'integrations'],
    },
    {
      $typeName: 'centy.CustomFieldDefinition',
      name: 'effort',
      fieldType: 'enum',
      required: false,
      defaultValue: 'medium',
      enumValues: ['small', 'medium', 'large'],
    },
  ],
  defaults: {
    status: 'open',
    priority: '2',
  },
  priorityLevels: 3,
  allowedStates: ['open', 'in-progress', 'for-validation', 'closed'],
  defaultState: 'open',
  version: '0.1.5',
  stateColors: {
    open: '#22c55e',
    'in-progress': '#3b82f6',
    'for-validation': '#f59e0b',
    closed: '#6b7280',
  },
  priorityColors: {
    '1': '#ef4444',
    '2': '#f59e0b',
    '3': '#6b7280',
  },
  customLinkTypes: [],
}

// Demo daemon info
export const DEMO_DAEMON_INFO: DaemonInfo = {
  $typeName: 'centy.DaemonInfo',
  version: '0.1.5 (Demo)',
  availableVersions: ['0.1.5'],
  binaryPath: '/demo/centy-daemon',
}

// Demo links (relationships between entities)
export const DEMO_LINKS: Link[] = [
  {
    $typeName: 'centy.Link',
    targetId: 'demo-pr-1',
    targetType: LinkTargetType.PR,
    linkType: 'implements',
    createdAt: '2024-12-16T10:00:00Z',
  },
  {
    $typeName: 'centy.Link',
    targetId: 'demo-pr-2',
    targetType: LinkTargetType.PR,
    linkType: 'fixes',
    createdAt: '2024-12-10T14:00:00Z',
  },
  {
    $typeName: 'centy.Link',
    targetId: 'demo-issue-4',
    targetType: LinkTargetType.ISSUE,
    linkType: 'blocks',
    createdAt: '2024-12-15T16:00:00Z',
  },
]

// Demo assets
export const DEMO_ASSETS: Asset[] = [
  {
    $typeName: 'centy.Asset',
    filename: 'screenshot.png',
    hash: 'demo-hash-1',
    size: BigInt(102400),
    mimeType: 'image/png',
    isShared: true,
    createdAt: '2024-12-15T10:00:00Z',
  },
  {
    $typeName: 'centy.Asset',
    filename: 'diagram.svg',
    hash: 'demo-hash-2',
    size: BigInt(8192),
    mimeType: 'image/svg+xml',
    isShared: true,
    createdAt: '2024-12-16T11:00:00Z',
  },
]

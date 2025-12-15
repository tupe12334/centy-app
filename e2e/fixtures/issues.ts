import type { Issue, IssueMetadata } from '@/gen/centy_pb'

/**
 * Creates a mock issue with default values that can be overridden.
 */
export function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  const displayNumber = overrides.displayNumber ?? 1
  const now = new Date().toISOString()

  const defaultMetadata: IssueMetadata = {
    displayNumber,
    status: 'open',
    priority: 2,
    priorityLabel: 'medium',
    createdAt: now,
    updatedAt: now,
    customFields: {},
    compacted: false,
    compactedAt: '',
    draft: false,
    $typeName: 'centy.IssueMetadata',
  }

  return {
    id: overrides.id ?? `issue-${displayNumber}-${Date.now()}`,
    displayNumber,
    issueNumber: overrides.issueNumber ?? `uuid-${displayNumber}`,
    title: overrides.title ?? `Test Issue ${displayNumber}`,
    description:
      overrides.description ?? `Description for issue ${displayNumber}`,
    metadata: {
      ...defaultMetadata,
      ...overrides.metadata,
    },
    $typeName: 'centy.Issue',
  }
}

/**
 * Creates a mock issue metadata object.
 */
export function createMockIssueMetadata(
  overrides: Partial<IssueMetadata> = {}
): IssueMetadata {
  const now = new Date().toISOString()

  return {
    displayNumber: overrides.displayNumber ?? 1,
    status: overrides.status ?? 'open',
    priority: overrides.priority ?? 2,
    priorityLabel: overrides.priorityLabel ?? 'medium',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    customFields: overrides.customFields ?? {},
    compacted: overrides.compacted ?? false,
    compactedAt: overrides.compactedAt ?? '',
    draft: overrides.draft ?? false,
    $typeName: 'centy.IssueMetadata',
  }
}

/**
 * Factory functions for common test scenarios.
 */
export const createIssueScenario = {
  /** Returns an empty array of issues */
  empty: (): Issue[] => [],

  /** Returns a single issue */
  single: (overrides: Partial<Issue> = {}): Issue[] => [
    createMockIssue(overrides),
  ],

  /** Returns multiple issues */
  many: (count: number): Issue[] =>
    Array.from({ length: count }, (_, i) =>
      createMockIssue({
        displayNumber: i + 1,
        title: `Issue ${i + 1}`,
      })
    ),

  /** Returns issues with different statuses */
  withStatuses: (): Issue[] => [
    createMockIssue({
      displayNumber: 1,
      title: 'Open Issue',
      metadata: createMockIssueMetadata({ displayNumber: 1, status: 'open' }),
    }),
    createMockIssue({
      displayNumber: 2,
      title: 'In Progress Issue',
      metadata: createMockIssueMetadata({
        displayNumber: 2,
        status: 'in-progress',
      }),
    }),
    createMockIssue({
      displayNumber: 3,
      title: 'Closed Issue',
      metadata: createMockIssueMetadata({ displayNumber: 3, status: 'closed' }),
    }),
  ],

  /** Returns issues with different priorities */
  withPriorities: (): Issue[] => [
    createMockIssue({
      displayNumber: 1,
      title: 'High Priority Issue',
      metadata: createMockIssueMetadata({
        displayNumber: 1,
        priority: 3,
        priorityLabel: 'high',
      }),
    }),
    createMockIssue({
      displayNumber: 2,
      title: 'Medium Priority Issue',
      metadata: createMockIssueMetadata({
        displayNumber: 2,
        priority: 2,
        priorityLabel: 'medium',
      }),
    }),
    createMockIssue({
      displayNumber: 3,
      title: 'Low Priority Issue',
      metadata: createMockIssueMetadata({
        displayNumber: 3,
        priority: 1,
        priorityLabel: 'low',
      }),
    }),
  ],
}

/**
 * Default mock issues for general use.
 */
export const mockIssues: Issue[] = createIssueScenario.many(3)

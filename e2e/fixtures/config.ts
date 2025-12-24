import type { Config, ProjectInfo, Manifest } from '@/gen/centy_pb'

// Fixed date for deterministic visual tests
const FIXED_DATE = '2024-01-15T10:30:00.000Z'

/**
 * Creates a mock config with default values that can be overridden.
 */
export function createMockConfig(overrides: Partial<Config> = {}): Config {
  return {
    customFields: overrides.customFields ?? [],
    defaults: overrides.defaults ?? {},
    priorityLevels: overrides.priorityLevels ?? 3,
    allowedStates: overrides.allowedStates ?? ['open', 'in-progress', 'closed'],
    defaultState: overrides.defaultState ?? 'open',
    version: overrides.version ?? '1.0.0',
    stateColors: overrides.stateColors ?? {
      open: '#22c55e',
      'in-progress': '#3b82f6',
      closed: '#6b7280',
    },
    priorityColors: overrides.priorityColors ?? {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#22c55e',
    },
    llm: overrides.llm ?? {
      autoCloseOnComplete: false,
      updateStatusOnStart: false,
      allowDirectEdits: true,
      $typeName: 'centy.LlmConfig',
    },
    customLinkTypes: overrides.customLinkTypes ?? [],
    $typeName: 'centy.Config',
  }
}

/**
 * Creates a mock project info object.
 */
export function createMockProjectInfo(
  overrides: Partial<ProjectInfo> = {}
): ProjectInfo {
  const now = FIXED_DATE

  return {
    path: overrides.path ?? '/test/project',
    firstAccessed: overrides.firstAccessed ?? now,
    lastAccessed: overrides.lastAccessed ?? now,
    issueCount: overrides.issueCount ?? 0,
    docCount: overrides.docCount ?? 0,
    initialized: overrides.initialized ?? true,
    name: overrides.name ?? 'Test Project',
    isFavorite: overrides.isFavorite ?? false,
    isArchived: overrides.isArchived ?? false,
    displayPath: overrides.displayPath ?? '/test/project',
    organizationSlug: overrides.organizationSlug ?? '',
    organizationName: overrides.organizationName ?? '',
    userTitle: overrides.userTitle ?? '',
    projectTitle: overrides.projectTitle ?? '',
    $typeName: 'centy.ProjectInfo',
  }
}

/**
 * Creates a mock manifest object.
 */
export function createMockManifest(
  overrides: Partial<Manifest> = {}
): Manifest {
  const now = FIXED_DATE

  return {
    schemaVersion: overrides.schemaVersion ?? 1,
    centyVersion: overrides.centyVersion ?? '1.0.0',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    $typeName: 'centy.Manifest',
  }
}

/**
 * Default mock config for general use.
 */
export const mockConfig: Config = createMockConfig()

/**
 * Default mock project info for general use.
 */
export const mockProjectInfo: ProjectInfo = createMockProjectInfo()

/**
 * Default mock manifest for general use.
 */
export const mockManifest: Manifest = createMockManifest()

/**
 * Factory for creating project scenarios.
 */
export const createProjectScenario = {
  /** Returns an empty project list */
  empty: (): ProjectInfo[] => [],

  /** Returns a single project */
  single: (overrides: Partial<ProjectInfo> = {}): ProjectInfo[] => [
    createMockProjectInfo(overrides),
  ],

  /** Returns multiple projects */
  many: (count: number): ProjectInfo[] =>
    Array.from({ length: count }, (_, i) =>
      createMockProjectInfo({
        path: `/project-${i + 1}`,
        name: `Project ${i + 1}`,
        displayPath: `/project-${i + 1}`,
        issueCount: i * 5,
        docCount: i * 2,
      })
    ),

  /** Returns projects with one favorite */
  withFavorite: (): ProjectInfo[] => [
    createMockProjectInfo({
      path: '/favorite-project',
      name: 'Favorite Project',
      isFavorite: true,
    }),
    createMockProjectInfo({
      path: '/regular-project',
      name: 'Regular Project',
      isFavorite: false,
    }),
  ],
}

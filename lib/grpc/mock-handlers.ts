'use client'

import {
  DEMO_PROJECT_PATH,
  DEMO_PROJECT,
  DEMO_ORGANIZATION,
  DEMO_ISSUES,
  DEMO_DOCS,
  DEMO_PRS,
  DEMO_USERS,
  DEMO_CONFIG,
  DEMO_DAEMON_INFO,
  DEMO_LINKS,
  DEMO_ASSETS,
} from './demo-data'

import {
  EntityType,
  ActionCategory,
  type ListProjectsRequest,
  type ListProjectsResponse,
  type GetProjectInfoRequest,
  type GetProjectInfoResponse,
  type ListIssuesRequest,
  type ListIssuesResponse,
  type GetIssueRequest,
  type GetIssueByDisplayNumberRequest,
  type Issue,
  type ListDocsRequest,
  type ListDocsResponse,
  type GetDocRequest,
  type Doc,
  type ListPrsRequest,
  type ListPrsResponse,
  type GetPrRequest,
  type GetPrByDisplayNumberRequest,
  type PullRequest,
  type ListUsersRequest,
  type ListUsersResponse,
  type GetUserRequest,
  type User,
  type ListOrganizationsRequest,
  type ListOrganizationsResponse,
  type GetOrganizationRequest,
  type Organization,
  type GetConfigRequest,
  type Config,
  type GetDaemonInfoRequest,
  type DaemonInfo,
  type IsInitializedRequest,
  type IsInitializedResponse,
  type ListLinksRequest,
  type ListLinksResponse,
  type ListAssetsRequest,
  type ListAssetsResponse,
  type GetAvailableLinkTypesRequest,
  type GetAvailableLinkTypesResponse,
  type GetEntityActionsRequest,
  type GetEntityActionsResponse,
  type EntityAction,
} from '@/gen/centy_pb'

// Type for mock handlers - using 'any' to allow different parameter types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockHandlers = Record<string, (request: any) => Promise<any>>

// Helper to filter issues by request parameters
function filterIssues(
  issues: typeof DEMO_ISSUES,
  request: ListIssuesRequest
): typeof DEMO_ISSUES {
  let filtered = [...issues]

  // status is a single string, filter if provided
  if (request.status) {
    filtered = filtered.filter(
      issue => issue.metadata && issue.metadata.status === request.status
    )
  }

  // priority is a single number, filter if > 0
  if (request.priority && request.priority > 0) {
    filtered = filtered.filter(
      issue => issue.metadata && issue.metadata.priority === request.priority
    )
  }

  return filtered
}

// Helper to filter PRs by request parameters
function filterPrs(
  prs: typeof DEMO_PRS,
  request: ListPrsRequest
): typeof DEMO_PRS {
  let filtered = [...prs]

  // status is a single string
  if (request.status) {
    filtered = filtered.filter(
      pr => pr.metadata && pr.metadata.status === request.status
    )
  }

  // sourceBranch is a single string
  if (request.sourceBranch) {
    filtered = filtered.filter(
      pr =>
        pr.metadata && pr.metadata.sourceBranch.includes(request.sourceBranch)
    )
  }

  // targetBranch is a single string
  if (request.targetBranch) {
    filtered = filtered.filter(
      pr =>
        pr.metadata && pr.metadata.targetBranch.includes(request.targetBranch)
    )
  }

  return filtered
}

// Mock handlers for all RPC methods
export const mockHandlers: MockHandlers = {
  // Project methods
  async listProjects(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: ListProjectsRequest
  ): Promise<ListProjectsResponse> {
    return {
      $typeName: 'centy.ListProjectsResponse',
      projects: [DEMO_PROJECT],
      totalCount: 1,
    }
  },

  async getProjectInfo(
    request: GetProjectInfoRequest
  ): Promise<GetProjectInfoResponse> {
    if (request.projectPath === DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.GetProjectInfoResponse',
        found: true,
        project: DEMO_PROJECT,
      }
    }
    return {
      $typeName: 'centy.GetProjectInfoResponse',
      found: false,
      project: undefined,
    }
  },

  async isInitialized(
    request: IsInitializedRequest
  ): Promise<IsInitializedResponse> {
    return {
      $typeName: 'centy.IsInitializedResponse',
      initialized: request.projectPath === DEMO_PROJECT_PATH,
      centyPath:
        request.projectPath === DEMO_PROJECT_PATH
          ? `${DEMO_PROJECT_PATH}/.centy`
          : '',
    }
  },

  // Issue methods
  async listIssues(request: ListIssuesRequest): Promise<ListIssuesResponse> {
    if (request.projectPath !== DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.ListIssuesResponse',
        issues: [],
        totalCount: 0,
      }
    }

    const filtered = filterIssues(DEMO_ISSUES, request)
    return {
      $typeName: 'centy.ListIssuesResponse',
      issues: filtered,
      totalCount: filtered.length,
    }
  },

  async getIssue(request: GetIssueRequest): Promise<Issue> {
    const issue = DEMO_ISSUES.find(i => i.id === request.issueId)
    if (issue) {
      return issue
    }
    throw new Error(`Issue ${request.issueId} not found`)
  },

  async getIssueByDisplayNumber(
    request: GetIssueByDisplayNumberRequest
  ): Promise<Issue> {
    const issue = DEMO_ISSUES.find(
      i => i.displayNumber === request.displayNumber
    )
    if (issue) {
      return issue
    }
    throw new Error(`Issue #${request.displayNumber} not found`)
  },

  // Doc methods
  async listDocs(request: ListDocsRequest): Promise<ListDocsResponse> {
    if (request.projectPath !== DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.ListDocsResponse',
        docs: [],
        totalCount: 0,
      }
    }

    return {
      $typeName: 'centy.ListDocsResponse',
      docs: DEMO_DOCS,
      totalCount: DEMO_DOCS.length,
    }
  },

  async getDoc(request: GetDocRequest): Promise<Doc> {
    const doc = DEMO_DOCS.find(d => d.slug === request.slug)
    if (doc) {
      return doc
    }
    throw new Error(`Doc ${request.slug} not found`)
  },

  // PR methods
  async listPrs(request: ListPrsRequest): Promise<ListPrsResponse> {
    if (request.projectPath !== DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.ListPrsResponse',
        prs: [],
        totalCount: 0,
      }
    }

    const filtered = filterPrs(DEMO_PRS, request)
    return {
      $typeName: 'centy.ListPrsResponse',
      prs: filtered,
      totalCount: filtered.length,
    }
  },

  async getPr(request: GetPrRequest): Promise<PullRequest> {
    const pr = DEMO_PRS.find(p => p.id === request.prId)
    if (pr) {
      return pr
    }
    throw new Error(`PR ${request.prId} not found`)
  },

  async getPrByDisplayNumber(
    request: GetPrByDisplayNumberRequest
  ): Promise<PullRequest> {
    const pr = DEMO_PRS.find(p => p.displayNumber === request.displayNumber)
    if (pr) {
      return pr
    }
    throw new Error(`PR #${request.displayNumber} not found`)
  },

  // User methods
  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
    if (request.projectPath !== DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.ListUsersResponse',
        users: [],
        totalCount: 0,
      }
    }

    return {
      $typeName: 'centy.ListUsersResponse',
      users: DEMO_USERS,
      totalCount: DEMO_USERS.length,
    }
  },

  async getUser(request: GetUserRequest): Promise<User> {
    const user = DEMO_USERS.find(u => u.id === request.userId)
    if (user) {
      return user
    }
    throw new Error(`User ${request.userId} not found`)
  },

  // Organization methods
  async listOrganizations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: ListOrganizationsRequest
  ): Promise<ListOrganizationsResponse> {
    return {
      $typeName: 'centy.ListOrganizationsResponse',
      organizations: [DEMO_ORGANIZATION],
      totalCount: 1,
    }
  },

  async getOrganization(
    request: GetOrganizationRequest
  ): Promise<Organization> {
    if (request.slug === DEMO_ORGANIZATION.slug) {
      return DEMO_ORGANIZATION
    }
    throw new Error(`Organization ${request.slug} not found`)
  },

  // Config methods
  async getConfig(request: GetConfigRequest): Promise<Config> {
    if (request.projectPath === DEMO_PROJECT_PATH) {
      return DEMO_CONFIG
    }
    // Return default config for other projects
    return DEMO_CONFIG
  },

  // Daemon info
  async getDaemonInfo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: GetDaemonInfoRequest
  ): Promise<DaemonInfo> {
    return DEMO_DAEMON_INFO
  },

  // Links
  async listLinks(request: ListLinksRequest): Promise<ListLinksResponse> {
    const links = DEMO_LINKS.filter(link => link.targetId === request.entityId)

    return {
      $typeName: 'centy.ListLinksResponse',
      links,
      totalCount: links.length,
    }
  },

  async getAvailableLinkTypes(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: GetAvailableLinkTypesRequest
  ): Promise<GetAvailableLinkTypesResponse> {
    return {
      $typeName: 'centy.GetAvailableLinkTypesResponse',
      linkTypes: [
        {
          $typeName: 'centy.LinkTypeInfo',
          name: 'blocks',
          inverse: 'blocked-by',
          description: 'Blocks another issue from being worked on',
          isBuiltin: true,
        },
        {
          $typeName: 'centy.LinkTypeInfo',
          name: 'fixes',
          inverse: 'fixed-by',
          description: 'Fixes the linked issue',
          isBuiltin: true,
        },
        {
          $typeName: 'centy.LinkTypeInfo',
          name: 'implements',
          inverse: 'implemented-by',
          description: 'Implements a feature or requirement',
          isBuiltin: true,
        },
        {
          $typeName: 'centy.LinkTypeInfo',
          name: 'relates-to',
          inverse: 'relates-to',
          description: 'Related to another issue',
          isBuiltin: true,
        },
        {
          $typeName: 'centy.LinkTypeInfo',
          name: 'duplicates',
          inverse: 'duplicated-by',
          description: 'Duplicates another issue',
          isBuiltin: true,
        },
      ],
    }
  },

  // Assets
  async listAssets(request: ListAssetsRequest): Promise<ListAssetsResponse> {
    if (request.projectPath !== DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.ListAssetsResponse',
        assets: [],
        totalCount: 0,
      }
    }

    return {
      $typeName: 'centy.ListAssetsResponse',
      assets: DEMO_ASSETS,
      totalCount: DEMO_ASSETS.length,
    }
  },

  async listSharedAssets(
    request: ListAssetsRequest
  ): Promise<ListAssetsResponse> {
    if (request.projectPath !== DEMO_PROJECT_PATH) {
      return {
        $typeName: 'centy.ListAssetsResponse',
        assets: [],
        totalCount: 0,
      }
    }

    return {
      $typeName: 'centy.ListAssetsResponse',
      assets: DEMO_ASSETS,
      totalCount: DEMO_ASSETS.length,
    }
  },

  // Write operations - return success responses but don't actually persist
  // These will show a toast indicating changes aren't persisted

  async createIssue(): Promise<{ success: boolean; issue: Issue }> {
    console.warn('[Demo Mode] createIssue called - changes not persisted')
    return {
      success: true,
      issue: DEMO_ISSUES[0],
    }
  },

  async updateIssue(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] updateIssue called - changes not persisted')
    return { success: true }
  },

  async deleteIssue(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] deleteIssue called - changes not persisted')
    return { success: true }
  },

  async createDoc(): Promise<{ success: boolean; doc: Doc }> {
    console.warn('[Demo Mode] createDoc called - changes not persisted')
    return {
      success: true,
      doc: DEMO_DOCS[0],
    }
  },

  async updateDoc(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] updateDoc called - changes not persisted')
    return { success: true }
  },

  async deleteDoc(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] deleteDoc called - changes not persisted')
    return { success: true }
  },

  async createPr(): Promise<{ success: boolean; pr: PullRequest }> {
    console.warn('[Demo Mode] createPr called - changes not persisted')
    return {
      success: true,
      pr: DEMO_PRS[0],
    }
  },

  async updatePr(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] updatePr called - changes not persisted')
    return { success: true }
  },

  async deletePr(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] deletePr called - changes not persisted')
    return { success: true }
  },

  // Operations that don't make sense in demo mode
  async shutdown(): Promise<{ success: boolean; message: string }> {
    console.warn('[Demo Mode] shutdown called - not available in demo mode')
    return { success: false, message: 'Not available in demo mode' }
  },

  async restart(): Promise<{ success: boolean; message: string }> {
    console.warn('[Demo Mode] restart called - not available in demo mode')
    return { success: false, message: 'Not available in demo mode' }
  },

  async init(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] init called - not available in demo mode')
    return { success: true }
  },

  async registerProject(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] registerProject called - not available in demo mode'
    )
    return { success: true }
  },

  async untrackProject(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] untrackProject called - not available in demo mode'
    )
    return { success: true }
  },

  async setProjectFavorite(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] setProjectFavorite called - changes not persisted'
    )
    return { success: true }
  },

  async setProjectArchived(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] setProjectArchived called - changes not persisted'
    )
    return { success: true }
  },

  async setProjectOrganization(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] setProjectOrganization called - changes not persisted'
    )
    return { success: true }
  },

  async setProjectUserTitle(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] setProjectUserTitle called - changes not persisted'
    )
    return { success: true }
  },

  async setProjectTitle(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] setProjectTitle called - changes not persisted')
    return { success: true }
  },

  async createOrganization(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] createOrganization called - changes not persisted'
    )
    return { success: true }
  },

  async updateOrganization(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] updateOrganization called - changes not persisted'
    )
    return { success: true }
  },

  async deleteOrganization(): Promise<{ success: boolean }> {
    console.warn(
      '[Demo Mode] deleteOrganization called - changes not persisted'
    )
    return { success: true }
  },

  async updateConfig(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] updateConfig called - changes not persisted')
    return { success: true }
  },

  async createUser(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] createUser called - changes not persisted')
    return { success: true }
  },

  async updateUser(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] updateUser called - changes not persisted')
    return { success: true }
  },

  async deleteUser(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] deleteUser called - changes not persisted')
    return { success: true }
  },

  async syncUsers(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] syncUsers called - not available in demo mode')
    return { success: true }
  },

  async createLink(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] createLink called - changes not persisted')
    return { success: true }
  },

  async deleteLink(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] deleteLink called - changes not persisted')
    return { success: true }
  },

  async addAsset(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] addAsset called - not available in demo mode')
    return { success: true }
  },

  async deleteAsset(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] deleteAsset called - not available in demo mode')
    return { success: true }
  },

  async getAsset(): Promise<{ success: boolean; data: Uint8Array }> {
    console.warn('[Demo Mode] getAsset called - returning empty data')
    return { success: true, data: new Uint8Array() }
  },

  // Stub handlers for other methods
  async getManifest(): Promise<{ version: string }> {
    return { version: '0.1.5' }
  },

  async getNextIssueNumber(): Promise<{ nextNumber: number }> {
    return { nextNumber: DEMO_ISSUES.length + 1 }
  },

  async getNextPrNumber(): Promise<{ nextNumber: number }> {
    return { nextNumber: DEMO_PRS.length + 1 }
  },

  async getProjectVersion(): Promise<{
    projectVersion: string
    daemonVersion: string
  }> {
    return { projectVersion: '0.1.5', daemonVersion: '0.1.5' }
  },

  async getFeatureStatus(): Promise<{ features: Record<string, boolean> }> {
    return { features: {} }
  },

  async listUncompactedIssues(): Promise<{ issues: Issue[] }> {
    return {
      issues: DEMO_ISSUES.filter(i => !i.metadata?.compacted),
    }
  },

  async getInstruction(): Promise<{ content: string }> {
    return { content: '# Demo Project Instructions\n\nThis is a demo project.' }
  },

  async getCompact(): Promise<{ content: string }> {
    return { content: '# Compact Summary\n\nNo compacted issues yet.' }
  },

  async spawnAgent(): Promise<{ success: boolean; message: string }> {
    console.warn('[Demo Mode] spawnAgent called - not available in demo mode')
    return { success: false, message: 'Not available in demo mode' }
  },

  async openInTempVscode(): Promise<{
    success: boolean
    error: string
    workspacePath: string
    issueId: string
    displayNumber: number
    expiresAt: string
    vscodeOpened: boolean
  }> {
    console.warn(
      '[Demo Mode] openInTempVscode called - not available in demo mode'
    )
    return {
      success: false,
      error: 'Opening VS Code workspaces is not available in demo mode',
      workspacePath: '',
      issueId: '',
      displayNumber: 0,
      expiresAt: '',
      vscodeOpened: false,
    }
  },

  async openInTempTerminal(): Promise<{
    success: boolean
    error: string
    workspacePath: string
    issueId: string
    displayNumber: number
    expiresAt: string
    terminalOpened: boolean
  }> {
    console.warn(
      '[Demo Mode] openInTempTerminal called - not available in demo mode'
    )
    return {
      success: false,
      error: 'Opening Terminal workspaces is not available in demo mode',
      workspacePath: '',
      issueId: '',
      displayNumber: 0,
      expiresAt: '',
      terminalOpened: false,
    }
  },

  async getSupportedEditors(): Promise<{
    editors: Array<{
      $typeName: 'centy.EditorInfo'
      editorType: number
      name: string
      description: string
      available: boolean
    }>
  }> {
    return {
      editors: [
        {
          $typeName: 'centy.EditorInfo',
          editorType: 1, // VSCODE
          name: 'VS Code',
          description: 'Open in temporary VS Code workspace with AI agent',
          available: true,
        },
        {
          $typeName: 'centy.EditorInfo',
          editorType: 2, // TERMINAL
          name: 'Terminal',
          description: 'Open in terminal with AI agent',
          available: true,
        },
      ],
    }
  },

  async getLlmWork(): Promise<{ hasWork: boolean }> {
    return { hasWork: false }
  },

  async getLocalLlmConfig(): Promise<{ config: Record<string, unknown> }> {
    return { config: {} }
  },

  async moveIssue(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] moveIssue called - not available in demo mode')
    return { success: true }
  },

  async duplicateIssue(): Promise<{ success: boolean; issue: Issue }> {
    console.warn(
      '[Demo Mode] duplicateIssue called - not available in demo mode'
    )
    return { success: true, issue: DEMO_ISSUES[0] }
  },

  async moveDoc(): Promise<{ success: boolean }> {
    console.warn('[Demo Mode] moveDoc called - not available in demo mode')
    return { success: true }
  },

  async duplicateDoc(): Promise<{ success: boolean; doc: Doc }> {
    console.warn('[Demo Mode] duplicateDoc called - not available in demo mode')
    return { success: true, doc: DEMO_DOCS[0] }
  },

  async advancedSearch(): Promise<{ issues: Issue[] }> {
    return { issues: DEMO_ISSUES }
  },

  async getIssuesByUuid(): Promise<{ issues: Issue[] }> {
    return { issues: [] }
  },

  async getDocsBySlug(): Promise<{ docs: Doc[] }> {
    return { docs: [] }
  },

  async getPrsByUuid(): Promise<{ prs: PullRequest[] }> {
    return { prs: [] }
  },

  // Entity Actions
  async getEntityActions(
    request: GetEntityActionsRequest
  ): Promise<GetEntityActionsResponse> {
    const actions: EntityAction[] = []

    // Common CRUD actions for all entity types
    const commonCrudActions: EntityAction[] = [
      {
        $typeName: 'centy.EntityAction',
        id: 'edit',
        label: 'Edit',
        category: ActionCategory.CRUD,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: 'e',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'move',
        label: 'Move',
        category: ActionCategory.CRUD,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: 'm',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'duplicate',
        label: 'Duplicate',
        category: ActionCategory.CRUD,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'delete',
        label: 'Delete',
        category: ActionCategory.CRUD,
        enabled: true,
        disabledReason: '',
        destructive: true,
        keyboardShortcut: '',
      },
    ]

    // External actions (for Issues)
    const externalActions: EntityAction[] = [
      {
        $typeName: 'centy.EntityAction',
        id: 'open-vscode',
        label: 'Open in VS Code',
        category: ActionCategory.EXTERNAL,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'open-terminal',
        label: 'Open in Terminal',
        category: ActionCategory.EXTERNAL,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
    ]

    // Mode actions (AI) for issues
    const modeActions: EntityAction[] = [
      {
        $typeName: 'centy.EntityAction',
        id: 'ai-plan',
        label: 'AI Plan',
        category: ActionCategory.MODE,
        enabled: false,
        disabledReason: 'AI features not available in demo mode',
        destructive: false,
        keyboardShortcut: '',
      },
    ]

    // Status actions for issues
    const issueStatusActions: EntityAction[] = [
      {
        $typeName: 'centy.EntityAction',
        id: 'status:open',
        label: 'Open',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'status:in-progress',
        label: 'In Progress',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'status:closed',
        label: 'Closed',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
    ]

    // PR status actions
    const prStatusActions: EntityAction[] = [
      {
        $typeName: 'centy.EntityAction',
        id: 'status:draft',
        label: 'Draft',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'status:open',
        label: 'Open',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'status:merged',
        label: 'Merged',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'status:closed',
        label: 'Closed',
        category: ActionCategory.STATUS,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: '',
      },
    ]

    // PR-specific CRUD actions (no move/duplicate support)
    const prCrudActions: EntityAction[] = [
      {
        $typeName: 'centy.EntityAction',
        id: 'edit',
        label: 'Edit',
        category: ActionCategory.CRUD,
        enabled: true,
        disabledReason: '',
        destructive: false,
        keyboardShortcut: 'e',
      },
      {
        $typeName: 'centy.EntityAction',
        id: 'delete',
        label: 'Delete',
        category: ActionCategory.CRUD,
        enabled: true,
        disabledReason: '',
        destructive: true,
        keyboardShortcut: '',
      },
    ]

    switch (request.entityType) {
      case EntityType.ISSUE:
        actions.push(...modeActions)
        actions.push(...externalActions)
        actions.push(...commonCrudActions)
        actions.push(...issueStatusActions)
        break
      case EntityType.PR:
        actions.push(...prCrudActions)
        actions.push(...prStatusActions)
        break
      case EntityType.DOC:
        actions.push(...commonCrudActions)
        break
      default:
        actions.push(...commonCrudActions)
    }

    return {
      $typeName: 'centy.GetEntityActionsResponse',
      actions,
      success: true,
      error: '',
    }
  },
}

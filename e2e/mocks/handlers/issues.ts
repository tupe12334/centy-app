import type { GrpcMocker } from '../../utils/mock-grpc'
import {
  ListIssuesRequestSchema,
  ListIssuesResponseSchema,
  GetIssueRequestSchema,
  IssueSchema,
  GetIssueByDisplayNumberRequestSchema,
  CreateIssueRequestSchema,
  CreateIssueResponseSchema,
  UpdateIssueRequestSchema,
  UpdateIssueResponseSchema,
  DeleteIssueRequestSchema,
  DeleteIssueResponseSchema,
  GetNextIssueNumberRequestSchema,
  GetNextIssueNumberResponseSchema,
} from '@/gen/centy_pb'
import type {
  Issue,
  ListIssuesResponse,
  CreateIssueResponse,
  UpdateIssueResponse,
  DeleteIssueResponse,
  GetNextIssueNumberResponse,
  ListIssuesRequest,
  GetIssueRequest,
  GetIssueByDisplayNumberRequest,
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@/gen/centy_pb'
import { createMockIssue, mockIssues } from '../../fixtures/issues'
import { mockManifest } from '../../fixtures/config'

interface IssueHandlerOptions {
  issues?: Issue[]
  onCreateIssue?: (request: CreateIssueRequest) => Issue
  onUpdateIssue?: (request: UpdateIssueRequest, existing: Issue) => Issue
  onDeleteIssue?: (issueId: string) => boolean
}

/**
 * Adds issue-related handlers to the GrpcMocker.
 */
export function addIssueHandlers(
  mocker: GrpcMocker,
  options: IssueHandlerOptions = {}
): GrpcMocker {
  const issues = options.issues ?? [...mockIssues]
  let nextDisplayNumber = issues.length + 1

  // ListIssues
  mocker.addHandler(
    'ListIssues',
    ListIssuesRequestSchema,
    ListIssuesResponseSchema,
    (request: ListIssuesRequest): ListIssuesResponse => {
      let filteredIssues = issues

      // Filter by status if provided
      if (request.status) {
        filteredIssues = filteredIssues.filter(
          i => i.metadata?.status === request.status
        )
      }

      // Filter by priority if provided
      if (request.priority !== undefined && request.priority > 0) {
        filteredIssues = filteredIssues.filter(
          i => i.metadata?.priority === request.priority
        )
      }

      return {
        issues: filteredIssues,
        totalCount: filteredIssues.length,
        $typeName: 'centy.ListIssuesResponse',
      }
    }
  )

  // GetIssue
  mocker.addHandler(
    'GetIssue',
    GetIssueRequestSchema,
    IssueSchema,
    (request: GetIssueRequest): Issue => {
      const issue = issues.find(i => i.id === request.issueId)
      if (!issue) {
        throw new Error(`Issue not found: ${request.issueId}`)
      }
      return issue
    }
  )

  // GetIssueByDisplayNumber
  mocker.addHandler(
    'GetIssueByDisplayNumber',
    GetIssueByDisplayNumberRequestSchema,
    IssueSchema,
    (request: GetIssueByDisplayNumberRequest): Issue => {
      const issue = issues.find(i => i.displayNumber === request.displayNumber)
      if (!issue) {
        throw new Error(`Issue not found: #${request.displayNumber}`)
      }
      return issue
    }
  )

  // GetNextIssueNumber
  mocker.addHandler(
    'GetNextIssueNumber',
    GetNextIssueNumberRequestSchema,
    GetNextIssueNumberResponseSchema,
    (): GetNextIssueNumberResponse => ({
      issueNumber: String(nextDisplayNumber),
      $typeName: 'centy.GetNextIssueNumberResponse',
    })
  )

  // CreateIssue
  mocker.addHandler(
    'CreateIssue',
    CreateIssueRequestSchema,
    CreateIssueResponseSchema,
    (request: CreateIssueRequest): CreateIssueResponse => {
      const newIssue = options.onCreateIssue
        ? options.onCreateIssue(request)
        : createMockIssue({
            displayNumber: nextDisplayNumber,
            title: request.title,
            description: request.description,
          })

      issues.push(newIssue)
      nextDisplayNumber++

      return {
        success: true,
        error: '',
        id: newIssue.id,
        displayNumber: newIssue.displayNumber,
        issueNumber: newIssue.issueNumber,
        createdFiles: [],
        manifest: mockManifest,
        $typeName: 'centy.CreateIssueResponse',
      }
    }
  )

  // UpdateIssue
  mocker.addHandler(
    'UpdateIssue',
    UpdateIssueRequestSchema,
    UpdateIssueResponseSchema,
    (request: UpdateIssueRequest): UpdateIssueResponse => {
      const index = issues.findIndex(i => i.id === request.issueId)
      if (index === -1) {
        return {
          success: false,
          error: `Issue not found: ${request.issueId}`,
          issue: undefined,
          manifest: mockManifest,
          $typeName: 'centy.UpdateIssueResponse',
        }
      }

      const existing = issues[index]
      const updatedIssue = options.onUpdateIssue
        ? options.onUpdateIssue(request, existing)
        : {
            ...existing,
            title: request.title || existing.title,
            description: request.description || existing.description,
            metadata: {
              ...existing.metadata!,
              status: request.status || existing.metadata?.status || 'open',
              priority:
                request.priority !== undefined
                  ? request.priority
                  : (existing.metadata?.priority ?? 2),
              updatedAt: new Date().toISOString(),
            },
          }

      issues[index] = updatedIssue

      return {
        success: true,
        error: '',
        issue: updatedIssue,
        manifest: mockManifest,
        $typeName: 'centy.UpdateIssueResponse',
      }
    }
  )

  // DeleteIssue
  mocker.addHandler(
    'DeleteIssue',
    DeleteIssueRequestSchema,
    DeleteIssueResponseSchema,
    (request: { issueId: string }): DeleteIssueResponse => {
      const index = issues.findIndex(i => i.id === request.issueId)
      if (index === -1) {
        return {
          success: false,
          error: `Issue not found: ${request.issueId}`,
          manifest: mockManifest,
          $typeName: 'centy.DeleteIssueResponse',
        }
      }

      if (options.onDeleteIssue && !options.onDeleteIssue(request.issueId)) {
        return {
          success: false,
          error: 'Delete cancelled',
          manifest: mockManifest,
          $typeName: 'centy.DeleteIssueResponse',
        }
      }

      issues.splice(index, 1)

      return {
        success: true,
        error: '',
        manifest: mockManifest,
        $typeName: 'centy.DeleteIssueResponse',
      }
    }
  )

  return mocker
}

export type { IssueHandlerOptions }

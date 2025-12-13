import type { GrpcMocker } from '../../utils/mock-grpc'
import {
  ListProjectsRequestSchema,
  ListProjectsResponseSchema,
  IsInitializedRequestSchema,
  IsInitializedResponseSchema,
  GetConfigRequestSchema,
  ConfigSchema,
  GetManifestRequestSchema,
  ManifestSchema,
  GetProjectInfoRequestSchema,
  GetProjectInfoResponseSchema,
} from '@/gen/centy_pb'
import type {
  ListProjectsResponse,
  IsInitializedResponse,
  Config,
  Manifest,
  GetProjectInfoResponse,
  ProjectInfo,
} from '@/gen/centy_pb'
import {
  mockConfig,
  mockManifest,
  mockProjectInfo,
} from '../../fixtures/config'

interface ProjectHandlerOptions {
  projects?: ProjectInfo[]
  isInitialized?: boolean
  config?: Config
  manifest?: Manifest
}

/**
 * Adds project-related handlers to the GrpcMocker.
 */
export function addProjectHandlers(
  mocker: GrpcMocker,
  options: ProjectHandlerOptions = {}
): GrpcMocker {
  const {
    projects = [mockProjectInfo],
    isInitialized = true,
    config = mockConfig,
    manifest = mockManifest,
  } = options

  // ListProjects - Also used as health check by DaemonStatusProvider
  mocker.addHandler(
    'ListProjects',
    ListProjectsRequestSchema,
    ListProjectsResponseSchema,
    (): ListProjectsResponse => ({
      projects,
      totalCount: projects.length,
      $typeName: 'centy.ListProjectsResponse',
    })
  )

  // IsInitialized
  mocker.addHandler(
    'IsInitialized',
    IsInitializedRequestSchema,
    IsInitializedResponseSchema,
    (): IsInitializedResponse => ({
      initialized: isInitialized,
      centyPath: isInitialized ? '/test/project/.centy' : '',
      $typeName: 'centy.IsInitializedResponse',
    })
  )

  // GetConfig
  mocker.addHandler(
    'GetConfig',
    GetConfigRequestSchema,
    ConfigSchema,
    (): Config => config
  )

  // GetManifest
  mocker.addHandler(
    'GetManifest',
    GetManifestRequestSchema,
    ManifestSchema,
    (): Manifest => manifest
  )

  // GetProjectInfo
  mocker.addHandler(
    'GetProjectInfo',
    GetProjectInfoRequestSchema,
    GetProjectInfoResponseSchema,
    (): GetProjectInfoResponse => ({
      found: projects.length > 0,
      project: projects[0],
      $typeName: 'centy.GetProjectInfoResponse',
    })
  )

  return mocker
}

export type { ProjectHandlerOptions }

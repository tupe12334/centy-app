import type { GrpcMocker } from '../../utils/mock-grpc'
import {
  ListDocsRequestSchema,
  ListDocsResponseSchema,
  GetDocRequestSchema,
  DocSchema,
  CreateDocRequestSchema,
  CreateDocResponseSchema,
  UpdateDocRequestSchema,
  UpdateDocResponseSchema,
  DeleteDocRequestSchema,
  DeleteDocResponseSchema,
} from '@/gen/centy_pb'
import type {
  Doc,
  ListDocsResponse,
  CreateDocResponse,
  UpdateDocResponse,
  DeleteDocResponse,
  GetDocRequest,
  CreateDocRequest,
  UpdateDocRequest,
} from '@/gen/centy_pb'
import { createMockDoc, mockDocs } from '../../fixtures/docs'
import { mockManifest } from '../../fixtures/config'

interface DocHandlerOptions {
  docs?: Doc[]
  onCreateDoc?: (request: CreateDocRequest) => Doc
  onUpdateDoc?: (request: UpdateDocRequest, existing: Doc) => Doc
  onDeleteDoc?: (slug: string) => boolean
}

/**
 * Adds doc-related handlers to the GrpcMocker.
 */
export function addDocHandlers(
  mocker: GrpcMocker,
  options: DocHandlerOptions = {}
): GrpcMocker {
  const docs = options.docs ?? [...mockDocs]

  // ListDocs
  mocker.addHandler(
    'ListDocs',
    ListDocsRequestSchema,
    ListDocsResponseSchema,
    (): ListDocsResponse => ({
      docs,
      totalCount: docs.length,
      $typeName: 'centy.ListDocsResponse',
    })
  )

  // GetDoc
  mocker.addHandler(
    'GetDoc',
    GetDocRequestSchema,
    DocSchema,
    (request: GetDocRequest): Doc => {
      const doc = docs.find(d => d.slug === request.slug)
      if (!doc) {
        throw new Error(`Doc not found: ${request.slug}`)
      }
      return doc
    }
  )

  // CreateDoc
  mocker.addHandler(
    'CreateDoc',
    CreateDocRequestSchema,
    CreateDocResponseSchema,
    (request: CreateDocRequest): CreateDocResponse => {
      // Check if slug already exists
      if (docs.some(d => d.slug === request.slug)) {
        return {
          success: false,
          error: `Doc with slug "${request.slug}" already exists`,
          slug: '',
          createdFile: '',
          manifest: mockManifest,
          $typeName: 'centy.CreateDocResponse',
        }
      }

      const newDoc = options.onCreateDoc
        ? options.onCreateDoc(request)
        : createMockDoc({
            slug: request.slug,
            title: request.title,
            content: request.content,
          })

      docs.push(newDoc)

      return {
        success: true,
        error: '',
        slug: newDoc.slug,
        createdFile: `.centy/docs/${newDoc.slug}.md`,
        manifest: mockManifest,
        $typeName: 'centy.CreateDocResponse',
      }
    }
  )

  // UpdateDoc
  mocker.addHandler(
    'UpdateDoc',
    UpdateDocRequestSchema,
    UpdateDocResponseSchema,
    (request: UpdateDocRequest): UpdateDocResponse => {
      const index = docs.findIndex(d => d.slug === request.slug)
      if (index === -1) {
        return {
          success: false,
          error: `Doc not found: ${request.slug}`,
          doc: undefined,
          manifest: mockManifest,
          $typeName: 'centy.UpdateDocResponse',
        }
      }

      const existing = docs[index]
      const updatedDoc = options.onUpdateDoc
        ? options.onUpdateDoc(request, existing)
        : {
            ...existing,
            slug: request.newSlug || existing.slug,
            title: request.title || existing.title,
            content: request.content || existing.content,
            metadata: {
              ...existing.metadata!,
              updatedAt: new Date().toISOString(),
            },
          }

      docs[index] = updatedDoc

      return {
        success: true,
        error: '',
        doc: updatedDoc,
        manifest: mockManifest,
        $typeName: 'centy.UpdateDocResponse',
      }
    }
  )

  // DeleteDoc
  mocker.addHandler(
    'DeleteDoc',
    DeleteDocRequestSchema,
    DeleteDocResponseSchema,
    (request: { slug: string }): DeleteDocResponse => {
      const index = docs.findIndex(d => d.slug === request.slug)
      if (index === -1) {
        return {
          success: false,
          error: `Doc not found: ${request.slug}`,
          manifest: mockManifest,
          $typeName: 'centy.DeleteDocResponse',
        }
      }

      if (options.onDeleteDoc && !options.onDeleteDoc(request.slug)) {
        return {
          success: false,
          error: 'Delete cancelled',
          manifest: mockManifest,
          $typeName: 'centy.DeleteDocResponse',
        }
      }

      docs.splice(index, 1)

      return {
        success: true,
        error: '',
        manifest: mockManifest,
        $typeName: 'centy.DeleteDocResponse',
      }
    }
  )

  return mocker
}

export type { DocHandlerOptions }

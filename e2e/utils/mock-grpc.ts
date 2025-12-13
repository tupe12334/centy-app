import type { Page, Route } from '@playwright/test'
import type { DescMessage, MessageShape } from '@bufbuild/protobuf'
import {
  createGrpcResponse,
  parseGrpcRequest,
  createGrpcHeaders,
  createGrpcError,
} from '../mocks/grpc-utils'

type GrpcHandler<Req extends DescMessage, Res extends DescMessage> = (
  request: MessageShape<Req>
) => MessageShape<Res> | Promise<MessageShape<Res>>

interface HandlerConfig<Req extends DescMessage, Res extends DescMessage> {
  requestSchema: Req
  responseSchema: Res
  handler: GrpcHandler<Req, Res>
}

/**
 * GrpcMocker - A utility for mocking gRPC-Web calls in Playwright tests.
 * Intercepts HTTP requests to the daemon URL and returns mock responses.
 */
export class GrpcMocker {
  private page: Page
  private handlers: Map<string, HandlerConfig<DescMessage, DescMessage>> =
    new Map()
  private daemonUrl: string
  private isSetup = false

  constructor(page: Page, daemonUrl = 'http://localhost:50051') {
    this.page = page
    this.daemonUrl = daemonUrl
  }

  /**
   * Add a handler for a specific gRPC method.
   */
  addHandler<Req extends DescMessage, Res extends DescMessage>(
    method: string,
    requestSchema: Req,
    responseSchema: Res,
    handler: GrpcHandler<Req, Res>
  ): this {
    this.handlers.set(method, {
      requestSchema,
      responseSchema,
      handler,
    } as HandlerConfig<DescMessage, DescMessage>)
    return this
  }

  /**
   * Remove a handler for a specific gRPC method.
   */
  removeHandler(method: string): this {
    this.handlers.delete(method)
    return this
  }

  /**
   * Set up route interception. Call this before navigating to any page.
   */
  async setup(): Promise<void> {
    if (this.isSetup) return

    await this.page.route(
      `${this.daemonUrl}/centy.CentyDaemon/**`,
      async (route: Route) => {
        const url = route.request().url()
        const method = url.split('/').pop()

        if (!method) {
          await route.fulfill({
            status: 400,
            ...createGrpcError(3, 'Invalid request: no method specified'),
          })
          return
        }

        const handlerConfig = this.handlers.get(method)

        if (!handlerConfig) {
          // If no handler, return an error (can be configured to pass through)
          await route.fulfill({
            status: 200,
            ...createGrpcError(12, `Unimplemented method: ${method}`),
          })
          return
        }

        try {
          const postData = route.request().postDataBuffer()
          if (!postData) {
            await route.fulfill({
              status: 200,
              ...createGrpcError(3, 'Invalid request: no body'),
            })
            return
          }

          const request = parseGrpcRequest(
            handlerConfig.requestSchema,
            postData
          )
          const response = await handlerConfig.handler(request)
          const body = createGrpcResponse(
            handlerConfig.responseSchema,
            response
          )

          await route.fulfill({
            status: 200,
            headers: createGrpcHeaders(),
            body,
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          await route.fulfill({
            status: 200,
            ...createGrpcError(13, message),
          })
        }
      }
    )

    this.isSetup = true
  }

  /**
   * Clean up route interception.
   */
  async teardown(): Promise<void> {
    if (!this.isSetup) return

    await this.page.unroute(`${this.daemonUrl}/centy.CentyDaemon/**`)
    this.handlers.clear()
    this.isSetup = false
  }
}

/**
 * Create a GrpcMocker instance with common handlers pre-configured.
 */
export function createGrpcMocker(page: Page, daemonUrl?: string): GrpcMocker {
  return new GrpcMocker(page, daemonUrl)
}

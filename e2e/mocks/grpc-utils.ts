import { create, toBinary, fromBinary } from '@bufbuild/protobuf'
import type { DescMessage, MessageShape } from '@bufbuild/protobuf'

/**
 * Creates a gRPC-Web formatted response from a protobuf message.
 * gRPC-Web frame format: 1 byte flag + 4 bytes length (big-endian) + payload
 */
export function createGrpcResponse<T extends DescMessage>(
  schema: T,
  data: MessageShape<T>
): Buffer {
  const message = create(schema, data)
  const binary = toBinary(schema, message)

  // Create gRPC-Web frame
  const frame = Buffer.alloc(5 + binary.length)
  frame[0] = 0 // No compression flag
  frame.writeUInt32BE(binary.length, 1)
  Buffer.from(binary).copy(frame, 5)

  return frame
}

/**
 * Parses a gRPC-Web request to extract the protobuf message.
 */
export function parseGrpcRequest<T extends DescMessage>(
  schema: T,
  body: Buffer
): MessageShape<T> {
  // Skip the 5-byte gRPC-Web frame header
  const length = body.readUInt32BE(1)
  const payload = body.subarray(5, 5 + length)
  return fromBinary(schema, payload)
}

/**
 * Creates gRPC-Web response headers
 */
export function createGrpcHeaders(): Record<string, string> {
  return {
    'content-type': 'application/grpc-web+proto',
    'grpc-status': '0',
    'grpc-message': '',
  }
}

/**
 * Creates a gRPC-Web error response
 */
export function createGrpcError(
  code: number,
  message: string
): { headers: Record<string, string>; body: Buffer } {
  return {
    headers: {
      'content-type': 'application/grpc-web+proto',
      'grpc-status': String(code),
      'grpc-message': encodeURIComponent(message),
    },
    body: Buffer.alloc(0),
  }
}

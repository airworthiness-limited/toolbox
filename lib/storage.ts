/**
 * Storage helper using MinIO S3 API.
 *
 * Server-side operations (upload, delete, signed URLs) go to MinIO's
 * internal Docker network address. Public URLs are served via the
 * Next.js rewrite in next.config.ts → /s3/{bucket}/{path} → MinIO.
 */

/** MinIO S3 endpoint — internal Docker network for server calls */
const S3_INTERNAL = process.env.S3_ENDPOINT || 'http://minio:9000'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'airworthiness'
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ''

/** Public base URL for browser-facing file links */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || process.env.NEXT_PUBLIC_SITE_URL || ''

/** Build a public URL for a file in a public bucket */
export function getPublicUrl(bucket: string, path: string): string {
  return `${PUBLIC_BASE}/s3/${bucket}/${path}`
}

/**
 * Sign an S3 request using AWS Signature Version 4 (minimal implementation).
 * MinIO requires proper S3 auth for PUT/DELETE operations.
 */
async function s3Headers(
  method: string,
  bucketPath: string,
  contentType?: string,
  payloadHash?: string,
): Promise<Record<string, string>> {
  const url = new URL(`${S3_INTERNAL}/${bucketPath}`)
  const now = new Date()
  const dateStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8)
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const region = 'us-east-1'
  const service = 's3'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`

  const hash = payloadHash || 'UNSIGNED-PAYLOAD'

  const headers: Record<string, string> = {
    host: url.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': hash,
  }
  if (contentType) headers['content-type'] = contentType

  // Canonical headers
  const signedHeaderKeys = Object.keys(headers).sort()
  const canonicalHeaders = signedHeaderKeys.map(k => `${k}:${headers[k]}\n`).join('')
  const signedHeaders = signedHeaderKeys.join(';')

  const canonicalRequest = [
    method,
    url.pathname,
    url.search.replace('?', ''),
    canonicalHeaders,
    signedHeaders,
    hash,
  ].join('\n')

  const encoder = new TextEncoder()

  async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }

  async function sha256Hex(data: string): Promise<string> {
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const canonicalRequestHash = await sha256Hex(canonicalRequest)
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  let signingKey: ArrayBuffer = encoder.encode(`AWS4${S3_SECRET_KEY}`).buffer as ArrayBuffer
  for (const part of [dateStamp, region, service, 'aws4_request']) {
    signingKey = await hmacSha256(signingKey, part)
  }
  const signatureBuf = await hmacSha256(signingKey, stringToSign)
  const signature = Array.from(new Uint8Array(signatureBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  headers['authorization'] = `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return headers
}

/** Upload a file to MinIO */
export async function uploadFile(
  bucket: string,
  path: string,
  body: BodyInit,
  contentType: string,
): Promise<{ error: string | null }> {
  const bucketPath = `${bucket}/${path}`
  const headers = await s3Headers('PUT', bucketPath, contentType, 'UNSIGNED-PAYLOAD')

  const res = await fetch(`${S3_INTERNAL}/${bucketPath}`, {
    method: 'PUT',
    headers,
    body,
  })

  if (!res.ok) return { error: await res.text() }
  return { error: null }
}

/** Remove a file from MinIO */
export async function removeFiles(bucket: string, paths: string[]): Promise<void> {
  for (const p of paths) {
    const bucketPath = `${bucket}/${p}`
    const headers = await s3Headers('DELETE', bucketPath)
    await fetch(`${S3_INTERNAL}/${bucketPath}`, { method: 'DELETE', headers })
  }
}

/** Create a presigned URL for temporary access to a private file */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number,
): Promise<string | null> {
  // For MinIO presigned URLs, we construct a query-string signed URL
  const now = new Date()
  const dateStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8)
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const region = 'us-east-1'
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const credential = `${S3_ACCESS_KEY}/${credentialScope}`

  const url = new URL(`${S3_INTERNAL}/${bucket}/${path}`)
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  })

  const encoder = new TextEncoder()

  async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }

  async function sha256Hex(data: string): Promise<string> {
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const canonicalRequest = [
    'GET',
    url.pathname,
    queryParams.toString(),
    `host:${url.host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const canonicalRequestHash = await sha256Hex(canonicalRequest)
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  let signingKey: ArrayBuffer = encoder.encode(`AWS4${S3_SECRET_KEY}`).buffer as ArrayBuffer
  for (const part of [dateStamp, region, 's3', 'aws4_request']) {
    signingKey = await hmacSha256(signingKey, part)
  }
  const signatureBuf = await hmacSha256(signingKey, stringToSign)
  const signature = Array.from(new Uint8Array(signatureBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  queryParams.set('X-Amz-Signature', signature)

  // Return a public-facing URL through our rewrite proxy
  return `${PUBLIC_BASE}/s3/${bucket}/${path}?${queryParams.toString()}`
}

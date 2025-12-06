// src/index.js
// ESM source; tsup will emit both ESM and CJS builds.
// JSDoc types are used to generate .d.ts via `tsc --emitDeclarationOnly`.

import crypto from "node:crypto";

/**
 * Derive AWS SigV4 signing key.
 * @param {string} secretAccessKey
 * @param {string} dateStamp YYYYMMDD
 * @param {string} region
 * @param {string} service usually "s3"
 * @returns {Buffer}
 */
function getSignatureKey(secretAccessKey, dateStamp, region, service) {
  const kDate = crypto.createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
  return crypto.createHmac("sha256", kService).update("aws4_request").digest();
}

/**
 * Build a SigV4 presigned URL for GET, compatible with S3-like stores.
 *
 * NOTE:
 * - `signingHost` is the host used in the canonical request (e.g., your S3-compatible gateway).
 * - `cdnHost` is the host you want users to hit (e.g., a CDN in front). The signature still uses `signingHost` in the canonical Host header.
 * - If your keys may contain special characters, consider URI-encoding the canonical path segments.
 *
 * @param {object} opts
 * @param {string} opts.key Object key within the bucket, e.g. "dir/file.pdf"
 * @param {string} opts.accessKeyId
 * @param {string} opts.secretAccessKey
 * @param {string} [opts.region="us-east-1"]
 * @param {number} [opts.expiresIn=3600] Expiry in seconds
 * @param {string} [opts.bucket="your-bucket-name"] Bucket name for path-style signing
 * @param {string} [opts.signingHost="signinghost.com"] Host used in canonical request "host:" header
 * @param {string} [opts.cdnHost="cdn.example.com"] Host for the final returned URL
 * @returns {string} Presigned URL
 *
 * @example
 * const url = createPresignedUrlV4({
 *   key: "path/to/file.txt",
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *   region: process.env.AWS_REGION || "us-east-1",
 *   bucket: process.env.BUCKET_NAME || "your-bucket-name",
 *   signingHost: process.env.OBJECT_STORAGE_EXTERNAL_ENDPOINT || "signinghost.com",
 *   cdnHost: process.env.CDN_ENDPOINT || "cdn.example.com",
 *   expiresIn: 900
 * });
 */
export function createPresignedUrlV4({
  key,
  accessKeyId,
  secretAccessKey,
  region = "us-east-1",
  expiresIn = 3600,
  bucket = "your-bucket-name",
  signingHost = "signinghost.com",
  cdnHost = "cdn.example.com"
}) {
  if (!key) throw new Error("key is required");
  if (!accessKeyId || !secretAccessKey) throw new Error("AWS credentials are required");

  // Timestamps
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const datetime = new Date().toISOString().replace(/[-]|\.\d{3}/g, ''); // YYYY-MM-DDTHHMMSSZ

  // Algorithm & scope
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${date}/${region}/s3/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  // Query params — must be alphabetically sorted for the canonical request
  /** @type {Record<string, string>} */
  const queryParams = {
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": credential,
    "X-Amz-Date": datetime,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host"
  };

  const sortedQuery = Object.keys(queryParams)
    .sort()
    .map(k => `${k}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  // Canonical request (GET, path-style)
  // If your object keys contain characters needing encoding, encode each path segment here.
  const canonicalPath = `/${bucket}/${key}`;
  const canonicalHeaders = `host:${signingHost}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    "GET",
    canonicalPath,
    sortedQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");

  // String to sign
  const canonicalHash = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
  const stringToSign = [algorithm, datetime, credentialScope, canonicalHash].join("\n");

  // Signature
  const signingKey = getSignatureKey(secretAccessKey, date, region, "s3");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  // Final URL uses the CDN host, but is signed against signingHost
  return `https://${cdnHost}/${key}?${sortedQuery}&X-Amz-Signature=${signature}`;
}

/**
 * Convenience wrapper that pulls typical values from process.env.
 * NOTE: The library itself does NOT import dotenv; apps can call `import 'dotenv/config'` or load envs however they like.
 *
 * @param {{ key: string, overrides?: Partial<Parameters<typeof createPresignedUrlV4>[0]> }} params
 * @returns {string}
 */
export function createPresignedUrlFromEnv({ key, ...overrides }) {
  return createPresignedUrlV4({
    key,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "us-east-1",
    bucket: process.env.BUCKET_NAME || "your-bucket-name",
    signingHost: process.env.OBJECT_STORAGE_EXTERNAL_ENDPOINT || "signinghost.com",
    cdnHost: process.env.CDN_ENDPOINT || "cdn.example.com",
    ...overrides
  });
}

// CJS interop (tsup will emit CJS too). Not strictly necessary, but harmless in ESM source.
// export default { createPresignedUrlV4, createPresignedUrlFromEnv };


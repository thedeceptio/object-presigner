import crypto from "node:crypto";

export function createPresignedUrlV4({
  key,
  accessKeyId,
  secretAccessKey,
  region = "us-east-1",
  expiresIn = 3600,
  bucket = "your-bucket-name",
  signingHost = "signinghost.com",
  cdnHost = "cdn.example.com",
}) {
  if (!key) throw new Error("key is required");
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are required");
  }

  // Timestamps
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");           // YYYYMMDD
  const datetime = now.toISOString().replace(/[:\-]|\.\d{3}/g, "");        // YYYYMMDDTHHMMSSZ

  // Algorithm & scope
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${date}/${region}/s3/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  // Query params (alphabetically sorted in the canonical request)
  const queryParams = {
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": credential,
    "X-Amz-Date": datetime,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };

  const sortedQueryParams = Object.keys(queryParams)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  // Canonical request (GET, path-style)
  const path = `/${bucket}/${key}`;
  const canonicalHeaders = `host:${signingHost}`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    "GET",
    path,
    sortedQueryParams,
    canonicalHeaders,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");

  // String to sign
  const canonicalHash = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
  const stringToSign = [algorithm, datetime, credentialScope, canonicalHash].join("\n");

  // Derive signing key
  const getSignatureKey = (sk, dateStamp, regionName, serviceName) => {
    const kDate = crypto.createHmac("sha256", `AWS4${sk}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
    return crypto.createHmac("sha256", kService).update("aws4_request").digest();
  };

  const signingKey = getSignatureKey(secretAccessKey, date, region, "s3");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  // Final URL uses the CDN host; query string is what was signed
  return `https://${cdnHost}/${key}?${sortedQueryParams}&X-Amz-Signature=${signature}`;
}

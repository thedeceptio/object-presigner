# @thedeceptio/object-presigner

A lightweight library to generate AWS SigV4 presigned URLs compatible with any S3-compatible object storage (MinIO, Cloudflare R2, DigitalOcean Spaces, AWS S3, etc.).

A key feature of this library is the ability to separate the **signing host** (internal/origin) from the **CDN host** (public/edge), allowing you to sign URLs that point to a CDN while validating against the origin.

## Features

-   **Zero Dependencies**: Uses native Node.js `crypto` module.
-   **S3 Compatible**: Works with AWS S3 and any S3-compatible storage.
-   **CDN Friendly**: Explicitly supports separate signing and public (CDN) hosts.
-   **Environment Variable Support**: Optional helper to configure via `process.env`.
-   **Type Safe**: Written in JS with JSDoc types, includes TypeScript definition files.

[GitHub Repository](https://github.com/thedeceptio/object-presigner)

## Install

```bash
npm install @thedeceptio/object-presigner
# or
yarn add @thedeceptio/object-presigner
# or
pnpm add @thedeceptio/object-presigner
```

## Usage

### Basic Usage

Use `createPresignedUrlV4` for full control over parameters.

```javascript
import { createPresignedUrlV4 } from "@thedeceptio/object-presigner";

const url = createPresignedUrlV4({
  key: "uploads/image.png",
  accessKeyId: "YOUR_ACCESS_KEY",
  secretAccessKey: "YOUR_SECRET_KEY",
  region: "us-east-1",             // default: us-east-1
  bucket: "my-bucket",             // default: your-bucket-name
  signingHost: "s3.example.com",   // The endpoint used for signing
  cdnHost: "cdn.example.com",      // The public domain in the returned URL
  expiresIn: 3600                  // default: 3600 (1 hour)
});

console.log(url);
// https://cdn.example.com/uploads/image.png?X-Amz-Algorithm=...
```

### Using Environment Variables

Use `createPresignedUrlFromEnv` to automatically load configuration from `process.env`. You can still override any parameter.

```javascript
import { createPresignedUrlFromEnv } from "@thedeceptio/object-presigner";

// Assumes process.env has AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.
const url = createPresignedUrlFromEnv({
  key: "uploads/document.pdf",
  expiresIn: 900 // Override default expiry to 15 mins
});
```

#### Supported Environment Variables

| Variable Name | Description | Default |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Your Access Key ID | `""` |
| `AWS_SECRET_ACCESS_KEY` | Your Secret Access Key | `""` |
| `AWS_REGION` | Region | `"us-east-1"` |
| `BUCKET_NAME` | Bucket Name | `"your-bucket-name"` |
| `OBJECT_STORAGE_EXTERNAL_ENDPOINT` | Host used for signing (Origin) | `"signinghost.com"` |
| `CDN_ENDPOINT` | Host used for the final URL (Public) | `"cdn.example.com"` |

## API Reference

### `createPresignedUrlV4(options)`

Generates a SigV4 presigned URL for a `GET` request.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `key` | `string` | **Required** | Object key (path) within the bucket. |
| `accessKeyId` | `string` | **Required** | AWS Access Key ID. |
| `secretAccessKey` | `string` | **Required** | AWS Secret Access Key. |
| `region` | `string` | `"us-east-1"` | AWS Region. |
| `bucket` | `string` | `"your-bucket-name"` | Name of the bucket. |
| `signingHost` | `string` | `"signinghost.com"` | The host used in the canonical request signature. |
| `cdnHost` | `string` | `"cdn.example.com"` | The host used in the returned URL. |
| `expiresIn` | `number` | `3600` | Expiration time in seconds. |

### `createPresignedUrlFromEnv(options)`

Wrapper around `createPresignedUrlV4` that defaults to environment variables. Accepts an object with `key` (required) and optional overrides for any other parameter.

## Configuration

### Signing Host vs CDN Host

- **`signingHost`**: This is the host that the storage service expects in the `Host` header during signature verification. For direct S3 access, this is usually `s3.<region>.amazonaws.com` or `<bucket>.s3.<region>.amazonaws.com`.
- **`cdnHost`**: This is the host that will appear in the generated URL. Use this if you are serving files through a CDN (like CloudFront) or a proxy that forwards requests to the storage service.

## License

MIT

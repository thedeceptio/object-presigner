# @thedeceptio/object-presigner

Generate presigned URLs compatible with S3-like object storage.

[GitHub Repository](https://github.com/thedeceptio/object-presigner)

## Features

- **S3 Compatible**: Works with AWS S3 and any S3-compatible storage (MinIO, DigitalOcean Spaces, etc.).
- **Secure**: Generates AWS Signature V4 presigned URLs without exposing credentials.
- **Flexible**: Supports custom signing hosts and CDN hosts for complex architecture.
- **Lightweight**: Zero dependencies (uses Node.js built-in `crypto`).

## Install

```bash
npm i @thedeceptio/object-presigner
```

## Usage

```javascript
import { createPresignedUrlV4 } from "@thedeceptio/object-presigner";

try {
  const url = createPresignedUrlV4({
    key: "example-image.jpg",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: "my-bucket",
    region: "us-east-1",
    // Optional
    expiresIn: 3600, // 1 hour
    signingHost: "s3.us-east-1.amazonaws.com",
    cdnHost: "cdn.mydomain.com" 
  });

  console.log("Presigned URL:", url);
} catch (error) {
  console.error("Error generating URL:", error.message);
}
```

## API Reference

### `createPresignedUrlV4(params)`

Generates a presigned URL for a GET request.

#### Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `key` | `string` | Yes | - | The key (filename/path) of the object. |
| `accessKeyId` | `string` | Yes | - | AWS Access Key ID. |
| `secretAccessKey` | `string` | Yes | - | AWS Secret Access Key. |
| `bucket` | `string` | No | `"your-bucket-name"` | The name of the S3 bucket. |
| `region` | `string` | No | `"us-east-1"` | AWS region. |
| `expiresIn` | `number` | No | `3600` | Expiration time in seconds. |
| `signingHost` | `string` | No | `"signinghost.com"` | Hostname used for the signature calculation (e.g., `s3.amazonaws.com`). |
| `cdnHost` | `string` | No | `"cdn.example.com"` | Hostname used in the final returned URL. |

## Configuration

### Signing Host vs CDN Host

- **`signingHost`**: This is the host that the storage service expects in the `Host` header during signature verification. For direct S3 access, this is usually `s3.<region>.amazonaws.com` or `<bucket>.s3.<region>.amazonaws.com`.
- **`cdnHost`**: This is the host that will appear in the generated URL. Use this if you are serving files through a CDN (like CloudFront) or a proxy that forwards requests to the storage service.

## License

MIT

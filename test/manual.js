import { createPresignedUrlV4 } from '../dist/index.js';

// Show usage information
function showUsage() {
  console.log('Usage: node test/manual.js [options]\n');
  console.log('Required options:');
  console.log('  --key <string>                    Object key (filename/path)');
  console.log('  --access-key-id <string>          AWS access key ID');
  console.log('  --secret-access-key <string>      AWS secret access key\n');
  console.log('Optional options:');
  console.log('  --region <string>                 AWS region (default: us-east-1)');
  console.log('  --expires-in <number>             Expiration time in seconds (default: 3600)');
  console.log('  --bucket <string>                 Bucket name (default: your-bucket-name)');
  console.log('  --signing-host <string>           Signing host (default: signinghost.com)');
  console.log('  --cdn-host <string>               CDN host (default: cdn.example.com)\n');
  console.log('Example:');
  console.log('  node test/manual.js \\');
  console.log('    --key "my-file.pdf" \\');
  console.log('    --access-key-id "AKIAIOSFODNN7EXAMPLE" \\');
  console.log('    --secret-access-key "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \\');
  console.log('    --region "us-east-1" \\');
  console.log('    --expires-in 3600 \\');
  console.log('    --bucket "my-bucket" \\');
  console.log('    --signing-host "s3.amazonaws.com" \\');
  console.log('    --cdn-host "cdn.example.com"');
}

// Check for help flag first
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        // Handle numeric values
        if (key === 'expiresIn' && !isNaN(value)) {
          params[key] = parseInt(value, 10);
        } else {
          params[key] = value;
        }
        i++; // Skip next argument as it's the value
      } else {
        console.error(`Error: Missing value for ${arg}`);
        process.exit(1);
      }
    }
  }

  return params;
}

// Main execution
const params = parseArgs();

// Validate required parameters
if (!params.key) {
  console.error('Error: --key is required\n');
  showUsage();
  process.exit(1);
}

if (!params.accessKeyId) {
  console.error('Error: --access-key-id is required\n');
  showUsage();
  process.exit(1);
}

if (!params.secretAccessKey) {
  console.error('Error: --secret-access-key is required\n');
  showUsage();
  process.exit(1);
}

// Generate presigned URL
try {
  const url = createPresignedUrlV4({
    key: params.key,
    accessKeyId: params.accessKeyId,
    secretAccessKey: params.secretAccessKey,
    region: params.region,
    expiresIn: params.expiresIn,
    bucket: params.bucket,
    signingHost: params.signingHost,
    cdnHost: params.cdnHost
  });

  console.log('✓ Presigned URL generated successfully!\n');
  console.log('URL:');
  console.log(url);
  console.log('\nTo test this URL:');
  console.log(`  curl -I "${url}"`);
  console.log('  or open it in your browser');
} catch (error) {
  console.error('✗ Error generating presigned URL:');
  console.error(`  ${error.message}`);
  process.exit(1);
}

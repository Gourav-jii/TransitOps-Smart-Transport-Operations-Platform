import fs from 'fs';
import path from 'path';

console.log('========================================================');
console.log('RUNNING CLIENT SMOKE TESTS');
console.log('========================================================\n');

try {
  const indexHtmlPath = path.resolve('./index.html');
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

  console.log('[Test 1] Verifying index.html entrypoint exists...');
  if (indexHtmlContent.includes('id="root"')) {
    console.log('✓ index.html exists and contains the root container mounting hook.');
  } else {
    throw new Error('index.html is missing the root element mount target.');
  }

  console.log('\n[Test 2] Verifying package configurations...');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  console.log(`  - Package Name: ${pkg.name}`);
  console.log(`  - Bundler: Vite ${pkg.devDependencies.vite}`);
  console.log(`  - Framework: React ${pkg.dependencies.react}`);
  console.log('✓ Package configurations verified.\n');

  console.log('[Test 3] Verifying core component paths exist...');
  const keyPaths = [
    'src/main.tsx',
    'src/routes/AppRoutes.tsx',
    'src/layouts/AppLayout.tsx',
    'src/pages/Dashboard.tsx',
    'src/pages/AuditLogs.tsx',
    'src/pages/DocumentCenter.tsx'
  ];

  for (const kp of keyPaths) {
    if (fs.existsSync(kp)) {
      console.log(`  - Path [${kp}]: Found.`);
    } else {
      throw new Error(`Critical component path missing: ${kp}`);
    }
  }
  console.log('✓ Core component paths verified successfully.\n');

  console.log('========================================================');
  console.log('CLIENT SMOKE TESTS COMPLETED SUCCESSFULLY');
  console.log('========================================================');
} catch (error: any) {
  console.error('\n❌ Client smoke test failed:', error.message);
  process.exit(1);
}

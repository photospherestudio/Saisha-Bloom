import { execFileSync } from 'node:child_process';

const prisma = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
const existingMigrations = [
  '20260830000000_initial_schema',
  '20260830010000_family_utility',
  '20260831120000_user_display_name',
  '20260831130000_enable_rls',
  '20260831140000_auth_rate_limit',
];

function deploy() {
  try {
    const output = execFileSync(prisma, ['migrate', 'deploy'], { encoding: 'utf8' });
    process.stdout.write(output);
  } catch (error) {
    process.stdout.write(error?.stdout?.toString?.() ?? '');
    process.stderr.write(error?.stderr?.toString?.() ?? '');
    throw error;
  }
}

try {
  deploy();
} catch (error) {
  const output = `${error?.stdout ?? ''}\n${error?.stderr ?? ''}`;
  if (!output.includes('P3005') || process.env.ALLOW_PRISMA_BASELINE !== 'true') throw error;
  const schema = execFileSync(prisma, ['db', 'pull', '--print'], { encoding: 'utf8' });
  for (const model of ['User', 'Child', 'Milestone', 'MilestoneResponse', 'AuthRateLimit']) {
    if (!schema.includes(`model ${model} {`)) throw new Error(`Refusing to baseline: expected model ${model} was not found.`);
  }
  for (const migration of existingMigrations) execFileSync(prisma, ['migrate', 'resolve', '--applied', migration], { stdio: 'inherit' });
  deploy();
}

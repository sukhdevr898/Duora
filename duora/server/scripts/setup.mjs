#!/usr/bin/env node
/**
 * One-command setup helper.
 *
 *   npm run setup
 *
 * Checks the environment, prints exactly what to paste into Render and
 * (optionally) creates the schema in the configured database.
 */
import { spawn } from 'node:child_process';

const isPostgres = (url) => /^postgres(ql)?:\/\//i.test(url);

function line(char = '─') {
  return char.repeat(64);
}

function title(text) {
  console.log(`\n${line()}\n${text}\n${line()}\n`);
}

const env = process.env;
const url = env.DATABASE_URL || 'file:./data/duora.db';

title('Duora server — setup');

if (isPostgres(url)) {
  console.log('✅ DATABASE_URL points at a Postgres server (Supabase).');
  try {
    const parsed = new URL(url);
    console.log(`   host     : ${parsed.hostname}`);
    console.log(`   port     : ${parsed.port || 5432}`);
    console.log(`   database : ${parsed.pathname.replace(/^\//, '') || 'postgres'}`);
    if (parsed.hostname.endsWith('supabase.co') && !parsed.hostname.includes('pooler')) {
      console.warn(
        '\n⚠️  That is the direct Supabase host. Render has no IPv6, so use the\n' +
          '    pooled host instead:  aws-0-<region>.pooler.supabase.com:5432\n' +
          '    (Supabase → Project Settings → Database → Connection string → URI).',
      );
    }
  } catch {
    console.warn('⚠️  DATABASE_URL could not be parsed. Copy it again from Supabase.');
  }
} else {
  console.log('ℹ️  DATABASE_URL is a local SQLite file — perfect for development.');
  console.log('   For production copy the Supabase connection string into .env.');
}

const checks = [
  ['JWT_ACCESS_SECRET', env.JWT_ACCESS_SECRET],
  ['JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET],
];
let missing = 0;
for (const [key, value] of checks) {
  if (!value || value.length < 16 || value.includes('change-me')) {
    console.log(`⚠️  ${key} is missing or still the development default.`);
    missing += 1;
  }
}
if (missing === 0) {
  console.log('✅ JWT secrets are set.');
}

title('What to paste into Render (one value)');
console.log('DATABASE_URL = ' + (isPostgres(url) ? '<your Supabase connection string>' : '<paste it from Supabase>'));
console.log('\nRender generates the JWT secrets for you (blueprint: generateValue: true).');

title('Creating the schema');
const child = spawn(process.execPath, ['--import', 'tsx', 'src/db.ts'], {
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => {
  console.log(code === 0 ? '\n✅ Schema is ready. Run `npm run dev`.' : '\n❌ Schema creation failed.');
  process.exit(code ?? 1);
});

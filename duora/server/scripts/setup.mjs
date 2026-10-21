#!/usr/bin/env node
/**
 * One-command setup helper.
 *
 *   npm run setup
 *
 * Checks the environment, prints exactly what to paste into Render and
 * creates the schema in the configured database.
 */
import { spawn } from 'node:child_process';

const PROJECT_REF = 'jfttevfwqonxasoahiby';
const REGION = 'ap-south-1';
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
    if (parsed.hostname.startsWith('db.') && parsed.hostname.endsWith('supabase.co')) {
      console.warn(
        '\n⚠️  That is the direct Supabase host — it is IPv6-only, so Render cannot\n' +
          '    reach it. Use the pooled host instead:\n' +
          `      postgresql://postgres.${PROJECT_REF}:PASSWORD@aws-0-${REGION}.pooler.supabase.com:5432/postgres?sslmode=require`,
      );
    }
    if (!parsed.hostname.includes('supabase.co')) {
      console.log('\nℹ️  Not a Supabase host — make sure the database exists and the schema is applied.');
    }
  } catch {
    console.warn('⚠️  DATABASE_URL could not be parsed. Copy it again from Supabase.');
  }
} else {
  console.log('ℹ️  DATABASE_URL is a local SQLite file — perfect for development.');
  console.log('   For production copy the Supabase connection string into .env.');
}

console.log(`\n   Supabase project: sukhdevr898's Project (ref ${PROJECT_REF}, region ${REGION})`);

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

if (env.SUPABASE_URL) {
  console.log('✅ Supabase Auth is enabled (sign-in fallback + access-token verification).');
  if (!env.SUPABASE_SECRET_KEY) {
    console.log('   ℹ️  Without SUPABASE_SECRET_KEY new accounts are not mirrored into Supabase Auth.');
  }
} else {
  console.log('ℹ️  Supabase Auth is off — the server uses its own email + password.');
}

title('What to paste into Render');
console.log('DATABASE_URL        = <your Supabase connection string>');
if (!env.SUPABASE_SECRET_KEY) {
  console.log('SUPABASE_SECRET_KEY = <the sb_secret_… key from Supabase>');
}
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

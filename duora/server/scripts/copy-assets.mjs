/**
 * Copies the SQL schema files into the compiled output.
 * `tsc` only emits JavaScript, but the migration reads the schema from disk
 * next to the compiled module.
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const from = join(process.cwd(), 'src');
const to = join(process.cwd(), 'dist');

mkdirSync(to, { recursive: true });

for (const file of readdirSync(from)) {
  if (file.endsWith('.sql')) {
    copyFileSync(join(from, file), join(to, file));
    console.log(`copied ${file}`);
  }
}

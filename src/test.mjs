import { join, dirname } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from './parse.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceCode = readFileSync(join(__dirname, '.', 'code-template.js'), { encoding: 'utf-8' });

console.log(sourceCode);

parse(sourceCode);

writeFileSync(join(__dirname, '.', 'code-template-parsed.json'), JSON.stringify(parse(sourceCode), null, 2));

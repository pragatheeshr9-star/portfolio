import { cpSync, mkdirSync } from 'node:fs';

cpSync('public', '.next/standalone/public', { recursive: true });
mkdirSync('.next/standalone/.next', { recursive: true });
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });

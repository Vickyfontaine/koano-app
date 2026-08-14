// Minimal .env.local loader for tsx scripts (tsx does not auto-load it).
import { readFileSync } from 'fs';
export function loadEnv(): void {
  let raw = '';
  try {
    raw = readFileSync('.env.local', 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

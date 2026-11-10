import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const roots = ['src', 'docs'];
const allowedDigitRuns = new Set(['20000000']);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return [path];
  });
}

function stripUrls(text: string): string {
  return text
    .replace(/https?:\/\/[^\s)'"`]+/g, ' ')
    .replace(/\b[a-z0-9.-]+\.[a-z]{2,}\/[^\s)'"`]+/gi, ' ');
}

function stripPaths(text: string): string {
  return text.replace(/(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+/g, ' ');
}

describe('sanitization', () => {
  it('rejects identifiers, phones, bearer tokens and long secrets', () => {
    const jids = ['@' + 's.whatsapp' + '.net', '@' + 'g.us', '@' + 'c.us', '@' + 'lid'];
    const problems: string[] = [];
    for (const root of roots) {
      for (const file of files(root)) {
        const raw = readFileSync(file, 'utf8');
        const withoutUrls = stripUrls(raw);
        for (const jid of jids) {
          if (raw.includes(jid)) problems.push(`${file} contiene un sufijo de JID`);
        }
        for (const run of withoutUrls.match(/\d{10,}/g) ?? []) {
          if (!allowedDigitRuns.has(run)) problems.push(`${relative('.', file)} tiene una corrida numérica ${run}`);
        }
        const bearer = new RegExp('\\bbearer\\s+[A-Za-z0-9._-]{8,}', 'i');
        const tokenEq = new RegExp('token' + '=', 'i');
        if (bearer.test(raw)) problems.push(`${file} parece un bearer real`);
        if (tokenEq.test(raw)) problems.push(`${file} contiene un par token`);
        if (/\bh_[0-9a-f]{6,}/i.test(raw)) problems.push(`${file} contiene un id h_`);
        if (/\breq_[0-9a-f]{32}\b/i.test(raw)) problems.push(`${file} contiene un requestId real`);
        if (/\bmed_[0-9a-f]{24}\b/i.test(raw)) problems.push(`${file} contiene un media id real`);
        if (/\bpro_[0-9a-f]{32}\b/i.test(raw)) problems.push(`${file} contiene un id pro_ real`);
        const withoutLocations = stripPaths(stripUrls(raw));
        if (/\b[A-Za-z0-9+/]{40,}={0,2}\b/.test(withoutLocations)) {
          problems.push(`${file} contiene una cadena larga tipo base64`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

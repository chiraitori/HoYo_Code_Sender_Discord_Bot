const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(file) : [file];
  });
}

const assets = filesUnder(path.resolve(__dirname, '../.next/static'));
const pages = filesUnder(path.resolve(__dirname, '../.next/server/app'))
  .filter(file => /\.(html|rsc)$/.test(file));
const privateValues = ['MAIN_BOT_API_URL', 'AUTH_BOT_SECRET',
  process.env.MAIN_BOT_API_URL, process.env.AUTH_BOT_SECRET].filter(Boolean);
if (process.env.MAIN_BOT_API_URL) privateValues.push(new URL(process.env.MAIN_BOT_API_URL).hostname);

for (const file of [...assets, ...pages]) {
  const body = fs.readFileSync(file);
  assert.ok(!privateValues.some(value => body.includes(Buffer.from(value))),
    `Private backend information in browser artifact: ${path.relative(process.cwd(), file)}`);
}
assert.ok(!assets.some(file => file.endsWith('.map')), 'Production browser source maps must remain disabled');
console.log(`Privacy check passed: ${assets.length} browser assets and ${pages.length} public page artifacts.`);

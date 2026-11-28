import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const { version } = JSON.parse(read('package.json'));
const files = readdirSync(new URL('..', import.meta.url)).filter(f => f.endsWith('.js') && f !== 'sw.js');
const game = files.find(f => f.startsWith('game_'));

test('the version is MAJOR.MINOR.PATCH', () => assert.match(version, /^\d+\.\d+\.\d+$/));

test('every game file, the page and the offline cache use the package version', () => {
  const sw = read('sw.js');
  for (const f of files) {
    assert.ok(f.endsWith(`_v${version}.js`), f);
    assert.ok(sw.includes(`'./${f}'`), `sw.js does not save ${f}`);
    for (const [, used] of read(f).matchAll(/from '\.\/([^']+)'/g)) assert.ok(files.includes(used), `${f} imports ${used}`);
  }
  assert.ok(sw.includes(`'pastel-siege-v${version}'`));
  assert.ok(read('index.html').includes(`const GAME = '${game}'`)); // the page loads the game through its small loader script
});

// two patterns read the version from file names: if they stop matching, the anti-cheat blocks the game's own changes
test('the code that reads file names understands the version', () => {
  const ourFile = new RegExp(read(files.find(f => f.startsWith('bots_'))).match(/const OUR_FILE = \/(.+)\/;/)[1]);
  for (const f of files) assert.match(`https://example.com/${f}:10:5`, ourFile);
  const shown = new RegExp(read(game).match(/const GAME_VERSION = \(import\.meta\.url\.match\(\/(.+?)\/\)/)[1]);
  assert.equal(game.match(shown)[1], `v${version}`);
});

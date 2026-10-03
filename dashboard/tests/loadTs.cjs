const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const cache = new Map();
const sourceRoot = path.resolve(__dirname, '../src');

function loadTs(relativeFile) {
  const file = path.isAbsolute(relativeFile) ? relativeFile : path.join(sourceRoot, relativeFile);
  if (cache.has(file)) return cache.get(file).exports;
  const compiled = new Module(file, module);
  compiled.filename = file;
  compiled.paths = Module._nodeModulePaths(path.dirname(file));
  const nativeRequire = Module.createRequire(file);
  compiled.require = name => {
    if (name === 'server-only') return {};
    const local = name.startsWith('@/') ? path.join(sourceRoot, name.slice(2))
      : name.startsWith('.') ? path.resolve(path.dirname(file), name) : null;
    if (local && fs.existsSync(`${local}.ts`)) return loadTs(`${local}.ts`);
    return nativeRequire(name);
  };
  cache.set(file, compiled);
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  });
  compiled._compile(result.outputText, file);
  return compiled.exports;
}

module.exports = { loadTs };

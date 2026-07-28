#!/usr/bin/env node
/**
 * Compile-checks every source file with the project's Babel config.
 * `node --check` can't parse JSX, so this is the fast syntax gate for CI:
 * it catches parse errors and things like use-before-declaration wiring
 * before they can ship. Exits 1 on the first batch of failures.
 */
const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const SRC_DIR = path.join(__dirname, "..", "src");
const ROOT_FILES = ["App.js"];
const EXTENSIONS = new Set([".js", ".jsx"]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : [];
  });

const files = [
  ...ROOT_FILES.map((f) => path.join(__dirname, "..", f)).filter(fs.existsSync),
  ...walk(SRC_DIR),
];

const failures = [];
for (const file of files) {
  try {
    babel.transformFileSync(file, {
      configFile: path.join(__dirname, "..", "babel.config.js"),
    });
  } catch (error) {
    failures.push({ file: path.relative(path.join(__dirname, ".."), file), message: error.message });
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} file(s) failed to compile:\n`);
  for (const { file, message } of failures) {
    console.error(`• ${file}\n  ${message.split("\n")[0]}\n`);
  }
  process.exit(1);
}

console.log(`✓ Compile OK — ${files.length} files.`);

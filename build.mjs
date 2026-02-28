import * as esbuild from 'esbuild';
import * as fs from 'fs';

// Bundle the component (minified)
await esbuild.build({
  entryPoints: ['src/discourse-comments.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'DiscourseComments',
  outfile: 'dist/discourse-comments.min.js',
  minify: true,
});

console.log('Built dist/discourse-comments.min.js');

// Non-minified version for debugging
await esbuild.build({
  entryPoints: ['src/discourse-comments.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'DiscourseComments',
  outfile: 'dist/discourse-comments.js',
  minify: false,
});

console.log('Built dist/discourse-comments.js');

// Report sizes
const minSize = fs.statSync('dist/discourse-comments.min.js').size;
const fullSize = fs.statSync('dist/discourse-comments.js').size;
console.log(`\nBundle sizes:`);
console.log(`  discourse-comments.min.js: ${(minSize / 1024).toFixed(1)} KB`);
console.log(`  discourse-comments.js: ${(fullSize / 1024).toFixed(1)} KB`);

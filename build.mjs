import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

// Read the WASM file and convert to base64
const wasmPath = path.join('node_modules', 'discourse-api-rs', 'discourse_api_rs_bg.wasm');
const wasmBuffer = fs.readFileSync(wasmPath);
const wasmBase64 = wasmBuffer.toString('base64');

// Create a virtual module that exports the inlined WASM
const wasmLoaderPlugin = {
  name: 'wasm-loader',
  setup(build) {
    // Intercept imports of the WASM module
    build.onResolve({ filter: /discourse-api-rs$/ }, args => {
      return { path: args.path, namespace: 'discourse-api-rs' };
    });

    build.onLoad({ filter: /.*/, namespace: 'discourse-api-rs' }, async () => {
      // Read the JS glue code
      const jsPath = path.join('node_modules', 'discourse-api-rs', 'discourse_api_rs.js');
      let jsCode = fs.readFileSync(jsPath, 'utf8');

      // Replace the default URL-based loading with inline base64
      // The init function checks if module_or_path is undefined and creates a URL
      // We'll modify it to use our embedded WASM instead
      const wasmInit = `
// Embedded WASM as base64
const __embedded_wasm_base64 = "${wasmBase64}";

function __decode_base64(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const __embedded_wasm_bytes = __decode_base64(__embedded_wasm_base64);
`;

      // Replace the URL-based default with our embedded bytes
      jsCode = jsCode.replace(
        /if \(typeof module_or_path === 'undefined'\) \{[^}]+\}/,
        `if (typeof module_or_path === 'undefined') {
        module_or_path = __embedded_wasm_bytes;
      }`
      );

      // No need to modify the fetch case - Uint8Array passes through directly
      // and WebAssembly.instantiate handles it in __wbg_load

      return {
        contents: wasmInit + jsCode,
        loader: 'js',
      };
    });
  },
};

// Bundle the component
await esbuild.build({
  entryPoints: ['src/discourse-comments.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'DiscourseComments',
  outfile: 'dist/discourse-comments.min.js',
  minify: true,
  plugins: [wasmLoaderPlugin],
});

console.log('Built dist/discourse-comments.min.js');

// Also build a non-minified version for debugging
await esbuild.build({
  entryPoints: ['src/discourse-comments.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'DiscourseComments',
  outfile: 'dist/discourse-comments.js',
  minify: false,
  plugins: [wasmLoaderPlugin],
});

console.log('Built dist/discourse-comments.js');

// Report sizes
const minSize = fs.statSync('dist/discourse-comments.min.js').size;
const fullSize = fs.statSync('dist/discourse-comments.js').size;
console.log(`\nBundle sizes:`);
console.log(`  discourse-comments.min.js: ${(minSize / 1024).toFixed(1)} KB`);
console.log(`  discourse-comments.js: ${(fullSize / 1024).toFixed(1)} KB`);

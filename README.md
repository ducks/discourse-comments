# Discourse Comments

WASM-powered embedded comment system for Discourse forums.

## Features

- Framework-agnostic web component
- WASM-based Discourse API client
- Shadow DOM isolation
- TypeScript support

## Development

```bash
npm install
npm run build
```

Open `demo.html` in a browser to see the component in action.

## Usage

```html
<script type="module" src="./dist/index.js"></script>

<discourse-comments
  discourse-url="https://your-forum.com"
  topic-id="123">
</discourse-comments>
```

## Architecture

- `src/discourse-comments.ts` - Web component implementation
- WASM client from [discourse-api-rs](https://github.com/ducks/discourse-api-rs)

## Status

Early development. Currently shows placeholder UI. WASM integration in progress.

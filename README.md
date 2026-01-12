# Discourse Comments

WASM-powered embedded comment system for Discourse forums.

## Features

- Framework-agnostic web component
- WASM-based Discourse API client
- OAuth authentication via Discourse User API Keys
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

## Requirements

**Discourse Version**: For authenticated commenting (OAuth login), your Discourse
instance must be running a version from **December 11, 2025 or later**. This is
when RSA-OAEP padding support was added for User API Key encryption
([PR #36592](https://github.com/discourse/discourse/pull/36592)).

Anonymous comment reading works on any Discourse version.

**CORS Configuration**: Your Discourse instance needs to allow requests from
wherever you host this component. Set `cors_origins` in site settings.

**OAuth Redirect**: For login to work, add your demo URL to the allowed
`user_api_key_allowed_auth_redirects` site setting.

## Architecture

- `src/discourse-comments.ts` - Web component implementation
- WASM client from [discourse-api-rs](https://github.com/ducks/discourse-api-rs)

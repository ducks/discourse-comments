# Discourse Comments

WASM-powered embedded comment system for Discourse forums.

## Features

- Framework-agnostic web component
- WASM-based Discourse API client
- OAuth authentication via Discourse User API Keys
- Shadow DOM isolation
- TypeScript support

## Getting Started

### 1. Build the component

```bash
git clone https://github.com/ducks/discourse-comments.git
cd discourse-comments
npm install
npm run build
```

### 2. Configure your Discourse instance

In your Discourse admin panel (`/admin/site_settings`), configure these settings:

- **`cors_origins`**: Add the domain where you'll host the component
  (e.g., `https://your-blog.com`)
- **`user_api_key_allowed_auth_redirects`**: Add the full URL pattern for OAuth
  redirects (e.g., `https://your-blog.com/*`)

### 3. Create a topic for comments

Create a topic in your Discourse forum that will hold the comments. Note the
topic ID from the URL (e.g., `/t/my-post-comments/123` has topic ID `123`).

### 4. Add to your page

Copy the `dist/` and `wasm/` folders to your site, then add:

```html
<script type="module" src="./dist/index.js"></script>

<discourse-comments
  discourse-url="https://your-forum.com"
  topic-id="123">
</discourse-comments>
```

## Development

```bash
npm install
npm run build
```

Open `demo.html` in a browser to see the component in action.

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

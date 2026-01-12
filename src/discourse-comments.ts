/**
 * Discourse Comments Web Component
 *
 * A WASM-powered embedded comment system for Discourse forums.
 *
 * Usage:
 *   <discourse-comments
 *     discourse-url="https://forum.example.com"
 *     topic-id="123"
 *     client-id="discourse-comments">
 *   </discourse-comments>
 */

// @ts-expect-error - WASM module doesn't have type definitions
import init, { WasmDiscourseClient } from '../wasm/discourse_api_rs.js';

class DiscourseComments extends HTMLElement {
  private shadow: ShadowRoot;
  private discourseUrl: string = '';
  private topicId: string = '';
  private clientId: string = 'discourse-comments';
  private userApiKey: string | null = null;
  private client: WasmDiscourseClient | null = null;
  private isLoading: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['discourse-url', 'topic-id', 'client-id'];
  }

  async connectedCallback() {
    this.discourseUrl = this.getAttribute('discourse-url') || '';
    this.topicId = this.getAttribute('topic-id') || '';
    this.clientId = this.getAttribute('client-id') || 'discourse-comments';

    // Check for stored API key
    this.loadApiKey();

    // Check for OAuth callback
    await this.handleOAuthCallback();

    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (name === 'discourse-url') {
        this.discourseUrl = newValue;
      } else if (name === 'topic-id') {
        this.topicId = newValue;
      } else if (name === 'client-id') {
        this.clientId = newValue;
      }
      this.render();
    }
  }

  private loadApiKey() {
    const storageKey = `discourse-comments-api-key-${this.discourseUrl}`;
    this.userApiKey = localStorage.getItem(storageKey);
  }

  private saveApiKey(key: string) {
    const storageKey = `discourse-comments-api-key-${this.discourseUrl}`;
    localStorage.setItem(storageKey, key);
    this.userApiKey = key;
  }

  private clearApiKey() {
    const storageKey = `discourse-comments-api-key-${this.discourseUrl}`;
    localStorage.removeItem(storageKey);
    this.userApiKey = null;
  }

  private async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get('payload');

    if (payload) {
      try {
        // Get stored private key
        const privateKeyPem = sessionStorage.getItem('discourse-comments-private-key');
        if (!privateKeyPem) {
          throw new Error('Missing private key');
        }

        // Import private key
        const privateKey = await this.importPrivateKey(privateKeyPem);

        // Decode and decrypt the payload (decrypt FIRST, then parse JSON)
        const encryptedData = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        const decryptedData = await window.crypto.subtle.decrypt(
          { name: 'RSA-OAEP' },
          privateKey,
          encryptedData
        );
        const jsonString = new TextDecoder().decode(decryptedData);
        const data = JSON.parse(jsonString);

        // Extract the API key
        if (!data.key) {
          throw new Error('No API key in decrypted payload');
        }
        this.saveApiKey(data.key);

        // Clean up
        sessionStorage.removeItem('discourse-comments-private-key');
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Failed to parse OAuth payload:', error);
        this.showError('Authentication failed. Please try again.');
      }
    }
  }

  private async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // Use SHA-1 for RSA-OAEP (Discourse default)
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-1',
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKeyData = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKeyPem = this.arrayBufferToPem(publicKeyData, 'PUBLIC KEY');
    const privateKeyPem = this.arrayBufferToPem(privateKeyData, 'PRIVATE KEY');

    return { publicKey: publicKeyPem, privateKey: privateKeyPem };
  }

  private async importPrivateKey(pem: string): Promise<CryptoKey> {
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');

    const binaryData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    // Use SHA-1 for RSA-OAEP (Discourse default)
    return await window.crypto.subtle.importKey(
      'pkcs8',
      binaryData,
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      true,
      ['decrypt']
    );
  }

  private arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
  }

  private async initiateLogin() {
    try {
      // Generate key pair
      const { publicKey, privateKey } = await this.generateKeyPair();

      // Store private key temporarily
      sessionStorage.setItem('discourse-comments-private-key', privateKey);

      const authUrl = new URL('/user-api-key/new', this.discourseUrl);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('payload');

      // Generate random nonce
      const nonce = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);

      const params = {
        application_name: this.clientId,
        client_id: this.clientId,
        scopes: 'read,write',
        nonce: nonce,
        public_key: publicKey,
        auth_redirect: currentUrl.toString(),  // Use auth_redirect, not redirect_uri
        padding: 'oaep',
      };

      Object.entries(params).forEach(([key, value]) => {
        authUrl.searchParams.set(key, value);
      });

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Failed to initiate login:', error);
      this.showError('Failed to initiate login. Please try again.');
    }
  }

  private logout() {
    this.clearApiKey();
    this.render();
  }

  private showManualKeyEntry() {
    const container = this.shadow.querySelector('.comments-container');
    if (!container) return;

    const manualEntry = document.createElement('div');
    manualEntry.className = 'comment-form';
    manualEntry.innerHTML = `
      <p>Paste your API key below:</p>
      <textarea id="manual-key" placeholder="Paste API key here" style="min-height: 60px;"></textarea>
      <div class="comment-form-actions">
        <button class="btn btn-primary" id="save-key-btn">Save Key</button>
        <button class="btn" id="cancel-key-btn">Cancel</button>
      </div>
    `;

    const header = container.querySelector('.comments-header');
    if (header && header.nextSibling) {
      container.insertBefore(manualEntry, header.nextSibling);
    }

    const saveBtn = this.shadow.getElementById('save-key-btn');
    const cancelBtn = this.shadow.getElementById('cancel-key-btn');
    const textarea = this.shadow.getElementById('manual-key') as HTMLTextAreaElement;

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (textarea && textarea.value.trim()) {
          this.saveApiKey(textarea.value.trim());
          this.render();
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        manualEntry.remove();
      });
    }
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .comments-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .comments-header {
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .comments-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .auth-section {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }

        .btn:hover {
          background: #f5f5f5;
        }

        .btn-primary {
          background: #0088cc;
          color: white;
          border-color: #0088cc;
        }

        .btn-primary:hover {
          background: #006699;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .comment {
          padding: 15px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .comment-author {
          font-weight: bold;
          color: #333;
        }

        .comment-date {
          font-size: 14px;
          color: #666;
          margin-left: 10px;
        }

        .comment-content {
          margin-top: 10px;
          line-height: 1.6;
        }

        .comment-form {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .comment-form textarea {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          box-sizing: border-box;
        }

        .comment-form-actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          padding: 15px;
          color: #c33;
        }

        .success {
          background: #efe;
          border: 1px solid #cfc;
          border-radius: 4px;
          padding: 15px;
          color: #3c3;
          margin-bottom: 15px;
        }
      </style>

      <div class="comments-container">
        <div class="comments-header">
          <h2 class="comments-title">Comments</h2>
        </div>
        <div class="loading">Loading comments...</div>
      </div>
    `;

    const loginBtn = this.shadow.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.initiateLogin());
    }

    const manualKeyBtn = this.shadow.getElementById('manual-key-btn');
    if (manualKeyBtn) {
      manualKeyBtn.addEventListener('click', () => this.showManualKeyEntry());
    }

    const logoutBtn = this.shadow.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    if (this.discourseUrl && this.topicId) {
      this.loadComments();
    }
  }

  private async loadComments() {
    // Prevent concurrent calls (fixes WASM closure recursion error)
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    try {
      await init();

      // Create appropriate client
      if (this.userApiKey) {
        console.log('Using authenticated client with key:', this.userApiKey.substring(0, 10) + '...');
        this.client = WasmDiscourseClient.withUserApiKey(this.discourseUrl, this.userApiKey);
      } else {
        console.log('Using anonymous client');
        this.client = new WasmDiscourseClient(this.discourseUrl);
      }

      console.log('Fetching topic', this.topicId);
      const topicData = await this.client.getTopic(BigInt(this.topicId));
      console.log('Topic fetched successfully:', topicData);

      const container = this.shadow.querySelector('.comments-container');
      if (!container) return;

      let commentsHtml = `
        <div class="comments-header">
          <h2 class="comments-title">${topicData.title}</h2>
          <div class="auth-section">
            ${this.userApiKey
              ? '<button class="btn" id="logout-btn">Logout</button>'
              : `<button class="btn btn-primary" id="login-btn">Login to Comment</button>
                 <button class="btn" id="manual-key-btn">Manual Key Entry</button>`
            }
          </div>
        </div>
      `;

      // Add comment form if logged in
      if (this.userApiKey) {
        commentsHtml += `
          <div class="comment-form">
            <textarea id="comment-text" placeholder="Write your comment..."></textarea>
            <div class="comment-form-actions">
              <button class="btn btn-primary" id="submit-comment">Post Comment</button>
            </div>
          </div>
        `;
      }

      if (topicData.post_stream && topicData.post_stream.posts) {
        for (const post of topicData.post_stream.posts) {
          const date = new Date(post.created_at);
          const relativeTime = this.formatRelativeTime(date);

          commentsHtml += `
            <div class="comment">
              <div>
                <span class="comment-author">${post.username}</span>
                <span class="comment-date">${relativeTime}</span>
              </div>
              <div class="comment-content">
                ${post.cooked}
              </div>
            </div>
          `;
        }
      }

      container.innerHTML = commentsHtml;

      // Reattach event listeners
      const loginBtn = this.shadow.getElementById('login-btn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.initiateLogin());
      }

      const manualKeyBtn = this.shadow.getElementById('manual-key-btn');
      if (manualKeyBtn) {
        manualKeyBtn.addEventListener('click', () => this.showManualKeyEntry());
      }

      const logoutBtn = this.shadow.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }

      const submitBtn = this.shadow.getElementById('submit-comment');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.submitComment());
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to load comments');
    } finally {
      this.isLoading = false;
    }
  }

  private async submitComment() {
    const textarea = this.shadow.getElementById('comment-text') as HTMLTextAreaElement;
    if (!textarea || !textarea.value.trim()) {
      return;
    }

    if (!this.client) {
      this.showError('Not authenticated');
      return;
    }

    const submitBtn = this.shadow.getElementById('submit-comment') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';
    }

    try {
      await this.client.createPost(BigInt(this.topicId), textarea.value, null);

      // Clear textarea and reload comments
      textarea.value = '';
      await this.loadComments();

      // Show success message
      const container = this.shadow.querySelector('.comments-container');
      if (container) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success';
        successMsg.textContent = 'Comment posted successfully!';
        container.insertBefore(successMsg, container.firstChild?.nextSibling || null);
        setTimeout(() => successMsg.remove(), 3000);
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Comment';
      }
    }
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  private showError(message: string) {
    const container = this.shadow.querySelector('.comments-container');
    if (container) {
      container.innerHTML = `
        <div class="error">
          <strong>Error:</strong> ${message}
        </div>
      `;
    }
  }
}

customElements.define('discourse-comments', DiscourseComments);

export { DiscourseComments };

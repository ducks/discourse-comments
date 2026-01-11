/**
 * Discourse Comments Web Component
 *
 * A WASM-powered embedded comment system for Discourse forums.
 *
 * Usage:
 *   <discourse-comments
 *     discourse-url="https://forum.example.com"
 *     topic-id="123">
 *   </discourse-comments>
 */

class DiscourseComments extends HTMLElement {
  private shadow: ShadowRoot;
  private discourseUrl: string = '';
  private topicId: string = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['discourse-url', 'topic-id'];
  }

  connectedCallback() {
    this.discourseUrl = this.getAttribute('discourse-url') || '';
    this.topicId = this.getAttribute('topic-id') || '';
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (name === 'discourse-url') {
        this.discourseUrl = newValue;
      } else if (name === 'topic-id') {
        this.topicId = newValue;
      }
      this.render();
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
        }

        .comments-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
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
      </style>

      <div class="comments-container">
        <div class="comments-header">
          <h2 class="comments-title">Comments</h2>
        </div>
        <div class="loading">Loading comments...</div>
      </div>
    `;

    if (this.discourseUrl && this.topicId) {
      this.loadComments();
    }
  }

  private async loadComments() {
    try {
      // TODO: Initialize WASM client and fetch comments
      // For now, just show placeholder
      const container = this.shadow.querySelector('.comments-container');
      if (container) {
        container.innerHTML = `
          <div class="comments-header">
            <h2 class="comments-title">Comments</h2>
          </div>
          <div class="comment">
            <div>
              <span class="comment-author">Example User</span>
              <span class="comment-date">2 hours ago</span>
            </div>
            <div class="comment-content">
              This is a placeholder comment. WASM integration coming soon!
            </div>
          </div>
        `;
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to load comments');
    }
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

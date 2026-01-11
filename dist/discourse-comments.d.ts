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
declare class DiscourseComments extends HTMLElement {
    private shadow;
    private discourseUrl;
    private topicId;
    private clientId;
    private userApiKey;
    private client;
    constructor();
    static get observedAttributes(): string[];
    connectedCallback(): Promise<void>;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    private loadApiKey;
    private saveApiKey;
    private clearApiKey;
    private handleOAuthCallback;
    private generateKeyPair;
    private importPrivateKey;
    private arrayBufferToPem;
    private initiateLogin;
    private logout;
    private showManualKeyEntry;
    private render;
    private loadComments;
    private submitComment;
    private formatRelativeTime;
    private showError;
}
export { DiscourseComments };

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock discourse-api-ts before importing the component
const mockGetTopic = vi.fn();
const mockCreatePost = vi.fn();
const mockLikePost = vi.fn();
const mockUnlikePost = vi.fn();

const mockClientInstance = {
  getTopic: mockGetTopic,
  createPost: mockCreatePost,
  likePost: mockLikePost,
  unlikePost: mockUnlikePost,
};

vi.mock('discourse-api-ts', () => {
  function MockDiscourseClient() {
    return mockClientInstance;
  }
  MockDiscourseClient.withUserApiKey = vi.fn(() => mockClientInstance);
  MockDiscourseClient.withApiKey = vi.fn(() => mockClientInstance);
  MockDiscourseClient.prototype = {};
  return { DiscourseClient: MockDiscourseClient };
});

// Import after mock setup
import { DiscourseClient } from 'discourse-api-ts';

const sampleTopicResponse = {
  title: 'Test Topic',
  post_stream: {
    posts: [
      {
        id: 1,
        username: 'alice',
        created_at: new Date().toISOString(),
        cooked: '<p>First post content</p>',
        post_number: 1,
        post_type: 1,
        reply_count: 0,
        quote_count: 0,
        reads: 5,
        score: 1,
        topic_id: 42,
        yours: true,
        like_count: 3,
        actions_summary: [{ id: 2, count: 3, acted: false, can_act: true }],
      },
      {
        id: 2,
        username: 'bob',
        created_at: new Date().toISOString(),
        cooked: '<p>Second post content</p>',
        post_number: 2,
        post_type: 1,
        reply_count: 0,
        quote_count: 0,
        reads: 3,
        score: 0,
        topic_id: 42,
        yours: false,
        like_count: 1,
        actions_summary: [{ id: 2, count: 1, acted: true, can_act: true }],
      },
    ],
  },
};

function createElement(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('discourse-comments');
  el.setAttribute('discourse-url', attrs['discourse-url'] || 'https://forum.example.com');
  el.setAttribute('topic-id', attrs['topic-id'] || '42');
  if (attrs['client-id']) el.setAttribute('client-id', attrs['client-id']);
  return el;
}

async function mountElement(attrs: Record<string, string> = {}): Promise<HTMLElement> {
  const el = createElement(attrs);
  document.body.appendChild(el);
  // Wait for connectedCallback + loadComments to finish
  // After loading, either .comment elements or .error element will be present
  await vi.waitFor(() => {
    const shadow = el.shadowRoot;
    if (!shadow) throw new Error('no shadow root');
    const hasComments = shadow.querySelectorAll('.comment').length > 0;
    const hasError = shadow.querySelector('.error') !== null;
    const hasHeader = shadow.querySelector('.comments-header .auth-section') !== null;
    if (!hasComments && !hasError && !hasHeader) throw new Error('still loading');
  }, { timeout: 2000 });
  return el;
}

describe('DiscourseComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetTopic.mockResolvedValue(sampleTopicResponse);
    mockCreatePost.mockResolvedValue({ id: 99, topic_id: 42 });
    mockLikePost.mockResolvedValue({});
    mockUnlikePost.mockResolvedValue({});
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers as a custom element', async () => {
    // Component is registered on import via customElements.define
    await import('./discourse-comments.js');
    expect(customElements.get('discourse-comments')).toBeDefined();
  });

  it('renders loading state on connect', async () => {
    // Make getTopic hang so we can observe loading state
    mockGetTopic.mockReturnValue(new Promise(() => {}));

    const el = createElement();
    document.body.appendChild(el);

    // Wait for the shadow root to have content
    await vi.waitFor(() => {
      if (!el.shadowRoot?.innerHTML) throw new Error('no content yet');
    });

    const loading = el.shadowRoot?.querySelector('.loading');
    expect(loading).not.toBeNull();
    expect(loading?.textContent).toContain('Loading comments');
  });

  it('renders posts from mocked API response', async () => {
    const el = await mountElement();
    const shadow = el.shadowRoot!;

    const comments = shadow.querySelectorAll('.comment');
    expect(comments.length).toBe(2);

    const firstAuthor = comments[0].querySelector('.comment-author');
    expect(firstAuthor?.textContent).toBe('alice');

    const secondAuthor = comments[1].querySelector('.comment-author');
    expect(secondAuthor?.textContent).toBe('bob');

    expect(comments[0].querySelector('.comment-content')?.innerHTML).toContain('First post content');
    expect(comments[1].querySelector('.comment-content')?.innerHTML).toContain('Second post content');
  });

  it('shows login button when no API key is stored', async () => {
    const el = await mountElement();
    const shadow = el.shadowRoot!;

    expect(shadow.getElementById('login-btn')).not.toBeNull();
    expect(shadow.getElementById('logout-btn')).toBeNull();
    expect(shadow.getElementById('comment-text')).toBeNull();
  });

  it('shows logout button and comment form when API key is in localStorage', async () => {
    localStorage.setItem(
      'discourse-comments-api-key-https://forum.example.com',
      'test-api-key'
    );

    const el = await mountElement();
    const shadow = el.shadowRoot!;

    expect(shadow.getElementById('logout-btn')).not.toBeNull();
    expect(shadow.getElementById('login-btn')).toBeNull();
    expect(shadow.getElementById('comment-text')).not.toBeNull();
  });

  it('calls createPost on submit with correct topic ID and text', async () => {
    localStorage.setItem(
      'discourse-comments-api-key-https://forum.example.com',
      'test-api-key'
    );

    const el = await mountElement();
    const shadow = el.shadowRoot!;

    const textarea = shadow.getElementById('comment-text') as HTMLTextAreaElement;
    textarea.value = 'My new comment';

    const submitBtn = shadow.getElementById('submit-comment') as HTMLButtonElement;
    submitBtn.click();

    await vi.waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(42, 'My new comment');
    });
  });

  it('calls likePost on like button click', async () => {
    localStorage.setItem(
      'discourse-comments-api-key-https://forum.example.com',
      'test-api-key'
    );

    const el = await mountElement();
    const shadow = el.shadowRoot!;

    // Bob's post (not yours, acted: true means already liked)
    // Find the unlike scenario: bob's post has acted: true
    const likeBtn = shadow.querySelector('.like-btn[data-post-id="2"]') as HTMLButtonElement;
    expect(likeBtn).not.toBeNull();

    // It's already liked (acted: true), so clicking should unlike
    likeBtn.click();

    await vi.waitFor(() => {
      expect(mockUnlikePost).toHaveBeenCalledWith(2);
    });
  });

  it('calls unlikePost when clicking an already-liked post', async () => {
    // Use a response where bob's post is not liked
    const unlkedResponse = JSON.parse(JSON.stringify(sampleTopicResponse));
    unlkedResponse.post_stream.posts[1].actions_summary[0].acted = false;
    mockGetTopic.mockResolvedValue(unlkedResponse);

    localStorage.setItem(
      'discourse-comments-api-key-https://forum.example.com',
      'test-api-key'
    );

    const el = await mountElement();
    const shadow = el.shadowRoot!;

    const likeBtn = shadow.querySelector('.like-btn[data-post-id="2"]') as HTMLButtonElement;
    likeBtn.click();

    await vi.waitFor(() => {
      expect(mockLikePost).toHaveBeenCalledWith(2);
    });
  });

  it('shows error message when API call fails', async () => {
    mockGetTopic.mockRejectedValue(new Error('Network error'));

    const el = await mountElement();
    const shadow = el.shadowRoot!;

    const error = shadow.querySelector('.error');
    expect(error).not.toBeNull();
    expect(error?.textContent).toContain('Network error');
  });

  it('creates anonymous client when no API key', async () => {
    const el = await mountElement();

    // Anonymous path: uses `new DiscourseClient(url)` not withUserApiKey
    expect(DiscourseClient.withUserApiKey).not.toHaveBeenCalled();
    expect(mockGetTopic).toHaveBeenCalled();
  });

  it('creates authenticated client when API key is present', async () => {
    localStorage.setItem(
      'discourse-comments-api-key-https://forum.example.com',
      'test-api-key'
    );

    const el = await mountElement();

    expect(DiscourseClient.withUserApiKey).toHaveBeenCalledWith(
      'https://forum.example.com',
      'test-api-key'
    );
  });
});

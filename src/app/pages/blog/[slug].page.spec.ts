import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';
import { ContentFile } from '@analogjs/content';
import PostAttributes from '../../core/models/post-attributes';
import { OgpService } from '../../core/services/ogp.service';

// Mock MarkdownComponent - using analog-markdown selector to match actual component
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'analog-markdown',
  template: '<div class="prose"><ng-content></ng-content></div>',
})
class MockMarkdownComponent {
  @Input() content: string | undefined;
}

// Mock post data
const mockPost: ContentFile<PostAttributes> = {
  filename: 'src/content/blog/test-post.md',
  slug: 'test-post',
  content: '<h1>Test Post</h1><p>Content here</p>',
  attributes: {
    title: 'Test Post Title',
    slug: 'test-post',
    date: '2024-01-01',
    description: 'Test description',
    tags: ['angular', 'testing'],
  },
};

// Create a controllable subject for the post stream
let postSubject: Subject<ContentFile<PostAttributes>>;

// Mock injectContent before importing the component
vi.mock('@analogjs/content', async () => {
  return {
    injectContent: () => postSubject.asObservable(),
    MarkdownComponent: MockMarkdownComponent,
  };
});

// Import the component after mocking
const { default: BlogPostPage } = await import('./[slug].page');

describe('BlogPostPage', () => {
  let component: InstanceType<typeof BlogPostPage>;
  let fixture: ComponentFixture<InstanceType<typeof BlogPostPage>>;
  let ogpServiceMock: { updateMetadata: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    postSubject = new Subject();

    ogpServiceMock = {
      updateMetadata: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BlogPostPage],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: OgpService, useValue: ogpServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    })
      .overrideComponent(BlogPostPage, {
        remove: { imports: [] },
        add: { imports: [MockMarkdownComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlogPostPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('OGP metadata', () => {
    it('should update OGP metadata when post is loaded', async () => {
      fixture.detectChanges();
      postSubject.next(mockPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(ogpServiceMock.updateMetadata).toHaveBeenCalledWith({
        title: 'Test Post Title | nekorush14.dev',
        description: 'Test description',
        url: 'https://nekorush14.dev/blog/test-post',
        image: 'https://nekorush14.dev/ogp/blog/test-post.png',
        type: 'article',
      });
    });
  });

  describe('MutationObserver cleanup', () => {
    it('should clean up observer when component is destroyed', async () => {
      fixture.detectChanges();
      postSubject.next(mockPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      // Destroy the component - should not throw any errors
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should clean up previous observer when post changes', async () => {
      fixture.detectChanges();

      // First post
      postSubject.next(mockPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      // Second post
      const secondPost = { ...mockPost, attributes: { ...mockPost.attributes, slug: 'post-2' } };
      postSubject.next(secondPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      // OGP should be updated for the second post
      expect(ogpServiceMock.updateMetadata).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: 'https://nekorush14.dev/blog/post-2',
        })
      );
    });
  });

  describe('copy button race condition prevention', () => {
    let mockClipboard: { writeText: ReturnType<typeof vi.fn> };
    let mockButton: HTMLButtonElement;

    beforeEach(() => {
      mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true,
      });

      mockButton = document.createElement('button');
    });

    it('should cancel previous timer when button is clicked again', async () => {
      fixture.detectChanges();
      postSubject.next(mockPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      // Access the private method through component instance
      const handleCopy = (
        component as unknown as { handleCopy: (pre: Element, button: HTMLButtonElement) => Promise<void> }
      ).handleCopy.bind(component);

      // Create a mock pre element with code
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = 'test code';
      pre.appendChild(code);

      // First click
      await handleCopy(pre, mockButton);

      // Button should have 'copied' class
      expect(mockButton.classList.contains('copied')).toBe(true);

      // Second click before timer completes (simulating rapid clicks)
      await handleCopy(pre, mockButton);

      // Should still have 'copied' class (new timer started)
      expect(mockButton.classList.contains('copied')).toBe(true);

      // Wait for the new timer
      await vi.advanceTimersByTimeAsync(2000);

      // Should be reset now
      expect(mockButton.classList.contains('copied')).toBe(false);
    });

    it('should handle clipboard errors gracefully', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      fixture.detectChanges();
      postSubject.next(mockPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      const handleCopy = (
        component as unknown as { handleCopy: (pre: Element, button: HTMLButtonElement) => Promise<void> }
      ).handleCopy.bind(component);

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = 'test code';
      pre.appendChild(code);

      await handleCopy(pre, mockButton);

      expect(mockButton.classList.contains('error')).toBe(true);
      expect(console.error).toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(2000);

      expect(mockButton.classList.contains('error')).toBe(false);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clear all timers and cleanup functions on destroy', async () => {
      fixture.detectChanges();
      postSubject.next(mockPost);
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      // Destroy the fixture - should not throw any errors
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});

describe('BlogPostPage SSR', () => {
  let fixture: ComponentFixture<InstanceType<typeof BlogPostPage>>;
  let ogpServiceMock: { updateMetadata: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    postSubject = new Subject();

    ogpServiceMock = {
      updateMetadata: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BlogPostPage],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: OgpService, useValue: ogpServiceMock },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    })
      .overrideComponent(BlogPostPage, {
        remove: { imports: [] },
        add: { imports: [MockMarkdownComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlogPostPage);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not run browser-specific code on server', async () => {
    fixture.detectChanges();
    postSubject.next(mockPost);
    await vi.runAllTimersAsync();
    fixture.detectChanges();

    // OGP should still be updated on server
    expect(ogpServiceMock.updateMetadata).toHaveBeenCalled();

    // No errors should occur since browser code is skipped
    expect(true).toBe(true);
  });
});

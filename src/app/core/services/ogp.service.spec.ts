import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { OgpService, OgpMetadata } from './ogp.service';

interface MockMeta {
  getTag: ReturnType<typeof vi.fn>;
  addTag: ReturnType<typeof vi.fn>;
  updateTag: ReturnType<typeof vi.fn>;
}

interface MockTitle {
  setTitle: ReturnType<typeof vi.fn>;
}

describe('OgpService', () => {
  let service: OgpService;
  let metaMock: MockMeta;
  let titleMock: MockTitle;

  beforeEach(() => {
    metaMock = {
      getTag: vi.fn(),
      addTag: vi.fn(),
      updateTag: vi.fn(),
    };

    titleMock = {
      setTitle: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OgpService,
        { provide: Meta, useValue: metaMock },
        { provide: Title, useValue: titleMock },
      ],
    });

    service = TestBed.inject(OgpService);
  });

  describe('updateMetadata', () => {
    it('should set page title', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test Title',
        url: 'https://nekorush14.dev/test',
      };

      service.updateMetadata(metadata);

      expect(titleMock.setTitle).toHaveBeenCalledWith('Test Title');
    });

    it('should add meta tags when they do not exist', () => {
      metaMock.getTag.mockReturnValue(null);

      const metadata: Partial<OgpMetadata> = {
        title: 'Test Title',
        description: 'Test Description',
        url: 'https://nekorush14.dev/test',
        image: 'https://nekorush14.dev/og-image.png',
        type: 'article',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:title',
        content: 'Test Title',
      });
      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:description',
        content: 'Test Description',
      });
      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:url',
        content: 'https://nekorush14.dev/test',
      });
    });

    it('should update meta tags when they already exist', () => {
      metaMock.getTag.mockReturnValue({} as HTMLMetaElement);

      const metadata: Partial<OgpMetadata> = {
        title: 'Updated Title',
        url: 'https://nekorush14.dev/updated',
      };

      service.updateMetadata(metadata);

      expect(metaMock.updateTag).toHaveBeenCalledWith({
        property: 'og:title',
        content: 'Updated Title',
      });
    });

    it('should use default values when not provided', () => {
      metaMock.getTag.mockReturnValue(null);

      const metadata: Partial<OgpMetadata> = {
        title: 'Test Title',
        url: 'https://nekorush14.dev/test',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:site_name',
        content: 'nekorush14.dev',
      });
      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:type',
        content: 'website',
      });
    });
  });

  describe('XSS prevention', () => {
    it('should sanitize HTML special characters in title', () => {
      const metadata: Partial<OgpMetadata> = {
        title: '<script>alert("xss")</script>',
        url: 'https://nekorush14.dev/test',
      };

      service.updateMetadata(metadata);

      expect(titleMock.setTitle).toHaveBeenCalledWith(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should sanitize HTML special characters in description', () => {
      metaMock.getTag.mockReturnValue(null);

      const metadata: Partial<OgpMetadata> = {
        title: 'Safe Title',
        description: 'Test <img src=x onerror=alert(1)>',
        url: 'https://nekorush14.dev/test',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:description',
        content: 'Test &lt;img src=x onerror=alert(1)&gt;',
      });
    });

    it('should escape ampersand, quotes, and apostrophes', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test & "quotes" and \'apostrophes\'',
        url: 'https://nekorush14.dev/test',
      };

      service.updateMetadata(metadata);

      expect(titleMock.setTitle).toHaveBeenCalledWith(
        'Test &amp; &quot;quotes&quot; and &#x27;apostrophes&#x27;'
      );
    });
  });

  describe('URL validation (SSRF prevention)', () => {
    beforeEach(() => {
      metaMock.getTag.mockReturnValue(null);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should accept valid HTTPS URLs from allowed domain', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'https://nekorush14.dev/blog/post',
        image: 'https://nekorush14.dev/images/og.png',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:url',
        content: 'https://nekorush14.dev/blog/post',
      });
      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:image',
        content: 'https://nekorush14.dev/images/og.png',
      });
    });

    it('should block URLs with javascript: protocol', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'javascript:alert(1)',
      };

      service.updateMetadata(metadata);

      // og:url should not be set with the malicious URL
      expect(metaMock.addTag).not.toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:url' })
      );
      expect(console.warn).toHaveBeenCalled();
    });

    it('should block URLs from disallowed domains', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'https://evil.com/malicious',
        image: 'https://attacker.com/payload.png',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).not.toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:url' })
      );
      expect(metaMock.addTag).not.toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:image' })
      );
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('should block URLs to private/internal networks', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'http://localhost:3000/admin',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).not.toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:url' })
      );
    });

    it('should block URLs with file: protocol', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'file:///etc/passwd',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).not.toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:url' })
      );
    });

    it('should handle invalid URL format gracefully', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'not-a-valid-url',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).not.toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:url' })
      );
      expect(console.warn).toHaveBeenCalled();
    });

    it('should allow subdomain of allowed domain', () => {
      const metadata: Partial<OgpMetadata> = {
        title: 'Test',
        url: 'https://blog.nekorush14.dev/post',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).toHaveBeenCalledWith({
        property: 'og:url',
        content: 'https://blog.nekorush14.dev/post',
      });
    });
  });

  describe('Twitter Card meta tags', () => {
    it('should set Twitter Card meta tags with name attribute', () => {
      metaMock.getTag.mockReturnValue(null);

      const metadata: Partial<OgpMetadata> = {
        title: 'Test Title',
        description: 'Test Description',
        url: 'https://nekorush14.dev/test',
        image: 'https://nekorush14.dev/og.png',
      };

      service.updateMetadata(metadata);

      expect(metaMock.addTag).toHaveBeenCalledWith({
        name: 'twitter:card',
        content: 'summary_large_image',
      });
      expect(metaMock.addTag).toHaveBeenCalledWith({
        name: 'twitter:title',
        content: 'Test Title',
      });
      expect(metaMock.addTag).toHaveBeenCalledWith({
        name: 'twitter:description',
        content: 'Test Description',
      });
    });
  });
});

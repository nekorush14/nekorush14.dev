import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ContentFile } from '@analogjs/content';
import PostAttributes from 'src/app/core/models/post-attributes';
import TagsIndexPage from './index.page';

// Mock data for blog posts
const mockPosts: ContentFile<PostAttributes>[] = [
  {
    filename: 'src/content/blog/post-1.md',
    slug: 'post-1',
    attributes: {
      title: 'Post 1',
      slug: 'post-1',
      date: '2024-01-01',
      description: 'Description 1',
      tags: ['angular', 'typescript'],
    },
  },
  {
    filename: 'src/content/blog/post-2.md',
    slug: 'post-2',
    attributes: {
      title: 'Post 2',
      slug: 'post-2',
      date: '2024-01-02',
      description: 'Description 2',
      tags: ['angular', 'signals'],
    },
  },
  {
    filename: 'src/content/blog/post-3.md',
    slug: 'post-3',
    attributes: {
      title: 'Post 3',
      slug: 'post-3',
      date: '2024-01-03',
      description: 'Description 3',
      tags: ['typescript', 'testing'],
    },
  },
];

// Mock injectContentFiles
vi.mock('@analogjs/content', async () => {
  const actual = await vi.importActual('@analogjs/content');
  return {
    ...actual,
    injectContentFiles: () => mockPosts,
  };
});

describe('TagsIndexPage', () => {
  let component: TagsIndexPage;
  let fixture: ComponentFixture<TagsIndexPage>;
  let queryParamSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    queryParamSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [TagsIndexPage],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagsIndexPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('allTags', () => {
    it('should extract all unique tags with their counts', () => {
      const tags = component.allTags();

      expect(tags).toContainEqual({ name: 'angular', count: 2 });
      expect(tags).toContainEqual({ name: 'typescript', count: 2 });
      expect(tags).toContainEqual({ name: 'signals', count: 1 });
      expect(tags).toContainEqual({ name: 'testing', count: 1 });
    });

    it('should sort tags by count descending, then alphabetically', () => {
      const tags = component.allTags();

      // angular and typescript both have count 2, so sorted alphabetically
      expect(tags[0].name).toBe('angular');
      expect(tags[1].name).toBe('typescript');
      // signals and testing have count 1
      expect(tags.slice(2).map((t) => t.name)).toEqual(['signals', 'testing']);
    });
  });

  describe('totalTags', () => {
    it('should return the total number of unique tags', () => {
      expect(component.totalTags()).toBe(4);
    });
  });

  describe('selectedTags', () => {
    it('should return empty array when no tag is selected', () => {
      expect(component.selectedTags()).toEqual([]);
    });

    it('should parse single tag from query parameter', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedTags()).toEqual(['angular']);
    });

    it('should parse multiple comma-separated tags from query parameter', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular,typescript' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedTags()).toEqual(['angular', 'typescript']);
    });

    it('should trim whitespace from tags', async () => {
      queryParamSubject.next(convertToParamMap({ t: ' angular , typescript ' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedTags()).toEqual(['angular', 'typescript']);
    });

    it('should filter out empty strings', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular,,typescript,' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedTags()).toEqual(['angular', 'typescript']);
    });
  });

  describe('filteredPosts', () => {
    it('should return empty array when no tag is selected', () => {
      expect(component.filteredPosts()).toEqual([]);
    });

    it('should filter posts by single selected tag', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'signals' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const filtered = component.filteredPosts();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].attributes.slug).toBe('post-2');
    });

    it('should filter posts with AND condition for multiple tags', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular,typescript' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const filtered = component.filteredPosts();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].attributes.slug).toBe('post-1');
    });

    it('should return empty when no posts match all selected tags', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular,testing' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.filteredPosts()).toHaveLength(0);
    });
  });

  describe('isTagSelected', () => {
    it('should return false when tag is not selected', () => {
      expect(component.isTagSelected('angular')).toBe(false);
    });

    it('should return true when tag is selected', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isTagSelected('angular')).toBe(true);
    });
  });

  describe('getTagToggleParams', () => {
    it('should return tag param when adding a tag', () => {
      const params = component.getTagToggleParams('angular');
      expect(params).toEqual({ t: 'angular' });
    });

    it('should append new tag to existing selection', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const params = component.getTagToggleParams('typescript');
      expect(params).toEqual({ t: 'angular,typescript' });
    });

    it('should remove tag when it is already selected', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular,typescript' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const params = component.getTagToggleParams('angular');
      expect(params).toEqual({ t: 'typescript' });
    });

    it('should return null when removing the last selected tag', async () => {
      queryParamSubject.next(convertToParamMap({ t: 'angular' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const params = component.getTagToggleParams('angular');
      expect(params).toBeNull();
    });
  });
});

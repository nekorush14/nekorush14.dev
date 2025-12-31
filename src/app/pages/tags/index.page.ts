import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { injectContentFiles, ContentFile } from '@analogjs/content';
import { map } from 'rxjs';
import PostAttributes from 'src/app/core/models/post-attributes';

interface TagInfo {
  name: string;
  count: number;
}

@Component({
  selector: 'app-tags-index',
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TagsIndexPage {
  private readonly route = inject(ActivatedRoute);

  // All blog posts
  private readonly allPosts = injectContentFiles<PostAttributes>((contentFile) =>
    contentFile.filename.includes('src/content/blog/')
  );

  // Get selected tags from query parameter (?t=tag1,tag2)
  private readonly selectedTagsParam = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const tagParam = params.get('t');
        if (!tagParam) return [];
        return tagParam.split(',').map((s) => s.trim()).filter((t) => t.length > 0);
      })
    ),
    { initialValue: [] as string[] }
  );

  // Selected tags for display
  readonly selectedTags = computed(() => this.selectedTagsParam());

  // Extract all unique tags with their counts
  readonly allTags = computed(() => {
    const tagCounts = new Map<string, number>();

    for (const post of this.allPosts) {
      const postTags = post.attributes.tags ?? [];
      for (const tag of postTags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    const tagsArray: TagInfo[] = Array.from(tagCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    return tagsArray.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });
  });

  // Filtered posts by selected tags (AND condition)
  readonly filteredPosts = computed(() => {
    const tags = this.selectedTags();
    if (tags.length === 0) return [];

    return this.allPosts.filter((post: ContentFile<PostAttributes>) =>
      tags.every((tag) => post.attributes.tags?.includes(tag))
    );
  });

  // Total number of unique tags
  readonly totalTags = computed(() => this.allTags().length);

  // Check if a tag is currently selected
  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  // Generate query params for toggling a tag (comma-separated format)
  getTagToggleParams(tag: string): { t: string } | null {
    const currentTags = this.selectedTags();
    let newTags: string[];

    if (currentTags.includes(tag)) {
      newTags = currentTags.filter((t) => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }

    if (newTags.length === 0) {
      return null;
    }

    return { t: newTags.join(',') };
  }
}

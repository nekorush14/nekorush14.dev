import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { contentFilesResource } from '@analogjs/content/resources';
import PostAttributes from 'src/app/core/models/post-attributes';

@Component({
  selector: 'app-blog-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, DatePipe],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
})
export default class BlogIndexPage {
  // Signal-based reactive content resource
  private readonly postsResource = contentFilesResource<PostAttributes>(
    (contentFile) => contentFile.filename.includes('src/content/blog/')
  );

  // Computed signal for sorted posts
  readonly posts = computed(() => {
    const files = this.postsResource.value() ?? [];
    return [...files].sort(
      (a, b) =>
        new Date(b.attributes.date).getTime() -
        new Date(a.attributes.date).getTime()
    );
  });

  readonly isLoading = this.postsResource.isLoading;
}

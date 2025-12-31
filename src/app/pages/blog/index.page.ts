import { Component } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectContentFiles } from '@analogjs/content';
import PostAttributes from 'src/app/core/models/post-attributes';

@Component({
  selector: 'app-blog-index',
  imports: [RouterLink, NgOptimizedImage, DatePipe],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
})
export default class BlogIndexPage {
  readonly posts = injectContentFiles<PostAttributes>((contentFile) =>
    contentFile.filename.includes('src/content/blog/')
  );
}

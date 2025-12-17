/**
 * Defines the structure of post attributes for blog posts.
 *
 * @field (string) title - The title of the blog post.
 * @field (string) slug - The unique slug identifier for the blog post.
 * @field (string) date - The publication date of the blog post.
 * @field (string) description - A brief description or summary of the blog post.
 * @field (string) coverImage - (Optional) URL to the cover image for the blog post.
 * @field (array[string]) tags - (Optional) An array of tags associated with the blog post.
 */
export default interface PostAttributes {
  title: string;
  slug: string;
  date: string;
  description: string;
  coverImage?: string;
  tags?: string[];
}

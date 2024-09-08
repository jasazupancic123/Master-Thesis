import slugify from 'slugify';

export class StringUtil {
  slug(input: string): string {
    return slugify(input, {
      lower: true,
      remove: /[*+~.()'"!:@\/]/g,
      replacement: '-',
    });
  }
}
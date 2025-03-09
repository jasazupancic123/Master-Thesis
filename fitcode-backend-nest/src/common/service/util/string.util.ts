import slugify from 'slugify';

export class StringUtil {
  slug(input: string): string {
    return slugify(input, {
      lower: true,
      remove: /[*+~.()'"!:@\/]/g,
      replacement: '-',
    });
  }

  capitalize(input: string): string {
    if (!input) return input;
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
}

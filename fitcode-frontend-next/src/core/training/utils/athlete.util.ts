export class AthleteUtil {
  getShortName(name: string): string {
    const shortName =
      name.split(' ').length > 1
        ? name.split(' ')[0] +
          ' ' +
          name
            ?.split(' ')
            .slice(1)
            .map((name) => name.toUpperCase())
            .join(' ')
        : name.toUpperCase();

    return shortName;
  }
}

import { ObjectUtil } from '../util';

describe('ObjectUtil::Unit', () => {
  const objectUtil = new ObjectUtil();

  describe('Clean object of undefined (and null) values', () => {
    it('should remove undefined values from an object', () => {
      const obj = {
        a: 1,
        b: undefined,
        c: undefined,
        d: {
          e: 2,
          f: undefined,
          g: undefined,
          h: {
            i: 3,
            j: undefined,
            k: undefined,
            l: null, // should keep because optional removeNull argument is false
          },
        },
      };

      const result = objectUtil.clean(obj);
      expect(result).toEqual({
        a: 1,
        d: {
          e: 2,
          h: {
            i: 3,
            l: null,
          },
        },
      });
    });

    it('should remove undefined and null values from an object', () => {
      const obj = {
        a: 1,
        b: undefined,
        c: null,
        d: {
          e: 2,
          f: undefined,
          g: null,
          h: {
            i: 3,
            j: undefined,
            k: null,
            l: null,
          },
        },
      };

      const result = objectUtil.clean(obj, true);
      expect(result).toEqual({
        a: 1,
        d: {
          e: 2,
          h: {
            i: 3,
          },
        },
      });
    });
  });

  describe('Valid option', () => {
    it('should return true if the value object corresponds to the options', () => {
      const attribute = {
        name: 'Color',
        field: 'color',
        type: 'select' as 'select',
        values: [
          {
            name: 'Red',
            field: 'red',
            values: [
              { field: 'dark', name: 'Dark' },
              { field: 'light', name: 'Light' },
            ],
          },
          {
            name: 'Blue',
            field: 'blue',
            values: [
              { field: 'ocean', name: 'Ocean' },
              { field: 'navy', name: 'Navy' },
            ],
          },
          {
            name: 'Nested',
            field: 'nested',
            values: [
              {
                name: 'A',
                field: 'nestedA',
                values: [
                  { field: 'a1', name: 'A1' },
                  { field: 'a2', name: 'A2' },
                ],
              },
              {
                name: 'B',
                field: 'nestedB',
                values: [
                  { field: 'b1', name: 'B1' },
                  { field: 'b2', name: 'B2' },
                ],
              },
            ],
          },
        ],
      };

      expect(
        objectUtil.isValidValue(attribute, { color: { red: 'dark' } }),
      ).toBe(true);
      expect(
        objectUtil.isValidValue(attribute, { color: { red: 'light' } }),
      ).toBe(true);
      expect(
        objectUtil.isValidValue(attribute, { color: { blue: 'ocean' } }),
      ).toBe(true);
      expect(
        objectUtil.isValidValue(attribute, { color: { blue: 'navy' } }),
      ).toBe(true);
      expect(
        objectUtil.isValidValue(attribute, { color: { red: 'ocean' } }),
      ).toBe(false);
      expect(
        objectUtil.isValidValue(attribute, { color: { blue: 'dark' } }),
      ).toBe(false);

      // deep nested select
      expect(
        objectUtil.isValidValue(attribute, {
          color: { nested: { nestedA: 'a1' } },
        }),
      ).toBe(true);
      expect(
        objectUtil.isValidValue(attribute, {
          color: { nested: { nestedB: 'b2' } },
        }),
      ).toBe(true);
      expect(
        objectUtil.isValidValue(attribute, {
          color: { nested: 'a1' },
        }),
      ).toBe(false);
      expect(
        objectUtil.isValidValue(attribute, {
          color: { nested: { someGibberish: 'lol' } },
        }),
      ).toBe(false);
    });
  });
});

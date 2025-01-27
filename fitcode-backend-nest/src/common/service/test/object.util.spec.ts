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
          { name: 'Red', field: 'red', values: ['dark', 'light'] },
          { name: 'Blue', field: 'blue', values: ['ocean', 'navy'] },
        ],
      };

      expect(objectUtil.isValidValue(attribute, { color: { red: 'dark' } })).toBe(true);
      expect(objectUtil.isValidValue(attribute, { color: { red: 'light' } })).toBe(true);
      expect(objectUtil.isValidValue(attribute, { color: { blue: 'ocean' } })).toBe(true);
      expect(objectUtil.isValidValue(attribute, { color: { blue: 'navy' } })).toBe(true);
      expect(objectUtil.isValidValue(attribute, { color: { red: 'ocean' } })).toBe(false);
      expect(objectUtil.isValidValue(attribute, { color: { blue: 'dark' } })).toBe(false);
    });
  });
});
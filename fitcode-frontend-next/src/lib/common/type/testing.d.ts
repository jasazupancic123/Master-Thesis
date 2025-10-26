// src/types/testing.d.ts
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Matchers<R>
      extends jest.DomTestingLibraryMatchers<R, HTMLElement> {}
  }
}

// src/types/testing.d.ts
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R>
      extends jest.DomTestingLibraryMatchers<R, HTMLElement> {}
  }
}

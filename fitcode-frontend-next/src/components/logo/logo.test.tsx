// logo.test.tsx
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

import { render, screen } from '@testing-library/react';
import Logo from './logo';

describe('Logo component', () => {
  it('renders the wide logo by default', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: /logo/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('fitcode_logo_transparent_wide.png')
    );
  });

  it('renders the narrow logo when version="narrow"', () => {
    render(<Logo version="narrow" />);
    const img = screen.getByRole('img', { name: /logo/i });
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('fitcode_logo_transparent.png')
    );
  });

  it('applies custom width and height', () => {
    render(<Logo width={200} height={100} />);
    const img = screen.getByRole('img', { name: /logo/i });
    expect(img).toHaveAttribute('width', '200');
    expect(img).toHaveAttribute('height', '100');
  });

  it('applies marginLeft and custom styles', () => {
    render(<Logo marginLeft={20} sx={{ borderRadius: '8px' }} />);
    const img = screen.getByRole('img', { name: /logo/i });
    expect(img).toHaveStyle({ marginLeft: '20px', borderRadius: '8px' });
  });
});

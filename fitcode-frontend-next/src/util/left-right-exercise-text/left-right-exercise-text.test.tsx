import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React from 'react';

import LeftRightExerciseText from './left-right-exercise-text';

describe('LeftRightExerciseText', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme({
      palette: {
        background: {
          dark: '#123456', // mock color for test
        },
      },
    });

    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  it('renders the title text', () => {
    renderWithTheme(<LeftRightExerciseText title="Left Arm" />);
    expect(screen.getByText('Left Arm')).toBeInTheDocument();
  });

  it('applies the correct variant and styles', () => {
    renderWithTheme(<LeftRightExerciseText title="Right Arm" />);
    const text = screen.getByText('Right Arm');

    expect(text).toHaveClass('MuiTypography-h6'); // MUI applies this class for variant="h6"

    expect(text).toHaveStyle({
      padding: '0px',
      margin: '0px',
      fontSize: '12px',
      color: '#123456', // our mock theme color
      zIndex: 1,
    });
  });
});

export const exerciseCardSetAttributeSx = {
  '& .MuiSelect-icon': { display: 'none' },
  '& .MuiInputBase-root': {
    borderBottom: 'none',
    '&:before': { borderBottom: 'none' },
    '&:after': { borderBottom: 'none' },
    '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
    backgroundColor: 'transparent',
  },
  '& .MuiSelect-select': {
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 27,
    fontSize: '0.7rem',
    color: 'white',
    backgroundColor: 'transparent',
  },
};

export const disableBorder = {
  backgroundColor: 'transparent',
  border: '0 !important',
  outline: 'none !important',
  '&:before': { borderBottom: '0 !important' },
  '&:after': { borderBottom: '0 !important' },
  '&:hover:not(.Mui-disabled):before': { borderBottom: '0 !important' },
};

export const exerciseCardSetAttributeSx = {
  '& .MuiSelect-icon': { display: 'none' },
  '& .MuiInputBase-root': {
    borderBottom: 'none',
    '&:before': { borderBottom: 'none' },
    '&:after': { borderBottom: 'none' },
    '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
  },
  '& .MuiSelect-select': {
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    fontSize: '0.7rem',
    color: 'white',
    backgroundColor: 'transparent',
  },
};

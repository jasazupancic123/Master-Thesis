import { FormItem } from '@/lib/common/type/form-item.type';
import { Box, Grid, TextField, Typography } from '@mui/material';

interface Props {
  formItems: FormItem[];
}

export default function FormItemsContainer(props: Props) {
  const { formItems } = props;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      sx={{
        minWidth: 400,
      }}
      gap={1}
    >
      {formItems.map((item, i) => (
        <Grid
          key={item.label}
          container
          spacing={1}
          direction="row"
          alignItems="center"
        >
          <Grid size={4}>
            <Typography fontSize={14}>{item.label}</Typography>
          </Grid>
          <Grid size={8}>
            {item.customElement ? (
              <>{item.customElement()}</>
            ) : (
              <TextField
                size="small"
                type={item.type || 'text'}
                value={item.value}
                onChange={(e) => {
                  item.onChange(e as React.ChangeEvent<HTMLInputElement>);
                }}
                required={!item.optional}
                fullWidth
                disabled={item.disabled}
                sx={{
                  borderRadius: 10,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: 10,
                  },
                }}
              />
            )}
          </Grid>
        </Grid>
      ))}
    </Box>
  );
}

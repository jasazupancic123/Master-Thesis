import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { SITE_URL } from '@/core/const/web.const';

export default function Copyright() {
  return (
    <Typography variant="body2" mt={1}>
      {'Copyright © '}
      <Link href={SITE_URL}>Blindoff&nbsp;</Link>
      {new Date().getFullYear()}
    </Typography>
  );
}

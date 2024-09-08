import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { SITE_URL } from '@/common/constant/browser.constant';

export default function Copyright() {
  return (
    <Typography variant="body2" mt={1}>
      {'Copyright © '}
      <Link href={SITE_URL}>FitCode&nbsp;</Link>
      {new Date().getFullYear()}
    </Typography>
  );
}
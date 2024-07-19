import {SITE_URL} from "@/constant/website";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

export default function Copyright() {
    return (
        <Typography variant="body2" mt={1}>
            {'Copyright © '}
            <Link href={SITE_URL}>FitCode&nbsp;</Link>
            {new Date().getFullYear()}
        </Typography>
    );
}
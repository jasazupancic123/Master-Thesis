import { Group } from '@/group/type/group.type';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Badge, Card, CardContent } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

interface Props {
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  onClick: (group: Group) => void;
}

export default function GroupGrid(props: Props) {
  const { onClick, groups } = props;

  return (
    <Grid container spacing={2} >
      {groups.map(group => (
        <Grid xs={12} sm={6} key={group.id}>
          <Card onClick={() => onClick(group)} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Badge badgeContent={group.memberIds.length} color="primary" variant='standard'>
                <PersonIcon />
              </Badge>

              <Typography sx={{ fontSize: 14, mt: 1 }} color="text.secondary">
                {group.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
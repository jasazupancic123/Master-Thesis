import { Props } from '@/app/groups/[id]/props.type';
import Typography from '@mui/material/Typography';
import GroupMembersStack from '@/component/group-members-stack';

export default function AthletePage(props: Props) {
  const { group } = props

  return <>
    <Typography variant='h3' mb={5}>
      {group.name}
    </Typography>

    <GroupMembersStack
      group={group}
      onClick={(member) => {
        console.log('member:', member)
      }}
    />
  </>
}
import { theme } from '@/app/style';
import { DASHBOARD_VIEWS } from '@/lib/common/const/nav.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { alpha, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function DashboardSidebarMenuItems() {
  const router = useRouter();
  const { role } = useAuthenticatedAuth();

  const { filter, setFilter } = useDashboard();

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={1}
      mt={2}
      sx={{
        cursor: 'pointer',
      }}
    >
      {DASHBOARD_VIEWS(role!).map((val) => {
        if (!val) return null;

        const isSelected = val.id === filter?.id;

        return (
          <Box
            key={val.id}
            width="100%"
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            onClick={() => {
              setFilter(val);
              router.push(val.href);
            }}
            gap={1}
            sx={{
              p: 0.75,
              borderRadius: 2,
              backgroundColor: isSelected
                ? theme.palette.background.selectedBackground
                : 'transparent',
              '&:hover': {
                backgroundColor: alpha(
                  theme.palette.background.selectedBackground,
                  0.5
                ),
              },
            }}
          >
            {val.icon}
            <Typography fontSize={14} fontWeight={600}>
              {val.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

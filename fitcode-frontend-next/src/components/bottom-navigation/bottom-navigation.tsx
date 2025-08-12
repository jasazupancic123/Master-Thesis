import { LogoutRounded } from '@mui/icons-material';
import {
  BottomNavigation as BN,
  BottomNavigationAction as BNAction,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { useAthlete } from '@/store/athlete-provider';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';

export default function BottomNavigation() {
  const { filter, setFilter } = useAthlete();

  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <BN
      value={filter}
      onChange={(_, valueIndex) => {
        const newValue = Object.values(LINKS_SIDEBAR[UserRole.ATHLETE])[
          valueIndex
        ];
        if (!newValue) return;

        setFilter(newValue);
        router.push(newValue.href);
      }}
      showLabels
      sx={{
        backgroundColor: theme.palette.background.light,
        height: screenSize.isLandscapeMobile ? '45px' : '50px',
        width: '100%',
        '& .Mui-selected': {
          color: `${theme.palette.primary.main} !important`,
        },
      }}
    >
      {Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map((link, i) => (
        <BNAction
          key={i}
          icon={
            React.isValidElement(link.icon)
              ? React.cloneElement(
                  link.icon as React.ReactElement<{ sx?: object }>
                )
              : link.icon
          }
          label={link.label}
          sx={{
            color:
              filter.href === link.href ? theme.palette.primary.main : '#fff',
            minWidth: '48px', // Reduce the minimum width
            padding: '4px', // Reduce padding
            '& .MuiBottomNavigationAction-root': {
              minWidth: '48px', // Override MUI default min-width
            },
            '& .MuiSvgIcon-root': {
              fontSize: '24px !important',
            },
          }}
        />
      ))}
      <BNAction
        key="logout"
        icon={
          <LogoutRounded
            sx={{
              color: 'rgb(104, 115, 123)',
              fontSize: screenSize.isLandscapeMobile ? 20 : undefined,
            }}
          />
        }
        onClick={() => logout()}
        sx={{
          minWidth: '48px',
          padding: '4px',
          '& .MuiBottomNavigationAction-root': {
            minWidth: '48px',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '27.5px !important',
          },
        }}
      />
    </BN>
  );
}

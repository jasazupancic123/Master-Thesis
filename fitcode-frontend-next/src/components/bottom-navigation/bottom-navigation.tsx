import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { LogoutRounded } from '@mui/icons-material';
import {
  BottomNavigation as BN,
  BottomNavigationAction as BNAction,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useTheme } from '@mui/material';

interface BottomNavigationProps {
  index: number;
  setIndex: (index: number) => void;
  mapper: string[];
}

export default function BottomNavigation({
  index,
  setIndex,
  mapper,
}: BottomNavigationProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <BN
      value={index}
      onChange={(_, newValue) => {
        setIndex(newValue);
        router.push(mapper[newValue]);
      }}
      showLabels
      sx={{
        backgroundColor: theme.palette.background.default,
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
          sx={{
            color: index === i ? theme.palette.primary.main : '#fff',
            minWidth: '48px', // Reduce the minimum width
            padding: '4px', // Reduce padding
            '& .MuiBottomNavigationAction-root': {
              minWidth: '48px', // Override MUI default min-width
            },
            '& .MuiSvgIcon-root': {
              fontSize: screenSize.isLandscapeMobile
                ? '24px !important'
                : '27.5px !important', // Force smaller icon
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
        onClick={logout}
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

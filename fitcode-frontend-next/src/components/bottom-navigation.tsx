import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import { useAuth } from '@/context/auth-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { LogoutRounded } from '@mui/icons-material';
import {
  BottomNavigation as BN,
  BottomNavigationAction as BNAction,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import * as React from 'react';

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
        backgroundColor: 'background.paper',
        height: '65px',
        width: '100%',
        '& .Mui-selected': { color: '#1EB980 !important' },
      }}
    >
      {Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map((link, i) => (
        <BNAction
          key={i}
          label={link.label}
          icon={
            React.isValidElement(link.icon)
              ? React.cloneElement(
                  link.icon as React.ReactElement<{ sx?: object }>,
                  {
                    sx: { fontSize: 20, p: 0 },
                  }
                )
              : link.icon
          }
          sx={{
            color: index === i ? '#1EB980' : '#fff',
            minWidth: '48px', // Reduce the minimum width
            padding: '4px', // Reduce padding
            '& .MuiBottomNavigationAction-root': {
              minWidth: '48px', // Override MUI default min-width
            },
            '& .MuiSvgIcon-root': {
              fontSize: '20px !important', // Force smaller icon
            },
          }}
        />
      ))}
      <BNAction
        key="logout"
        label="Sign out"
        icon={
          <LogoutRounded
            sx={{
              fontSize: screenSize.isLandscapeMobile ? 20 : undefined,
            }}
          />
        } // Just pass the icon directly
        onClick={logout} // Add onClick here instead
        sx={{
          minWidth: '48px', // Reduce the minimum width
          padding: '4px', // Reduce padding
          '& .MuiBottomNavigationAction-root': {
            minWidth: '48px', // Override MUI default min-width
          },
          '& .MuiSvgIcon-root': {
            fontSize: '20px !important', // Force smaller icon
          },
        }}
      />
    </BN>
  );
}

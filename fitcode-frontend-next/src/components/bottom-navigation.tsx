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
        backgroundColor: '#303E4A',
        height: screenSize.isLandscapeMobile ? 45 : '70px',
        width: { xs: '100%', md: '50%' }, // Centered and one-third of the width on larger screens
        '& .Mui-selected': { color: '#1EB980 !important' },
      }}
    >
      {Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map((link, i) => (
        <BNAction
          key={i}
          label={link.label}
          icon={
            screenSize.isLandscapeMobile ? (
              React.isValidElement(link.icon) ? (
                React.cloneElement(
                  link.icon as React.ReactElement<{ sx?: object }>,
                  {
                    sx: {
                      fontSize: screenSize.isLandscapeMobile ? 20 : undefined,
                    },
                  }
                )
              ) : (
                <></>
              )
            ) : (
              link.icon
            )
          }
          sx={{
            color: index === i ? '#1EB980' : '#fff',
            p: 1,
          }}
        />
      ))}
      <BNAction
        key="logout"
        label="Sign out"
        icon={<LogoutRounded />} // Just pass the icon directly
        onClick={logout} // Add onClick here instead
      />
    </BN>
  );
}

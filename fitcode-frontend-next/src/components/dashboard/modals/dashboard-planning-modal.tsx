import { alpha, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { theme } from '@/app/style';
import { lib } from '@/lib';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/lib/common/const/nav.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

export default function DashboardPlanningModal(props: ModalProps) {
  const router = useRouter();

  const { role } = useAuthenticatedAuth();
  const { institution } = useMain();

  const { open, setOpen } = props;

  const permissionOk =
    lib.firebase.auth.isTrainer(role) || lib.firebase.auth.isManager(role);

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      onCancel={() => setOpen(false)}
      cancelText="Close"
      dialogueContentSx={{
        backgroundColor: theme.palette.background.dark,
      }}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={8}
        pb={2}
        sx={{
          px: 10,
        }}
      >
        <Typography
          variant="h6"
          fontSize={16}
          lineHeight={1}
          sx={{
            color: alpha(theme.palette.text.primary, 0.6),
          }}
        >
          Select group
        </Typography>

        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={4}
        >
          {institution.groups
            .sort((g1, g2) => g1.name.localeCompare(g2.name))
            .map((group) => {
              return (
                <Box
                  key={group.id}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="flex-start"
                  gap={1}
                  onClick={() => {
                    if (!permissionOk) return;

                    router.push(
                      LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(group.id).home.href
                    );
                  }}
                  sx={{
                    cursor: permissionOk ? 'pointer' : undefined,
                  }}
                >
                  <Box
                    width={100}
                    height={100}
                    display="flex"
                    flexDirection="column"
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{
                      borderRadius: 2,
                      border: `0.5px solid ${theme.palette.primary.main}`,
                      my: 'auto',
                    }}
                  >
                    <Typography
                      fontWeight={600}
                      textAlign="center"
                      sx={{
                        color: theme.palette.text.primary,
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        my: 'auto',
                        userSelect: 'none',
                      }}
                    >
                      {group.shortName}
                    </Typography>
                  </Box>

                  <Typography
                    fontWeight={300}
                    fontSize={14}
                    textAlign="center"
                    sx={{
                      color: theme.palette.text.primary,
                      textTransform: 'uppercase',
                      maxWidth: 100,
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                    }}
                  >
                    {group.name}
                  </Typography>
                </Box>
              );
            })}
        </Box>
      </Box>
    </MyModal>
  );
}

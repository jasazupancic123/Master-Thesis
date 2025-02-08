import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import RemoveIcon from '@mui/icons-material/Remove';
import { GroupController } from '@/group/group.controller';
import { useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { GroupPageProps } from '@/group/type/props.type';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { CreateCycle, UpdateCycle } from '@/group/type/cycle.type';
import dayjs from 'dayjs';
import Grid2 from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import { Cycle } from '@/group/entity/cycle.entity';
import DeleteIcon from '@mui/icons-material/Delete';

export function GroupSettings(props: GroupPageProps) {
  const { token } = useAppContext();
  const { group } = props.selected;
  const users = props.users?.data || [];

  const [name, setName] = useState(() => group?.name || '');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [createCycle, setCreateCycle] = useState<CreateCycle>({
    name: '',
    description: '',
    from: dayjs().format('YYYY-MM-DD') as unknown as Date,
    to: dayjs().add(2, 'week').format('YYYY-MM-DD') as unknown as Date,
  });

  async function updateName(name: string) {
    if (!group) return;

    try {
      const response = await GroupController.updateGroup(token, group.id, {
        name,
      });
      props.setSelected({ ...props.selected, group: response });
      props.groups.setData((groups) =>
        (groups || []).map((g) => (g.id === response.id ? response : g))
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to update group name');
    }
  }

  async function removeGroupMember(memberId: string) {
    if (!group) return;
    try {
      const response = await GroupController.updateGroup(token, group.id, {
        membersIds: group.membersIds.filter((id) => id !== memberId),
      });

      props.setSelected({ ...props.selected, group: response });
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove member');
    }
  }

  async function addGroupMember(memberId: string) {
    if (!group) return;

    try {
      const response = await GroupController.updateGroup(token, group.id, {
        membersIds: [...group.membersIds, memberId],
      });

      props.setSelected({ ...props.selected, group: response });
    } catch (e: any) {
      toast.error(e.message || 'Failed to add member');
    }
  }

  async function addCycle(cycle: CreateCycle) {
    if (!group) return;

    try {
      const response = await GroupController.addCycle(token, group.id, cycle);

      props.setSelected({
        ...props.selected,
        group: { ...group, cycles: [...group.cycles, response] },
      });

      setShowAddCycle(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add cycle');
    }
  }

  async function updateCycle(cycle: Cycle, input: UpdateCycle) {
    if (!group) return;

    try {
      const body = {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.from && { from: input.from }),
        ...(input.to && { to: input.to }),
      };

      if (Object.keys(body).length === 0) return;
      const updated = await GroupController.updateCycle(
        token,
        group.id,
        cycle.id,
        body
      );

      props.setSelected({
        ...props.selected,
        ...(cycle.id === props.selected.cycle?.id && { cycle: updated }),
        group: {
          ...group,
          cycles: group.cycles.map((c) => (c.id === cycle.id ? updated : c)),
        },
      });

      // trigger date change to fetch new trainings
      if (input.from || input.to)
        props.setDate({
          start: dayjs(updated.from),
          end: dayjs(updated.to),
          custom: false,
        });
    } catch (e: any) {
      toast.error(e.message || 'Failed to update cycle');
    }
  }

  async function deleteCycle(cycleId: string) {
    if (!group) return;

    try {
      await GroupController.deleteCycle(token, group.id, cycleId);

      props.setSelected({
        ...props.selected,
        ...(props.selected.cycle?.id === cycleId && { cycle: null }),
        group: {
          ...group,
          cycles: group.cycles.filter((cycle) => cycle.id !== cycleId),
        },
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete cycle');
    }
  }

  async function removeSubgroupMember(
    subgroupId: string,
    subgroupMembers: string[],
    memberId: string
  ) {
    if (!group) return;

    try {
      const response = await GroupController.updateSubgroup(
        token,
        group.id,
        subgroupId,
        {
          membersIds: subgroupMembers.filter((id) => id !== memberId),
        }
      );

      props.setSelected((prev) => ({
        ...prev,
        group: {
          ...prev.group!,
          availableMembersIds: [...prev.group!.availableMembersIds!, memberId],
          subgroups: prev.group!.subgroups?.map((subgroup) =>
            subgroup.id === subgroupId ? response : subgroup
          ),
        },
      }));

      if (props.selected.subgroup?.id === subgroupId)
        props.setSelected((prev) => ({
          ...prev,
          subgroup: response,
        }));
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove member');
    }
  }

  async function removeSubgroup(subgroupId: string, subgroupMembers: string[]) {
    if (!group) return;

    try {
      await GroupController.deleteSubgroup(token, group.id, subgroupId);

      if (props.selected.subgroup?.id === subgroupId)
        props.setSelected({ ...props.selected, subgroup: null });

      props.setSelected({
        ...props.selected,
        group: {
          ...group,
          availableMembersIds: [
            ...group.availableMembersIds!,
            ...subgroupMembers,
          ],
          subgroups: group.subgroups?.filter(
            (subgroup) => subgroup.id !== subgroupId
          ),
        },
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove subgroup');
    }
  }

  if (!group) return <Typography variant="body1">No group selected</Typography>;

  return (
    <>
      <Typography variant="h6" mb={2}>
        Group Settings
      </Typography>

      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => updateName(name)}
        fullWidth
      />

      <Box mt={4} />
      <Divider>Members</Divider>

      {/* List of all group members */}
      <Stack direction="row" spacing={2} p={1} my={1} flexWrap="wrap">
        {group.members?.length ? (
          group.members!.map((member) => (
            <Box key={member.uid} position="relative">
              <Tooltip title={member.email}>
                <Avatar>{member.email[0]}</Avatar>
              </Tooltip>

              <RemoveIcon
                onClick={() => removeGroupMember(member.uid)}
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  cursor: 'pointer',
                  bgcolor: 'red',
                  borderRadius: '50%',
                  height: 15,
                  width: 15,
                }}
              />
            </Box>
          ))
        ) : (
          <Typography variant="body2">No members</Typography>
        )}
      </Stack>

      {/* Add new member button */}
      <IconButton
        onClick={() => setShowAddMember((prev) => !prev)}
        sx={{ borderRadius: 20 }}
      >
        <AddIcon />
      </IconButton>

      {showAddMember && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .filter((user) => !group.membersIds.includes(user.uid))
                .map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => addGroupMember(user.uid)}
                        size="small"
                      >
                        <AddIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={4} />
      <Divider sx={{ mb: 1 }}>Cycles</Divider>

      {/* Table of cycles */}
      {group.cycles?.length === 0 ? (
        <Typography variant="body2" p={1}>
          No cycles
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {group.cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell>
                    <TextField
                      value={cycle.name}
                      onBlur={(e) =>
                        updateCycle(cycle, { name: e.target.value })
                      }
                      onChange={(e) =>
                        props.setSelected({
                          ...props.selected,
                          group: {
                            ...group,
                            cycles: group.cycles.map((c) =>
                              c.id === cycle.id
                                ? { ...c, name: e.target.value }
                                : c
                            ),
                          },
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={dayjs(cycle.from).format('YYYY-MM-DD')}
                      onBlur={(e) =>
                        updateCycle(cycle, {
                          from: e.target.value as unknown as Date,
                        })
                      }
                      onChange={(e) => {
                        props.setSelected({
                          ...props.selected,
                          group: {
                            ...group,
                            cycles: group.cycles.map((c) =>
                              c.id === cycle.id
                                ? {
                                    ...c,
                                    from: dayjs(e.target.value).toDate(),
                                  }
                                : c
                            ),
                          },
                        });
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={dayjs(cycle.to).format('YYYY-MM-DD')}
                      onBlur={(e) =>
                        updateCycle(cycle, {
                          to: e.target.value as unknown as Date,
                        })
                      }
                      onChange={(e) => {
                        props.setSelected({
                          ...props.selected,
                          group: {
                            ...group,
                            cycles: group.cycles.map((c) =>
                              c.id === cycle.id
                                ? {
                                    ...c,
                                    to: dayjs(e.target.value).toDate(),
                                  }
                                : c
                            ),
                          },
                        });
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 50 }}>
                    <IconButton
                      onClick={() => deleteCycle(cycle.id)}
                      size="small"
                    >
                      <DeleteIcon color="secondary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add new cycle button */}
      <IconButton
        onClick={() => setShowAddCycle((prev) => !prev)}
        sx={{ borderRadius: 20 }}
      >
        <AddIcon />
      </IconButton>

      {showAddCycle && (
        <Grid2 container mt={2} width={300} spacing={2}>
          <Grid2 xs={12}>
            <TextField
              label="Name"
              value={createCycle.name}
              onChange={(e) =>
                setCreateCycle({ ...createCycle, name: e.target.value })
              }
              fullWidth
            />
          </Grid2>

          <Grid2 xs={12}>
            <TextField
              multiline
              label="Description"
              minRows={3}
              value={createCycle.description}
              onChange={(e) =>
                setCreateCycle({ ...createCycle, description: e.target.value })
              }
              fullWidth
            />
          </Grid2>

          <Grid2 xs={6}>
            <TextField
              label="From"
              type="date"
              value={createCycle.from}
              onChange={(e) =>
                setCreateCycle({
                  ...createCycle,
                  from: e.target.value as unknown as Date,
                })
              }
              fullWidth
            />
          </Grid2>

          <Grid2 xs={6}>
            <TextField
              label="To"
              type="date"
              value={createCycle.to}
              onChange={(e) =>
                setCreateCycle({
                  ...createCycle,
                  to: e.target.value as unknown as Date,
                })
              }
              fullWidth
            />
          </Grid2>

          <Grid2 xs={12}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => addCycle(createCycle)}
            >
              Add Cycle
            </Button>
          </Grid2>
        </Grid2>
      )}

      {/* Subgroups */}
      <Box mt={4} />
      <Divider sx={{ mb: 1 }}>Subgroups</Divider>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Members</TableCell>
              <TableCell sx={{ width: 50 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {group.subgroups?.map((subgroup) => (
              <TableRow key={subgroup.id}>
                <TableCell>{subgroup.name}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" spacing={1}>
                    {subgroup.membersIds?.map((uid) => {
                      const member = group.members?.find((m) => m.uid === uid);
                      if (!member) return null;

                      return (
                        <Box key={member.uid} position="relative">
                          <Tooltip title={member.email}>
                            <Avatar>{member.email[0]}</Avatar>
                          </Tooltip>

                          <RemoveIcon
                            onClick={() =>
                              removeSubgroupMember(
                                subgroup.id,
                                subgroup.membersIds,
                                member.uid
                              )
                            }
                            sx={{
                              position: 'absolute',
                              top: -5,
                              right: -5,
                              cursor: 'pointer',
                              bgcolor: 'red',
                              borderRadius: '50%',
                              height: 15,
                              width: 15,
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() =>
                      removeSubgroup(subgroup.id, subgroup.membersIds)
                    }
                    size="small"
                  >
                    <DeleteIcon color="secondary" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

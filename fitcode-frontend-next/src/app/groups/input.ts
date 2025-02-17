import { GroupController } from '@/controller/group/group.controller';

export type CreateGroupInput = Parameters<typeof GroupController.create>[1];

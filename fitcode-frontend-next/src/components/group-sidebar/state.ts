import { Group } from '@/controller/group/type/group.type';
import toast from 'react-hot-toast';

export function handleLinkClick(
  e: React.MouseEvent,
  states: {
    group: Group | null;
  }
) {
  if (!states.group) {
    e.preventDefault();
    toast.error('Please select a group first!');
  }
}

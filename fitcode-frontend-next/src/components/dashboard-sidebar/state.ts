import { Organization } from '@/controller/organization/type/organization.type';
import toast from 'react-hot-toast';

export function handleLinkClick(
  e: React.MouseEvent,
  states: { organization: Organization | null }
) {
  if (!states.organization) {
    e.preventDefault();
    toast.error('Select organization first!');
  }
}

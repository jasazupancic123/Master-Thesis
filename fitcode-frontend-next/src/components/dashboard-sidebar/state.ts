import { Institution } from '@/controller/institution/type/institution.type';
import toast from 'react-hot-toast';

export function handleLinkClick(
  e: React.MouseEvent,
  states: { institution: Institution | null }
) {
  if (!states.institution) {
    e.preventDefault();
    toast.error('Select institution first!');
  }
}

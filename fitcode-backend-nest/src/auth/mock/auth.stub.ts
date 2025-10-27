import type { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../enum/user-role.enum';

export function generateCreateUserStub(
  data?: Partial<CreateUserDto>,
): CreateUserDto {
  return {
    email: data?.email || 'test@example.com',
    displayName: data?.displayName || 'Test User',
    photoURL: data?.photoURL || 'http://example.com/photo.jpg',
    role: data?.role || UserRole.ATHLETE,
    password: data?.password || 'password',
  };
}

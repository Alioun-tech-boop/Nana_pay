// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);

// src/common/decorators/roles.decorator.ts
import { SetMetadata as SetMetadata2 } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata2('roles', roles);

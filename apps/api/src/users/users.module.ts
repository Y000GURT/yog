import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module.js'
import { UsersService } from './users.service.js'

@Module({
  providers: [UsersService],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UsersModule {}

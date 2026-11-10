import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { PrismaModule } from '../prisma/prisma.module.js'
import { UsersModule } from '../users/users.module.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'
import { JwtStrategy } from './jwt.strategy.js'
import { RefreshSessionsService } from './refresh-sessions.service.js'

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      useFactory() {
        const secret = process.env.JWT_ACCESS_SECRET

        if (!secret) {
          throw new Error('Не задана переменная JWT_ACCESS_SECRET')
        }

        return {
          secret,
          signOptions: {
            expiresIn: 900,
          },
        }
      },
    }),
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, RefreshSessionsService],
  controllers: [AuthController],
})
export class AuthModule {}

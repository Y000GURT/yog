import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'

import { Prisma } from '../generated/prisma/client.js'
import { UsersService } from '../users/users.service.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'
import { RefreshSessionsService } from './refresh-sessions.service.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionsService: RefreshSessionsService,
  ) {}

  async register(dto: RegisterDto) {
    const login = dto.login.trim().toLowerCase()

    const user = await this.usersService.findByLogin(login)

    if (user) {
      throw new ConflictException('Этот логин уже занят')
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    })

    try {
      return await this.usersService.create({
        login,
        displayName: login,
        passwordHash,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Этот логин уже занят')
      }

      throw error
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByLogin(dto.login)

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль')
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password)

    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный логин или пароль')
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    })

    const refreshSession = await this.refreshSessionsService.create(user.id)

    return {
      accessToken,
      refreshToken: refreshSession.refreshToken,
      refreshExpiresAt: refreshSession.expiresAt,
      user: {
        id: user.id,
        login: user.login,
        displayName: user.displayName,
      },
    }
  }

  async refresh(refreshToken: string) {
    const session = await this.refreshSessionsService.rotate(refreshToken)

    const accessToken = await this.jwtService.signAsync({
      sub: session.userId,
    })

    return {
      accessToken,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.expiresAt,
    }
  }

  async logout(refreshToken: string) {
    await this.refreshSessionsService.revoke(refreshToken)
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId)

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден')
    }

    return user
  }
}

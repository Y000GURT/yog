import { createHash, randomBytes } from 'node:crypto'

import { Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

function isValidRefreshToken(refreshToken: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(refreshToken)
}

@Injectable()
export class RefreshSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string) {
    const refreshToken = randomBytes(32).toString('base64url')

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    })

    return {
      refreshToken,
      expiresAt,
    }
  }

  async rotate(refreshToken: string) {
    if (!isValidRefreshToken(refreshToken)) {
      throw new UnauthorizedException('Некорректный refresh-токен')
    }

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')
    const nextRefreshToken = randomBytes(32).toString('base64url')
    const nextTokenHash = createHash('sha256')
      .update(nextRefreshToken)
      .digest('hex')

    const [session] = await this.prisma.refreshSession.updateManyAndReturn({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        tokenHash: nextTokenHash,
      },
      select: {
        userId: true,
        expiresAt: true,
      },
    })

    if (!session) {
      throw new UnauthorizedException('Refresh-сессия недействительна')
    }

    return {
      userId: session.userId,
      refreshToken: nextRefreshToken,
      expiresAt: session.expiresAt,
    }
  }

  async revoke(refreshToken: string) {
    if (!isValidRefreshToken(refreshToken)) {
      return
    }

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')
    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }
}

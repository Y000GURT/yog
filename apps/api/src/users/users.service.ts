import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { login: string; displayName: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        login: data.login.trim().toLowerCase(),
        displayName: data.displayName.trim(),
        passwordHash: data.passwordHash,
      },
      select: {
        id: true,
        login: true,
        createdAt: true,
      },
    })
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        displayName: true,
        createdAt: true,
      },
    })
  }

  findByLogin(login: string) {
    return this.prisma.user.findUnique({
      where: {
        login: login.trim().toLowerCase(),
      },
    })
  }
}

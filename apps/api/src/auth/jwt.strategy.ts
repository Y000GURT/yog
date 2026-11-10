import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { isUUID } from 'class-validator'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET

    if (!secret) {
      throw new Error('Не задана переменная JWT_ACCESS_SECRET')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    })
  }

  validate(payload: unknown) {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('sub' in payload) ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub) ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number'
    ) {
      throw new UnauthorizedException('Некорректный токен')
    }

    return { id: payload.sub }
  }
}

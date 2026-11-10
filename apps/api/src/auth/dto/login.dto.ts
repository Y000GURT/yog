import { IsString, Length } from 'class-validator'

export class LoginDto {
  @IsString()
  @Length(3, 32)
  login!: string

  @IsString()
  @Length(1, 128)
  password!: string
}

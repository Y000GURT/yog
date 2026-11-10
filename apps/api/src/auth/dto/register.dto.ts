import { IsString, Length, Matches } from 'class-validator'

export class RegisterDto {
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Логин может содержать латинские буквы, цифры и _',
  })
  login!: string

  @IsString()
  @Length(8, 128)
  password!: string
}

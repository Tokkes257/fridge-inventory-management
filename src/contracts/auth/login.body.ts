import { IsEmail, IsString } from "class-validator";

export class LoginBody {

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;
}
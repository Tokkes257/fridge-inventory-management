import { IsNumber, IsString } from "class-validator";

export class AccessTokenView {

    @IsString()
    public token: string;

    @IsNumber()
    public expiresIn: number;
}
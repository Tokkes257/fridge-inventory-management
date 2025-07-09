import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LoginBody } from "../../contracts/login.body";
import { createToken } from "../users/handlers/login.handler";
import { AccessTokenView } from "../../contracts/accessToken.view";

@Controller("auth")
export class AuthController {

    @Post("login")
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: LoginBody): Promise<AccessTokenView> {
        return createToken(body);
    }
}
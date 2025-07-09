import { getList } from "./handlers/getList.handler";
import { create } from "./handlers/create.handler";
import { get } from "./handlers/get.handler";
import { update } from "./handlers/update.handler";
import { deleteUser } from "./handlers/delete.handler";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserBody } from "../../contracts/user.body";
import { SearchQuery } from "../../contracts/search.query";
import { UserView } from "../../contracts/user.view";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { UserUpdateBody } from "../../contracts/user.update.body";

@ApiTags("users")
@Controller("users")
export class UserController {

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Create a new user" })
	@ApiResponse({ status: 201, description: "User created successfully" })
    async create(@Body() body: UserBody): Promise<UserView> {
        return create(body);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get all users" })
	@ApiResponse({ status: 200, description: "Users retrieved successfully" })
    async getList(@Query() query: SearchQuery): Promise<UserView[]> {
        return getList(query.search);
    }

    @Get(":id")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get a user by ID" })
    @ApiResponse({ status: 200, description: "User retrieved successfully" })
    async get(@Param("id") id: string): Promise<UserView> {
        return get(id);
    }

    // TODO: doesnt work when not giving all fields
    @Patch(":id")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Update a user by ID" })
    @ApiResponse({ status: 200, description: "User updated successfully" })
    async update(@Param("id") id: string, @Body() body: UserUpdateBody): Promise<UserView> {
        return update(id, body);
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Delete a user by ID" })
    @ApiResponse({ status: 204, description: "User deleted successfully" })
    async delete(@Param("id") id: string): Promise<void> {
        await deleteUser(id);
    }
}
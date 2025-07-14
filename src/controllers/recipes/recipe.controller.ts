import { getList } from "./handlers/getList.handler";
import { create } from "./handlers/create.handler";
import { get } from "./handlers/get.handler";
import { update } from "./handlers/update.handler";
import { deleteRecipe } from "./handlers/delete.handler";
import { getMissingProducts } from "./handlers/getMissingProducts.handler";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SearchQuery } from "../../contracts/common/search.query";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { RecipeBody } from "../../contracts/recipe/recipe.body";
import { RecipeUpdateBody } from "../../contracts/recipe/recipe.update.body";
import { RecipeMissingProductView } from "../../contracts/recipe/recipe.missing.product.view";
import { RecipeView } from "../../contracts/recipe/recipe.view";

@ApiTags("recipes")
@Controller("recipes")
export class RecipeController {

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Create a new recipe" })
    @ApiResponse({ status: 201, description: "Recipe created successfully" })
    async create(@Body() body: RecipeBody): Promise<RecipeView> {
        return create(body);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get all recipes" })
    @ApiResponse({ status: 200, description: "Recipes retrieved successfully" })
    async getList(@Query() query: SearchQuery): Promise<RecipeView[]> {
        return getList(query.search);
    }

    @Get(":id")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get a recipe by ID" })
    @ApiResponse({ status: 200, description: "Recipe retrieved successfully" })
    async get(@Param("id") id: string): Promise<RecipeView> {
        return get(id);
    }

    @Get(":id/missing-products")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get missing products for a recipe by ID" })
    @ApiResponse({ status: 200, description: "Missing products retrieved successfully" })
    async getMissingProducts(@Param("id") id: string): Promise<RecipeMissingProductView[]> {
        return getMissingProducts(id);
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Update a recipe by ID" })
    @ApiResponse({ status: 200, description: "Recipe updated successfully" })
    async update(@Param("id") id: string, @Body() body: RecipeUpdateBody): Promise<RecipeView> {
        return update(id, body);
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Delete a recipe by ID" })
    @ApiResponse({ status: 204, description: "Recipe deleted successfully" })
    async delete(@Param("id") id: string): Promise<void> {
        await deleteRecipe(id);
    }
}
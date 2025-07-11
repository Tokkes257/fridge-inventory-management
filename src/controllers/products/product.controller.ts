import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";

import { create } from "./handlers/create.handler";
import { gift } from "./handlers/gift.handler";
import { deleteProduct } from "./handlers/delete.handler";
import { get } from "./handlers/get.handler";
import { getProductsInFridge } from "./handlers/getProductsInFridge.handler";
import { giftAllProductsInFridge } from "./handlers/giftAllProductsInFridge.handler";
import { deleteAllProductsInFridge } from "./handlers/deleteAllProductsInFridge.handler";

import { ProductBody } from "../../contracts/product/product.body";
import { ProductDeleteBody } from "../../contracts/product/product.delete.body";
import { ProductView } from "../../contracts/product/product.view";

@ApiTags("products")
@Controller("products")
export class ProductController {

    @Post(":userId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Put a product in the fridge" })
    @ApiResponse({ status: 201, description: "Product added to fridge successfully" })
    async create(
        @Param("userId") userId: string, 
        @Body() body: ProductBody
    ): Promise<ProductBody> {
        return create(userId, body);
    }

    @Get(':productId/user/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get a product by ID" })
    @ApiParam({ name: "productId", description: "ID of the product to retrieve" })
    @ApiParam({ name: "userId", description: "ID of the user who owns the product" })
    async get(
        @Param("productId") productId: string, 
        @Param("userId") userId: string
    ): Promise<ProductView[]> {
        return get(productId, userId);
    }

    @Get("fridge/:fridgeId/user/:userId")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get all products in a fridge for a user" })
    @ApiParam({ name: "userId", description: "ID of the user" })
    @ApiParam({ name: "fridgeId", description: "ID of the fridge" })
    @ApiResponse({ status: 200, description: "Products retrieved successfully" })
    async getProductsInFridge( 
        @Param("userId") userId: string,
        @Param("fridgeId") fridgeId: string
    ): Promise<ProductView[]> {
        return getProductsInFridge(userId, fridgeId);
    }

    @Get("user/:userId")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get all products in all fridges for a user" })
    @ApiParam({ name: "userId", description: "ID of the user" })
    @ApiResponse({ status: 200, description: "Products retrieved successfully" })
    async getAllProductsForUser(
        @Param("userId") userId: string
    ): Promise<ProductView[]> {
        return getProductsInFridge(userId);
    }

    @Get("location/:locationId/user/:userId")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Get all products in all fridges for a user on a specific floor" })
    @ApiParam({ name: "userId", description: "ID of the user" })
    @ApiParam({ name: "locationId", description: "Number representing the floor of the fridges" })
    @ApiResponse({ status: 200, description: "Products retrieved successfully" })
    async getAllProductsInLocationForUser(
        @Param("userId") userId: string,
        @Param("locationId", ParseIntPipe) locationId: number
    ): Promise<ProductView[]> {
        return getProductsInFridge(userId, undefined, locationId);
    }

    @Patch(":productId/gift/:senderUserId/:receiverUserId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Gift a product to another user" })
    @ApiResponse({ status: 200, description: "Product gifted successfully" })
    @ApiParam({ name: "productId", description: "ID of the product to gift" })
    @ApiParam({ name: "receiverUserId", description: "ID of the user to whom the product is gifted" })
    @ApiParam({ name: "senderUserId", description: "ID of the user gifting the product" })
    async giftProduct(
        @Param("productId") productId: string,
        @Param("receiverUserId") receiverUserId: string,
        @Param("senderUserId") senderUserId: string
    ): Promise<void> {
        await gift(productId, receiverUserId, senderUserId);
    }

    @Patch("fridge/:fridgeId/gift/:senderUserId/:receiverUserId")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Gift all products from one user to another in the given fridge" })
    @ApiResponse({ status: 200, description: "All products gifted successfully" })
    @ApiParam({ name: "fridgeId", description: "ID of the fridge" })
    @ApiParam({ name: "senderUserId", description: "ID of the user gifting the products" })
    @ApiParam({ name: "receiverUserId", description: "ID of the user receiving the products" })
    async giftAllProductsInFridge(
        @Param("senderUserId") senderUserId: string,
        @Param("receiverUserId") receiverUserId: string,
        @Param("fridgeId") fridgeId: string
    ): Promise<void> {
        await giftAllProductsInFridge(senderUserId, receiverUserId, fridgeId);
    }

    @Patch("gift/:senderUserId/:receiverUserId")
    @UseGuards(JwtAuthGuard)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Gift all products from one user to another" })
    @ApiResponse({ status: 200, description: "All products gifted successfully" })
    @ApiParam({ name: "senderUserId", description: "ID of the user gifting the products" })
    @ApiParam({ name: "receiverUserId", description: "ID of the user receiving the products" })
    async giftAllProductsFromUser(
        @Param("senderUserId") senderUserId: string,
        @Param("receiverUserId") receiverUserId: string
    ): Promise<void> {
        await giftAllProductsInFridge(senderUserId, receiverUserId);
    }

    @Delete(":productId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Delete a product from a fridge" })
    @ApiResponse({ status: 204, description: "Product deleted successfully" })
    @ApiParam({ name: "productId", description: "ID of the product to delete" })
    async deleteProduct(
        @Param("productId") productId: string, 
        @Body() body: ProductDeleteBody
    ): Promise<void> {
        await deleteProduct(productId, body);
    }

    @Delete("fridge/:fridgeId/user/:userId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Delete all products from a fridge for a user" })
    @ApiResponse({ status: 204, description: "All products deleted successfully" })
    @ApiParam({ name: "userId", description: "ID of the user" })
    @ApiParam({ name: "fridgeId", description: "ID of the fridge" })
    async deleteAllProductsInFridge(
        @Param("userId") userId: string,
        @Param("fridgeId") fridgeId: string
    ): Promise<void> {
        await deleteAllProductsInFridge(userId, fridgeId);
    }

    @Delete("user/:userId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiSecurity("x-auth")
    @ApiOperation({ summary: "Delete all products from all fridges for a user" })
    @ApiResponse({ status: 204, description: "All products deleted successfully" })
    @ApiParam({ name: "userId", description: "ID of the user" })
    async deleteAllProductsForUser(
        @Param("userId") userId: string
    ): Promise<void> {
        await deleteAllProductsInFridge(userId);
    }
}
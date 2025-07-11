import { ProductType } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";
import { IsNumber, IsString, IsUUID } from "class-validator";

Exclude()
export class RecipeMissingProductView {
    @Expose()
    @IsUUID()
    productId: string;

    @Expose()
    @IsString()
    name: string;

    @Expose()
    @IsString()
    type: ProductType;

    @Expose()
    @IsNumber()
    size: number;

    @Expose()
    @IsNumber()
    amount: number;
}
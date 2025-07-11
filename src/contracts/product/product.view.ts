import { ProductType } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";
import { IsUUID, IsString, IsNumber } from "class-validator";

Exclude()
export class ProductView {
    @Expose()
    @IsUUID()
    id: number;

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

    @Expose()
    @IsUUID()
    fridgeId: string;
}
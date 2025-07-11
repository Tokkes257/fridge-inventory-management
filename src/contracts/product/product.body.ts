import { ProductType } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

@Exclude()
export class ProductBody {

    @Expose()
    @IsString()
    public name: string;

    @Expose()
    @IsString()
    public type: ProductType;

    @Expose()
    @IsNumber()
    public amount: number;

    @Expose()
    @IsNumber()
    public size: number;

    @Expose()
    @IsString()
    public fridgeId: string;
}
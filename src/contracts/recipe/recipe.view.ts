import { Exclude, Expose } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";

@Exclude()
export class RecipeView {

    @Expose()
    @IsUUID()
    id: number;

    @Expose()
    @IsString()
    name: string;

    @Expose()
    @IsString()
    description: string;

    @Expose()
    @IsString()
    userId: string;

    @Expose()
    @IsOptional()
    products?: { id: string; quantity: number }[];
}
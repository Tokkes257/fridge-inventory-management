import { Exclude, Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

@Exclude()
export class RecipeBody {

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
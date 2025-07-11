import { Exclude, Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

@Exclude()
export class RecipeUpdateBody {
    @Expose()
    @IsOptional()
    @IsString()
    public name?: string;

    @Expose()
    @IsOptional()
    @IsString()
    public description?: string;

    @Expose()
    @IsOptional()
    public products?: { id: string; quantity: number }[];
}
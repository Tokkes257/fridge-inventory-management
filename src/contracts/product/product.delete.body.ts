import { Exclude, Expose } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

@Exclude()
export class ProductDeleteBody {

    @Expose()
    @IsString()
    public userId: string;

    @Expose()
    @IsNumber()
    public amount: number;

    @Expose()
    @IsString()
    public fridgeId: string;
}
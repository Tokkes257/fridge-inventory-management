import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsOptional, IsString, Length } from "class-validator";

@Exclude()
export class UserUpdateBody {
	@Expose()
	@IsOptional()
	@IsString()
	public firstName?: string;

	@Expose()
	@IsOptional()
	@IsString()
	public lastName?: string;

	@Expose()
	@IsOptional()
	@IsEmail()
	public email?: string;

	@Expose()
	@IsOptional()
	@IsString()
	@Length(8)
	public password?: string;
}

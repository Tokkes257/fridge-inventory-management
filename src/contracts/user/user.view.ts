import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";

@Exclude()
export class UserView {
	@Expose()
	@IsUUID()
	id: number;

	@Expose()
	@IsString()
	firstName: string;

	@Expose()
	@IsString()
	lastName: string;

	@Expose()
	@IsEmail()
	email: string;
}
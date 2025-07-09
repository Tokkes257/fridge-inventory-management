import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";

@Exclude()
export class UserView {
	// If we want to exclude this id property for example we can just omit it from the class or explicitly place a @Exclude() decorator on the property.
	@Expose()
	@IsUUID()
	id: number;

	@Expose()
	@IsString()
	name: string;

	@Expose()
	@IsEmail()
	email: string;
}
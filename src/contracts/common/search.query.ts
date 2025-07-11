import { IsString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SearchQuery {
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	public search?: string;
}
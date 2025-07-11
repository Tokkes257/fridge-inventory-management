import { Module } from "@nestjs/common";
import { UserController } from "./controllers/users/user.controller";
import { AuthController } from "./controllers/auth/auth.controller";
import { ProductController } from "./controllers/products/product.controller";

@Module({
	controllers: [AuthController, UserController, ProductController],
})
export class AppModule {}
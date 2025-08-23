import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// The fix is on the next line
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002'], // Support both frontend ports
    credentials: true,
  });

  // Now this line will work correctly
  app.use(cookieParser());

  await app.listen(3001);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// The fix is on the next line
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://seo-scanner-frontend.onrender.com',
    ], // Support both frontend ports
    credentials: true,
  });

  // Enable trust proxy for secure cookies and relative redirect URIs
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Now this line will work correctly
  app.use(cookieParser());

  await app.listen(3001);
}
bootstrap();

// import { ValidationPipe } from './pipes/validation.pipe';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { JwtAutGuard } from './auth/jwt-auth.guard';
import { MyLogger } from './config';

async function start() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule, { logger: new MyLogger() });

  // Builder позволяет задать для объекта, какие-то параметры/поля со своими значениями
  const config = new DocumentBuilder()
    .setTitle('RogaKopita API')
    // .setDescription('API for RogaKopita')
    .setVersion('1.0.0') // первая версия приложения, затем она может сама инкремитироваться
    // .addTag('Yana Zachetnaya')
    .build();

  // первым параметром передаем инстанс нашего приложения app
  const documentApi = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, documentApi);

  // app.useGlobalGuards(JwtAutGuard); // так можно глобально задавать защиту ендпоинтов и добавлять несколько гвардов
  // app.useGlobalPipes(new ValidationPipe()); // так глобально можно передавать несколько pipов и они будут отрабатывать абсолютно для каждого ендпоинта

  await app.listen(PORT, () => console.log(`Server started on port - ${PORT}`));
}

start();

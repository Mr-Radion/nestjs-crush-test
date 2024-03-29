import { User } from './../users/users.model';
import { UsersService } from './../users/users.service';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  // будем ли мы делать как тут парсинг с заголовка запроса как мидлвар и генерацию токена ? https://github.com/utimur/profi_auth_with_roles_nodejs/blob/master/middlewaree/authMiddleware.js
  constructor(private userService: UsersService, private jwtService: JwtService) {}
  async login(userDto: CreateUsersDto) {
    // в случае успешной авторизации возвращает нам пользователя
    const user = await this.validateUser(userDto);
    // в итоге на основании данных этого пользователя генерируется JWT токен и возвращается при авторизации
    return this.generateToken(user);
  }

  async registration(userDto: CreateUsersDto) {
    const candidate = await this.userService.getUserByEmail(userDto.email);
    // если пользователь с таким email существует
    if (candidate) {
      // особый синтаксис ошибок в Nestjs, в первый параметр передаем сообщение, а вторым статус код
      throw new HttpException('Пользователь с таким email уже существует', HttpStatus.BAD_REQUEST);
    }
    // если такого пользователя не существует, надо создать, для начала шифруем пароль
    // также нужна валидация, чтобы нельзя было сохранять пустые значения с логином и паролем (в DTO)
    const hashPassword = await bcrypt.hash(userDto.password, 5);
    // создаем пользователя вместо объекта userDto вытаскивая сразу поля из него и перезаписываем поле password
    const user = await this.userService.createUser({ ...userDto, password: hashPassword });
    // надо бы уточнить насчет создаваемой роли... по умолчанию юзера и как админа создавать
    // плюс разве не нужно передавать в функцию генерации токена время жизни токена? как это сделать и потом добавить рефреш токен
    // не забыть что когда мы реализуем аутенфикацию даже, все равно сами будет генерироватаь токен...
    // также почему мы не используем в функции генерации токена секретный ключ?
    // здесь также может быть отправка на почту юзера сообщения о регистрации
    return this.generateToken(user);
  }

  // на основе данных пользователя сгенерируем JWT токен
  private async generateToken(user: User) {
    const payload = { email: user.email, id: user.id, roles: user.roles };
    return {
      // генерация токена с помощью .sign
      // опции передавать в jwtService.sign больше никакие ненадо, т.к. мы уже указали при регистрации auth модуля, включая приватный ключ
      token: this.jwtService.sign(payload),
    };
  }

  // метод приватный и это правильно поскольку мы будем пользоваться ей лишь внутри сервиса
  private async validateUser(userDto: CreateUsersDto) {
    const user = await this.userService.getUserByEmail(userDto.email);
    // проверка совпадает ли пароль, который нам пришел с клиента с паролем из бд
    const passwordEquals = await bcrypt.compare(userDto.password, user.password);
    if (user && passwordEquals) {
      return user;
    }
    // если такого пользователя не существует или пароль не совпадает бросаем ошибку от Nest, которая наследуется от HttpException
    throw new UnauthorizedException({ message: 'Некорректный емайл или пароль' });
  }
}

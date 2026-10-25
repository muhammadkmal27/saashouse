import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mock_salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('sepatutnya memulangkan token JWT apabila login berjaya', async () => {
    const user = { id: 'uuid-1', email: 'test@test.com', role: 'USER' };
    const result = await service.login(user);
    expect(result.access_token).toEqual('mock_token');
    expect(mockJwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id, role: user.role });
  });

  it('sepatutnya meng-hash kata laluan (Bcrypt) semasa mendaftar', async () => {
    mockUsersService.create.mockResolvedValue({ id: '1', password: 'hashed_password' });
    await service.register({ email: 'new@test.com', password: 'plain', name: 'Abu' });
    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 'mock_salt');
  });
});


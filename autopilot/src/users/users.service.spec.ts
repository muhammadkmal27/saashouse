import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sepatutnya mencari pengguna mengikut emel', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
    const user = await service.findByEmail('test@example.com');
    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(user?.email).toBe('test@example.com');
  });
});


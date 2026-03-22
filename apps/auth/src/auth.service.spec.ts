import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from './users/users.service';
import { AuthCommon } from '@app/common';
import { userStub } from '../test/stubs/user.stub';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findOneNoCheck: jest.Mock };

  const cacheManager = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'OTP_EMAIL_EXPIRATION') {
        return 300;
      }

      if (key === 'REDIS_CACHE_KEY_PREFIX_AUTH') {
        return 'auth';
      }

      return undefined;
    }),
  };

  const jwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    usersService = {
      findOneNoCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyUser', () => {
    it('should reject invalid emails with UnauthorizedException', async () => {
      usersService.findOneNoCheck.mockResolvedValue(null);
      const compareHashSpy = jest.spyOn(AuthCommon, 'compareHash');

      await expect(
        authService.verifyUser('missing@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(compareHashSpy).not.toHaveBeenCalled();
    });

    it('should return the user without hashed password when credentials are valid', async () => {
      usersService.findOneNoCheck.mockResolvedValue({ ...userStub() });
      jest.spyOn(AuthCommon, 'compareHash').mockResolvedValue(true);

      const result = await authService.verifyUser(userStub().email, 'password');

      expect(result).toMatchObject({
        id: userStub().id,
        email: userStub().email,
        full_name: userStub().full_name,
      });
      expect(result).not.toHaveProperty('hashed_password');
    });
  });

  describe('generateUniqCode', () => {
    it('should always generate a 5-digit OTP', () => {
      jest
        .spyOn(crypto, 'randomBytes')
        .mockReturnValue(Buffer.from([0x00, 0x00, 0x01]));

      const otp = (authService as any).generateUniqCode();

      expect(otp).toBe(10001);
      expect(otp).toBeGreaterThanOrEqual(10000);
      expect(otp).toBeLessThanOrEqual(99999);
    });
  });
});

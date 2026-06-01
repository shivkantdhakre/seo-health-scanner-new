import { Test, TestingModule } from '@nestjs/testing';
import { CoreService } from './core.service';
import { ConfigService } from '@nestjs/config';

describe('CoreService', () => {
  let service: CoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GOOGLE_API_KEY') return 'mock-google-key';
              if (key === 'GEMINI_API_KEY') return 'mock-gemini-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CoreService>(CoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

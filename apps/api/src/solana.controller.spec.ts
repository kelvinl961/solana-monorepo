import { Test, TestingModule } from '@nestjs/testing';
import { SolanaController } from './solana/solana.controller';
import { SolanaService } from './solana/solana.service';

describe('SolanaController', () => {
  let controller: SolanaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolanaController],
      providers: [
        {
          provide: SolanaService,
          useValue: {
            getTransactionCountForSlot: jest.fn(async (_slot: number) => 5),
          },
        },
      ],
    }).compile();

    controller = module.get<SolanaController>(SolanaController);
  });

  it('should return expected format', async () => {
    const result = await controller.getTxCount(123);
    expect(result).toEqual({ slot: 123, transactionCount: 5 });
  });
});



import { IsEnum, IsInt, IsNumber, IsString, IsOptional, Min, Max, Matches } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  side!: string;

  @IsString()
  gpuType!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;

  @IsNumber()
  @Min(0.001)
  @Max(100)
  pricePerHour!: number;

  @IsInt()
  @Min(1)
  @Max(720)
  duration!: number;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, { message: 'Invalid commitment hash format' })
  commitmentHash!: string;

  @IsOptional()
  @IsString()
  encryptedDetails?: string;
}


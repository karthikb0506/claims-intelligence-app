import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

function trimString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return value as string | undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class AssessClaimDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  claimWording!: string;

  // capped because this goes into a prompt and an unbounded field is both a cost
  // and an abuse problem
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  evidenceText!: string;

  @Transform(({ value }) => {
    const normalized = trimString(value);
    return normalized === undefined ? undefined : normalized;
  })
  @IsOptional()
  @IsIn(['EU', 'US', 'IN', 'CN'])
  market?: string;
}

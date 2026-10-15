import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssessClaimDto } from './assess-claim.dto';

describe('AssessClaimDto', () => {
  it('trims whitespace and treats a blank market as optional', async () => {
    const dto = plainToInstance(AssessClaimDto, {
      productName: '  Revitalift Serum  ',
      claimWording: '  Reduces wrinkles by 20% in 4 weeks  ',
      evidenceText: '  Clinical study showed improvement after 8 weeks.  ',
      market: '   ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.productName).toBe('Revitalift Serum');
    expect(dto.claimWording).toBe('Reduces wrinkles by 20% in 4 weeks');
    expect(dto.evidenceText).toBe('Clinical study showed improvement after 8 weeks.');
    expect(dto.market).toBeUndefined();
  });

  it('rejects whitespace-only required fields', async () => {
    const dto = plainToInstance(AssessClaimDto, {
      productName: '   ',
      claimWording: '\t\n',
      evidenceText: '   ',
      market: 'EU',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['productName', 'claimWording', 'evidenceText']),
    );
  });
});

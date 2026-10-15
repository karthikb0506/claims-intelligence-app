import { Body, Controller, Post } from '@nestjs/common';
import { AssessmentResponse } from '../contract';
import { ClaimsService } from './claims.service';
import { AssessClaimDto } from './dto/assess-claim.dto';

@Controller('api/claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Post('assess')
  assess(@Body() dto: AssessClaimDto): Promise<AssessmentResponse> {
    return this.claims.assess(dto); 
  }
}

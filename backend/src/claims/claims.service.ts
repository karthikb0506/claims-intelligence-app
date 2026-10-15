import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Assessment } from '@prisma/client';
import { createHash } from 'node:crypto';
import { AssessmentResponse, ClaimParameters, RuleFinding, StudyFacts } from '../contract';
import { LLM_PROVIDER, LlmProvider, PROMPT_VERSION } from '../llm/llm.types';
import { PrismaService } from '../prisma/prisma.service';
import { AssessClaimDto } from './dto/assess-claim.dto';
import { RULES_VERSION, evaluateClaim } from './rules/claim-rules';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async assess(dto: AssessClaimDto): Promise<AssessmentResponse> {
    const market = dto.market ?? 'EU';
    const evidenceHash = sha256(dto.evidenceText);

    const claim = await this.prisma.claim.upsert({
      where: {
        productName_wording_market: {
          productName: dto.productName,
          wording: dto.claimWording,
          market,
        },
      },
      update: {},
      create: { productName: dto.productName, wording: dto.claimWording, market },
    });

    // Same claim, same evidence, same prompt, same rules, same model means the same
    // assessment. Returning the stored one keeps retries from paying for the model
    // twice and from writing duplicates into what is meant to be an audit trail.
    const fingerprint = sha256(
      [claim.id, evidenceHash, PROMPT_VERSION, RULES_VERSION, this.llm.modelId].join('|'),
    );

    const existing = await this.prisma.assessment.findUnique({ where: { fingerprint } });
    if (existing) {
      this.logger.log(`Returning existing assessment ${existing.id} for fingerprint match`);
      return toResponse(existing);
    }

    // 1. the model reads
    const extraction = await this.callModel(() =>
      this.llm.extract(dto.claimWording, dto.evidenceText),
    );

    // 2. the rules decide. No model in this step, on purpose.
    const evaluation = evaluateClaim(extraction.claim, extraction.study);

    // 3. the model writes up a verdict it did not choose
    const explanation = await this.callModel(() =>
      this.llm.explain({
        claimWording: dto.claimWording,
        verdict: evaluation.verdict,
        claim: extraction.claim,
        study: extraction.study,
        findings: evaluation.findings,
      }),
    );

    const saved = await this.prisma.assessment.create({
      data: {
        claimId: claim.id,
        evidenceText: dto.evidenceText,
        evidenceHash,
        verdict: evaluation.verdict,
        modelConfidence: extraction.modelConfidence,
        evidenceStrength: evaluation.evidenceStrength,
        reasoning: explanation.reasoning,
        suggestedClaim: explanation.suggestedClaim,
        extractedFacts: { claim: extraction.claim, study: extraction.study } as object,
        ruleFindings: evaluation.findings as unknown as object,
        rawModelOutput: { extract: extraction.raw, explain: explanation.raw } as object,
        modelId: this.llm.modelId,
        promptVersion: PROMPT_VERSION,
        rulesVersion: RULES_VERSION,
        fingerprint,
      },
    });

    return toResponse(saved);
  }

  private async callModel<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn(); 
    } catch (err) {
      this.logger.error(`Model call failed: ${(err as Error).message}`);
      // The caller cannot fix this and retrying immediately will not help, so say so
      // plainly rather than returning a half assessment.
      throw new ServiceUnavailableException('Assessment service is temporarily unavailable');
    }
  }
}

function toResponse(row: Assessment): AssessmentResponse {
  const facts = row.extractedFacts as unknown as { claim: ClaimParameters; study: StudyFacts };

  return {
    id: row.id,
    claimId: row.claimId,
    status: 'COMPLETED',
    verdict: row.verdict,
    justified: row.verdict === 'SUPPORTED',
    modelConfidence: row.modelConfidence,
    evidenceStrength: row.evidenceStrength,
    reasoning: row.reasoning,
    suggestedClaim: row.suggestedClaim,
    findings: row.ruleFindings as unknown as RuleFinding[],
    claimParameters: facts.claim,
    studyFacts: facts.study,
    provenance: {
      modelId: row.modelId,
      promptVersion: row.promptVersion,
      rulesVersion: row.rulesVersion,
      evidenceHash: row.evidenceHash,
    },
    createdAt: row.createdAt.toISOString(),
  };
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

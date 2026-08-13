import type {
  AssessmentQuestion,
  AssessmentSubmission,
  AssessmentResult,
  DomainScore,
  QuestionCategory
} from '../../types/assessment';
import type { SupportIndicatorLevel } from '../../types/child';
import { ASSESSMENT_QUESTIONS } from '../../data/mockAssessments';
import { storageService } from '../storage/storageService';
import { childApi } from './childApi';

const DISCLAIMER_TEXT =
  "CLINICAL NOTICE & MEDICAL DISCLAIMER: This assessment is an automated AI-assisted developmental screening tool designed for early risk indicator identification. It DOES NOT constitute a formal medical, neurological, or psychiatric diagnosis of Autism Spectrum Disorder (ASD). Please consult a certified pediatric neurologist, developmental pediatrician, or clinical psychologist for formal evaluation.";

export const assessmentApi = {
  getQuestions: async (): Promise<AssessmentQuestion[]> => {
    return ASSESSMENT_QUESTIONS;
  },

  calculateResult: async (submission: AssessmentSubmission): Promise<AssessmentResult> => {
    const questions = ASSESSMENT_QUESTIONS;
    let totalScore = 0;
    const maxScore = questions.length * 3;

    const domainTotals: Record<string, { score: number; count: number; name: string }> = {
      SOCIAL: { score: 0, count: 0, name: 'Social Interaction & Reciprocity' },
      COMMUNICATION: { score: 0, count: 0, name: 'Speech & Verbal Communication' },
      BEHAVIORAL: { score: 0, count: 0, name: 'Repetitive & Restricted Behaviors' },
    };

    questions.forEach((q: AssessmentQuestion) => {
      const answerScore = submission.answers[q.id] || 0;
      totalScore += answerScore;
      const cat = q.category.toUpperCase().includes('SOCIAL')
        ? 'SOCIAL'
        : q.category.toUpperCase().includes('COMMUNICATION')
        ? 'COMMUNICATION'
        : 'BEHAVIORAL';

      domainTotals[cat].score += answerScore;
      domainTotals[cat].count += 1;
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    let supportIndicator: SupportIndicatorLevel = 'LOW';
    let summary = 'The screening responses indicate low indicators for developmental autism spectrum traits. Routine developmental monitoring is recommended.';
    const recommendations = [
      'Continue standard developmental milestones tracking.',
      'Promote interactive peer play and structured storytelling.',
      'Schedule routine annual pediatric checkups.'
    ];

    if (percentage > 65) {
      supportIndicator = 'HIGH';
      summary = 'The screening responses highlight elevated indicators in social reciprocity and communication domains. Substantial clinical support is recommended.';
      recommendations.unshift(
        'Urgent recommendation: Consult with a certified Pediatric Neurologist or Developmental Specialist.',
        'Consider comprehensive ABA (Applied Behavior Analysis) evaluation and Speech Therapy assessment.',
        'Request early intervention therapy services with your local developmental healthcare team.'
      );
    } else if (percentage > 35) {
      supportIndicator = 'MODERATE';
      summary = 'The screening responses show moderate developmental variation across social and behavioral categories. Moderate support and targeted therapy may be beneficial.';
      recommendations.unshift(
        'Consult with an Occupational Therapist for sensory integration evaluation.',
        'Schedule a clinical consultation with a certified Speech & Language Therapist.',
        'Re-evaluate screening indicators in 3 months.'
      );
    }

    const domainScores: DomainScore[] = Object.entries(domainTotals).map(([catKey, data]) => {
      const categoryMax = data.count * 3;
      const catPerc = categoryMax > 0 ? Math.round((data.score / categoryMax) * 100) : 0;
      return {
        category: catKey as QuestionCategory,
        categoryName: data.name,
        obtainedScore: data.score,
        maxScore: categoryMax,
        percentage: catPerc
      };
    });

    const child = await childApi.getChildById(submission.childId);
    const childName = child ? child.name : 'Child Patient';

    const result: AssessmentResult = {
      id: `ast-${Date.now()}`,
      childId: submission.childId,
      childName,
      completedDate: new Date().toISOString(),
      totalScore,
      maxScore,
      percentage,
      supportIndicator,
      domainScores,
      summary,
      recommendations,
      disclaimer: DISCLAIMER_TEXT
    };

    if (child) {
      await childApi.updateSupportIndicator(child.id, supportIndicator);
    }

    storageService.addAssessmentResult(result);
    return result;
  },

  submitAssessment: async (submission: AssessmentSubmission): Promise<AssessmentResult> => {
    return assessmentApi.calculateResult(submission);
  },

  getResultsByChild: async (childId: string): Promise<AssessmentResult[]> => {
    const all = storageService.getAssessmentResults();
    return all.filter((r) => r.childId === childId);
  },

  getAllResults: async (): Promise<AssessmentResult[]> => {
    return storageService.getAssessmentResults();
  }
};

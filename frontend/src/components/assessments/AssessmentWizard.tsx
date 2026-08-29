import React, { useState } from 'react';
import { ASSESSMENT_QUESTIONS } from '../../data/mockAssessments';
import { assessmentApi } from '../../services/api/assessmentApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import type { Child } from '../../types/child';
import { ShieldAlert, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface AssessmentWizardProps {
  childrenList: Child[];
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ childrenList }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Start at Question 1
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex] || ASSESSMENT_QUESTIONS[0];

  const handleOptionSelect = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      showToast('Please select an option to proceed', 'warning');
      return;
    }
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChildId) {
      showToast('Please select a child profile', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const scoreAnswers: Record<string, number> = {};
      ASSESSMENT_QUESTIONS.forEach((q) => {
        const selectedVal = answers[q.id] || 'Sometimes';
        const matchOpt = q.options.find((o) => (o.value || o.label) === selectedVal);
        scoreAnswers[q.id] = matchOpt ? matchOpt.score : 1;
      });

      const result = await assessmentApi.submitAssessment({
        childId: selectedChildId,
        answers: scoreAnswers
      });

      showToast('Assessment submitted! Viewing AI results...', 'success');
      navigate('/parent/results', { state: { result } });
    } catch (err: any) {
      showToast(err?.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar: Title, Question Count, Time Left, Progress Bar (Screen 3) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Screening Test</h1>
            <p className="text-xs font-semibold text-slate-500">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Assessing Child:</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full text-xs font-bold bg-white text-slate-800 rounded-xl p-2 border border-slate-200 focus:outline-none"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Age {c.age})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Time Left: <span className="font-mono text-purple-600">12:45</span></span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card (Matching Screen 3 Layout) */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Visual Illustration */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-xs bg-purple-50/50 p-6 rounded-2xl border border-purple-100/60 flex flex-col items-center">
            <svg viewBox="0 0 300 240" className="w-full h-auto drop-shadow-xs">
              <circle cx="150" cy="120" r="90" fill="#f3e8ff" />
              {/* Parent */}
              <circle cx="120" cy="80" r="22" fill="#334155" />
              <path d="M 90 130 Q 120 105 150 130 L 155 200 L 85 200 Z" fill="#f472b6" />
              {/* Child */}
              <circle cx="180" cy="120" r="16" fill="#475569" />
              <path d="M 160 155 Q 180 140 200 155 L 205 200 L 155 200 Z" fill="#60a5fa" />
            </svg>
          </div>
        </div>

        {/* Right Question & Options */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
            {currentQuestion.questionText}
          </h2>

          {/* Options List */}
          <div className="space-y-3">
            {['Always', 'Sometimes', 'Rarely', 'Never'].map((optLabel) => {
              const isSelected = answers[currentQuestion.id] === optLabel;
              return (
                <button
                  key={optLabel}
                  type="button"
                  onClick={() => handleOptionSelect(optLabel)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-200 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span>{optLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clinical Disclaimer Box */}
      <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl text-xs text-purple-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <p>
          This preliminary behavioral questionnaire is designed for AI screening support and does not replace formal clinical diagnosis by a licensed specialist.
        </p>
      </div>

      {/* Bottom Buttons: Previous / Next */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
        >
          Previous
        </button>

        <Button
          onClick={handleNext}
          isLoading={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-md shadow-purple-600/20"
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Submit Test' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

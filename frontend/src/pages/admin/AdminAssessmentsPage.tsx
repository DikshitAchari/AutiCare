import React, { useState, useEffect } from 'react';
import { assessmentApi } from '../../services/api/assessmentApi';
import type { AssessmentResult } from '../../types/assessment';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const AdminAssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);

  useEffect(() => {
    assessmentApi.getAllResults().then(setAssessments);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Screening Audit Ledger</h1>
        <p className="text-xs text-slate-500">Global clinical screening logs, confidence indexes, and disclaimers</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600">
                <th className="py-3 px-4">Completed Date</th>
                <th className="py-3 px-4">Child Patient</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Support Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No screening assessments completed yet.
                  </td>
                </tr>
              ) : (
                assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {new Date(a.completedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{a.childName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{a.totalScore} / {a.maxScore}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{a.percentage}%</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={a.supportIndicator} type="support" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

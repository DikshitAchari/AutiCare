import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { childApi } from '../../services/api/childApi';
import type { Child } from '../../types/child';
import { AssessmentWizard } from '../../components/assessments/AssessmentWizard';
import { Card } from '../../components/ui/Card';
import { Loader2 } from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const list = await childApi.getChildrenByParent(user.id);
        setChildrenList(list);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (childrenList.length === 0) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto">
        <h3 className="text-base font-bold text-slate-800">No Registered Child Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Please add a child profile before starting the behavioral screening questionnaire.</p>
      </Card>
    );
  }

  return (
    <div>
      <AssessmentWizard childrenList={childrenList} />
    </div>
  );
};

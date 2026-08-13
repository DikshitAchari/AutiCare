import React from 'react';
import { Badge } from './Badge';
import type { AppointmentStatus } from '../../types/appointment';
import type { SupportIndicatorLevel, ChildTherapyStatus } from '../../types/child';

export interface StatusBadgeProps {
  status?: AppointmentStatus | SupportIndicatorLevel | ChildTherapyStatus | string;
  type?: 'appointment' | 'support' | 'therapy' | 'custom';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = '', type = 'appointment', className }) => {
  if (type === 'appointment') {
    switch (status) {
      case 'BOOKED':
      case 'CONFIRMED':
        return <Badge variant="emerald" className={className}>Confirmed</Badge>;
      case 'PENDING':
        return <Badge variant="amber" className={className}>Pending Approval</Badge>;
      case 'CANCELLED':
        return <Badge variant="rose" className={className}>Cancelled</Badge>;
      case 'COMPLETED':
        return <Badge variant="blue" className={className}>Completed</Badge>;
      default:
        return <Badge variant="slate" className={className}>{status}</Badge>;
    }
  }

  if (type === 'support') {
    switch (status) {
      case 'LOW':
        return <Badge variant="emerald" className={className}>Low Support Indicator</Badge>;
      case 'MODERATE':
        return <Badge variant="amber" className={className}>Moderate Support Indicator</Badge>;
      case 'HIGH':
        return <Badge variant="purple" className={className}>High Support Indicator</Badge>;
      case 'NOT_ASSESSED':
      default:
        return <Badge variant="slate" className={className}>Screening Pending</Badge>;
    }
  }

  if (type === 'therapy') {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="blue" className={className}>Active Therapy</Badge>;
      case 'REQUESTED':
        return <Badge variant="amber" className={className}>Request Pending</Badge>;
      case 'COMPLETED':
        return <Badge variant="emerald" className={className}>Therapy Completed</Badge>;
      case 'NOT_STARTED':
      default:
        return <Badge variant="slate" className={className}>Not Started</Badge>;
    }
  }

  return <Badge variant="slate" className={className}>{status}</Badge>;
};

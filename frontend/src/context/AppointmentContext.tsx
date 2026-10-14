/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Appointment, BookingSource, AppointmentType } from '../types/appointment';
import { appointmentApi } from '../services/api/appointmentApi';
import { storageService } from '../services/storage/storageService';

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  isSlotAvailable: (therapistId: string, date: string, time: string) => boolean;
  bookAppointment: (payload: {
    therapistId: string;
    therapistName: string;
    childId: string;
    childName: string;
    parentId: string;
    parentName: string;
    date: string;
    time: string;
    bookingSource: BookingSource;
    appointmentType: AppointmentType;
    reason?: string;
    notes?: string;
  }) => Promise<Appointment>;
  updateStatus: (id: string, status: Appointment['status']) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  refreshAppointments: () => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAppointments = useCallback(() => {
    const token = storageService.getAuthToken();
    if (!token) return;
    appointmentApi
      .getAppointments()
      .then((data) => setAppointments(data))
      .catch((err) => console.warn('Failed to fetch appointments:', err));
  }, []);

  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  const isSlotAvailable = useCallback(
    (therapistId: string, date: string, time: string): boolean => {
      const match = appointments.find(
        (a) =>
          a.therapistId === therapistId &&
          a.date === date &&
          a.time === time &&
          a.status !== 'CANCELLED'
      );
      return !match;
    },
    [appointments]
  );

  const bookAppointment = async (payload: {
    therapistId: string;
    therapistName: string;
    childId: string;
    childName: string;
    parentId: string;
    parentName: string;
    date: string;
    time: string;
    bookingSource: BookingSource;
    appointmentType: AppointmentType;
    reason?: string;
    notes?: string;
  }): Promise<Appointment> => {
    setIsLoading(true);
    try {
      const newApt = await appointmentApi.createAppointment(payload);
      refreshAppointments();
      setIsLoading(false);
      return newApt;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    setIsLoading(true);
    try {
      await appointmentApi.updateAppointmentStatus(id, status);
      refreshAppointments();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const cancelAppointment = async (id: string) => {
    setIsLoading(true);
    try {
      await appointmentApi.cancelAppointment(id);
      refreshAppointments();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        isSlotAvailable,
        bookAppointment,
        updateStatus,
        cancelAppointment,
        refreshAppointments
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointments must be used within an AppointmentProvider');
  return ctx;
};

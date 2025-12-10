import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { usePeriodApplicability, PeriodType } from '@/hooks/usePeriodApplicability';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { useActivePlan } from '@/hooks/useActivePlan';

export interface PeriodFilterState {
  periodType: PeriodType;
  selectedYear: number;
  selectedMonth: number;
  selectedQuarter: 1 | 2 | 3 | 4;
  selectedQuarterYear: number;
  selectedMonthYear: number;
  selectedSemester: 1 | 2;
  selectedSemesterYear: number;
}

export interface PeriodFilterContextType extends PeriodFilterState {
  // Individual setters
  setPeriodType: (type: PeriodType) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedQuarter: (quarter: 1 | 2 | 3 | 4) => void;
  setSelectedQuarterYear: (year: number) => void;
  setSelectedMonthYear: (year: number) => void;
  setSelectedSemester: (semester: 1 | 2) => void;
  setSelectedSemesterYear: (year: number) => void;
  
  // Batch update
  setFilters: (filters: Partial<PeriodFilterState>) => void;
  
  // Period applicability info (from usePeriodApplicability)
  isYTDCalculable: boolean;
  ytdInfoMessage: string | null;
  planFirstYear: number;
  hasActivePlan: boolean;
  
  // Period options (from usePlanPeriodOptions)
  quarterOptions: { value: string; label: string; quarter: 1 | 2 | 3 | 4; year: number }[];
  monthOptions: { value: string; label: string }[];
  yearOptions: { value: number; label: string }[];
  semesterOptions: { value: string; label: string; semester: 1 | 2; year: number }[];
  
  // Utility handlers
  handleYTDClick: () => void;
}

export const PeriodFilterContext = createContext<PeriodFilterContextType | null>(null);

interface PeriodFilterProviderProps {
  children: React.ReactNode;
}

export const PeriodFilterProvider: React.FC<PeriodFilterProviderProps> = ({ children }) => {
  const { isYTDCalculable, defaultPeriod, ytdInfoMessage, planFirstYear, hasActivePlan } = usePeriodApplicability();
  const { quarterOptions, monthOptions, yearOptions, semesterOptions, getDefaultYear, getDefaultQuarter, getDefaultMonth, getDefaultSemester } = usePlanPeriodOptions();
  const { activePlan } = useActivePlan();
  
  // Calculate initial values
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
  
  // State
  const currentSemester = (now.getMonth() + 1) <= 6 ? 1 : 2;
  const [periodType, setPeriodType] = useState<PeriodType>(defaultPeriod);
  const [selectedYear, setSelectedYear] = useState<number>(isYTDCalculable ? previousMonth.getFullYear() : planFirstYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(previousMonth.getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(previousMonth.getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(currentQuarter);
  const [selectedQuarterYear, setSelectedQuarterYear] = useState<number>(isYTDCalculable ? now.getFullYear() : planFirstYear);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(currentSemester as 1 | 2);
  const [selectedSemesterYear, setSelectedSemesterYear] = useState<number>(isYTDCalculable ? now.getFullYear() : planFirstYear);
  
  // Track if we've initialized with the active plan
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastPlanId, setLastPlanId] = useState<string | null>(null);
  
  // Initialize/Reset when active plan changes
  useEffect(() => {
    if (activePlan && yearOptions.length > 0) {
      // Only reinitialize if plan changed or not yet initialized
      if (!hasInitialized || lastPlanId !== activePlan.id) {
        const defaultYear = getDefaultYear();
        const defaultQuarter = getDefaultQuarter();
        const defaultMonth = getDefaultMonth();
        const defaultSemester = getDefaultSemester();
        
        setSelectedYear(defaultYear);
        setSelectedQuarter(defaultQuarter.quarter);
        setSelectedQuarterYear(defaultQuarter.year);
        setSelectedMonth(defaultMonth.month);
        setSelectedMonthYear(defaultMonth.year);
        setSelectedSemester(defaultSemester.semester);
        setSelectedSemesterYear(defaultSemester.year);
        setPeriodType(defaultPeriod);
        
        setHasInitialized(true);
        setLastPlanId(activePlan.id);
      }
    }
  }, [activePlan?.id, yearOptions.length, hasInitialized, lastPlanId, getDefaultYear, getDefaultQuarter, getDefaultMonth, getDefaultSemester, defaultPeriod]);
  
  // Validate and sync years with available options
  useEffect(() => {
    if (yearOptions.length > 0) {
      const validYears = yearOptions.map(opt => opt.value);
      
      // Validate selectedYear
      if (!validYears.includes(selectedYear)) {
        const closestYear = validYears.reduce((closest, year) => {
          return Math.abs(year - selectedYear) < Math.abs(closest - selectedYear) ? year : closest;
        }, validYears[0]);
        setSelectedYear(closestYear);
      }
      
      // Validate selectedQuarterYear
      if (!validYears.includes(selectedQuarterYear)) {
        const closestYear = validYears.reduce((closest, year) => {
          return Math.abs(year - selectedQuarterYear) < Math.abs(closest - selectedQuarterYear) ? year : closest;
        }, validYears[0]);
        setSelectedQuarterYear(closestYear);
      }
      
      // Validate selectedMonthYear
      if (!validYears.includes(selectedMonthYear)) {
        const closestYear = validYears.reduce((closest, year) => {
          return Math.abs(year - selectedMonthYear) < Math.abs(closest - selectedMonthYear) ? year : closest;
        }, validYears[0]);
        setSelectedMonthYear(closestYear);
      }
    }
  }, [yearOptions, selectedYear, selectedQuarterYear, selectedMonthYear]);
  
  // Batch update function
  const setFilters = useCallback((filters: Partial<PeriodFilterState>) => {
    if (filters.periodType !== undefined) setPeriodType(filters.periodType);
    if (filters.selectedYear !== undefined) setSelectedYear(filters.selectedYear);
    if (filters.selectedMonth !== undefined) setSelectedMonth(filters.selectedMonth);
    if (filters.selectedQuarter !== undefined) setSelectedQuarter(filters.selectedQuarter);
    if (filters.selectedQuarterYear !== undefined) setSelectedQuarterYear(filters.selectedQuarterYear);
    if (filters.selectedMonthYear !== undefined) setSelectedMonthYear(filters.selectedMonthYear);
    if (filters.selectedSemester !== undefined) setSelectedSemester(filters.selectedSemester);
    if (filters.selectedSemesterYear !== undefined) setSelectedSemesterYear(filters.selectedSemesterYear);
  }, []);
  
  // YTD click handler with toast notification
  const handleYTDClick = useCallback(() => {
    setPeriodType('ytd');
    if (!isYTDCalculable && ytdInfoMessage) {
      // Using window event to trigger toast from outside React tree if needed
      console.log('[PeriodFilter] YTD info:', ytdInfoMessage);
    }
  }, [isYTDCalculable, ytdInfoMessage]);
  
  const value = useMemo<PeriodFilterContextType>(() => ({
    // State
    periodType,
    selectedYear,
    selectedMonth,
    selectedQuarter,
    selectedQuarterYear,
    selectedMonthYear,
    selectedSemester,
    selectedSemesterYear,
    
    // Setters
    setPeriodType,
    setSelectedYear,
    setSelectedMonth,
    setSelectedQuarter,
    setSelectedQuarterYear,
    setSelectedMonthYear,
    setSelectedSemester,
    setSelectedSemesterYear,
    setFilters,
    
    // Period applicability
    isYTDCalculable,
    ytdInfoMessage,
    planFirstYear,
    hasActivePlan,
    
    // Period options
    quarterOptions,
    monthOptions,
    yearOptions,
    semesterOptions,
    
    // Handlers
    handleYTDClick,
  }), [
    periodType,
    selectedYear,
    selectedMonth,
    selectedQuarter,
    selectedQuarterYear,
    selectedMonthYear,
    selectedSemester,
    selectedSemesterYear,
    setFilters,
    isYTDCalculable,
    ytdInfoMessage,
    planFirstYear,
    hasActivePlan,
    quarterOptions,
    monthOptions,
    yearOptions,
    semesterOptions,
    handleYTDClick,
  ]);
  
  return (
    <PeriodFilterContext.Provider value={value}>
      {children}
    </PeriodFilterContext.Provider>
  );
};

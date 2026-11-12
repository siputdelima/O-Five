import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface StepperProps {
  currentStep: StepId;
  isLoading: boolean;
  loadingMessage?: string;
  onStepClick?: (step: StepId) => void;
  maxReachedStep: StepId;
}

export const STEP_DEFINITIONS = [
  { id: 1 as StepId, label: 'Input Dokumen', description: 'Unggah file / teks' },
  { id: 2 as StepId, label: 'Analisis Kebijakan', description: 'Ekstraksi substansi' },
  { id: 3 as StepId, label: 'Penyaringan KIP', description: 'UU No. 14/2008' },
  { id: 4 as StepId, label: 'Generasi 5 Produk', description: 'O-FIVE Strategis' },
  { id: 5 as StepId, label: 'Verifikasi Sumber', description: 'Dua lapis audit' },
  { id: 6 as StepId, label: 'Human Review', description: 'Pemeriksaan analis' },
  { id: 7 as StepId, label: 'Output & Ekspor', description: 'DOCX & TXT' },
];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  isLoading,
  loadingMessage,
  onStepClick,
  maxReachedStep,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar / Stepper on Desktop */}
        <div className="hidden md:flex items-center justify-between relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0"></div>
          {STEP_DEFINITIONS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = step.id <= maxReachedStep && onStepClick;

            return (
              <button
                key={step.id}
                disabled={!isClickable || isLoading}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                  isClickable && !isLoading ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? isLoading
                        ? 'bg-[#0B1F3A] text-white ring-4 ring-blue-100'
                        : 'bg-[#0B1F3A] text-white ring-4 ring-blue-100 shadow-sm'
                      : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent && isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 font-semibold transition-colors ${
                    isCurrent ? 'text-[#0B1F3A]' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 hidden lg:block">
                  {step.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Mobile Stepper */}
        <div className="md:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-xs font-bold">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : currentStep}
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1F3A]">
                Tahap {currentStep} dari 7: {STEP_DEFINITIONS[currentStep - 1].label}
              </div>
              <div className="text-[10px] text-slate-500">
                {loadingMessage || STEP_DEFINITIONS[currentStep - 1].description}
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400">
            {Math.round((currentStep / 7) * 100)}%
          </div>
        </div>

        {/* Active Loading Banner if loading */}
        {isLoading && loadingMessage && (
          <div className="mt-2.5 p-2 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center gap-2.5 text-xs text-blue-900">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700 flex-shrink-0" />
            <span className="font-medium">{loadingMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

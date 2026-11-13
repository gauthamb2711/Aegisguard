import React from 'react';
import {
  BrainCircuit,
  Cpu,
  Globe,
  ShieldCheck,
} from 'lucide-react';

export const AboutProject: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          AI-Based Intelligent Women Safety System
        </h2>
        <p className="text-sm text-[#4B4560] leading-relaxed max-w-3xl">
          A software-only, browser-native personal safety platform combining deliberate manual SOS workflows, genuine in-browser Random Forest movement classification, HTML5 Geolocation, Web Speech command detection, DeviceMotion shake recognition, Safe Journey check-ins, and simulated incoming calls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1B2E]">
            <BrainCircuit className="w-4 h-4 text-purple-600" aria-hidden="true" />
            <span>Machine Learning Architecture</span>
          </div>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            Implements a genuine Random Forest ensemble classifier from scratch in TypeScript using CART Gini impurity splitting, bootstrap aggregating (bagging), random feature subset selection, and majority voting across 9 motion features (3-axis acceleration, magnitude, delta acceleration, variance, peak count, short-term intensity, and elevated duration).
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1B2E]">
            <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
            <span>Ethical & Safety Boundaries</span>
          </div>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            The system never claims it can reliably detect an assault or guarantee physical protection. ML strictly classifies movement as normal-like or unusual-like on synthetic demonstration datasets, while manual SOS always remains independent, offline-capable, and confirmation-driven.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1B2E]">
            <Globe className="w-4 h-4 text-rose-600" aria-hidden="true" />
            <span>Browser Web APIs Used</span>
          </div>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            Built with React, TypeScript, Tailwind CSS, Recharts, and native browser APIs: Geolocation API, DeviceMotion API, Web Speech Recognition API, Web Share API, Web Audio API, and user-consented LocalStorage—with zero backend dependencies or paid APIs.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1B2E]">
            <Cpu className="w-4 h-4 text-purple-600" aria-hidden="true" />
            <span>Hardware & Platform Notes</span>
          </div>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            Physical shake detection and live accelerometer monitoring require mobile/tablet hardware over HTTPS. Desktop and laptop browsers without accelerometers automatically fall back to the interactive 7-scenario Movement Sensor Simulator.
          </p>
        </div>
      </div>
    </div>
  );
};

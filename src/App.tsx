/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SafetyProvider } from './context/SafetyContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { EmergencySOS } from './pages/EmergencySOS';
import { LiveLocation } from './pages/LiveLocation';
import { MovementMonitoring } from './pages/MovementMonitoring';
import { MLAnalysisLab } from './pages/MLAnalysisLab';
import { VoiceDetection } from './pages/VoiceDetection';
import { ShakeDetection } from './pages/ShakeDetection';
import { SafeJourney } from './pages/SafeJourney';
import { FakeCall } from './pages/FakeCall';
import { Contacts } from './pages/Contacts';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AboutProject } from './pages/AboutProject';

export default function App() {
  return (
    <BrowserRouter>
      <SafetyProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sos" element={<EmergencySOS />} />
            <Route path="/location" element={<LiveLocation />} />
            <Route path="/movement" element={<MovementMonitoring />} />
            <Route path="/ml-lab" element={<MLAnalysisLab />} />
            <Route path="/voice" element={<VoiceDetection />} />
            <Route path="/shake" element={<ShakeDetection />} />
            <Route path="/journey" element={<SafeJourney />} />
            <Route path="/fake-call" element={<FakeCall />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<AboutProject />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </SafetyProvider>
    </BrowserRouter>
  );
}

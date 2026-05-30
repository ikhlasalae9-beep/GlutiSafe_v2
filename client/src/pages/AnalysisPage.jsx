import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Analyzer from '../components/Analyzer.jsx';
import { onUserScopedStateCleared } from '../lib/userScopedState.js';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [latestResult, setLatestResult] = useState(null);

  useEffect(() => onUserScopedStateCleared(() => setLatestResult(null)), []);

  return <Analyzer latestResult={latestResult} onResult={setLatestResult} onNavigate={navigate} />;
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Analyzer from '../components/Analyzer.jsx';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [latestResult, setLatestResult] = useState(null);

  return <Analyzer latestResult={latestResult} onResult={setLatestResult} onNavigate={navigate} />;
}

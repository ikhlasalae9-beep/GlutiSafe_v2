import Analyzer from '../components/Analyzer.jsx';

export default function AnalyzePage({ latestResult, onResult, onNavigate }) {
  return <Analyzer latestResult={latestResult} onResult={onResult} onNavigate={onNavigate} />;
}

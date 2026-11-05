
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopBar from './components/TopBar'
import FAQ from './components/FAQ'
import ForecastTable from './components/ForecastTable'
import './App.css';

function App() {

  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopBar />
        <Routes>
          <Route path="/" element={<ForecastTable />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App;

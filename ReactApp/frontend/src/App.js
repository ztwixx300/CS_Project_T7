
import { useState } from 'react';
import {
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import './App.css';

function App() {
  const [phase, setPhase] = useState('idle')
  const [forecast, setForecast] = useState([])
  const [postalCode, setPostalCode] = useState()
  async function handlGenerate() {
    setPhase('loading')
    try {
      const response = await fetch('/api/peak_days')
      if (!response.ok) {
        throw new Error(`Server responded with${response.status}`)
      }
      const data = await response.json()
      setForecast(data.forecast)
      setPhase('done')
    } catch (error) {
      console.error(error)
      setPhase('error')
    }
  }

  const isLoading = phase === 'loading'
  const buttonLabel = isLoading ? 'Generating...' : 'Generate Forecast'

  return (
    <div className="splash">
      <h1 className='title'>Air Aware</h1>
      <h2 className='descr'>
        Seven-day air quality forecast for DFW
      </h2>
      <p>Enter a zipcode for an area you are interested in</p>
      <Paper>
        <TextField 
        label="zipCode"
        variant="outlined"
        fullWidth
        value={postalCode}

        >Enter a zipCode</TextField>
        </Paper>
        <p>Testing sample data for a 7 day forecast (shows the highest values for 2025)</p>
        <Button
          variant="contained"
          size="large"
          onClick={handlGenerate}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          sx={{
            backgroundColor: '#4fd1c5',
            color: '#0f2027',
            fontWeight: 500,
            borderRadius: '999px',
            px: 4,
            '&:hover': { backgroundColor: '#81e6d9' },
          }}>
          {buttonLabel}
        </Button>
      {phase === 'error' && (
        <p className="splash-status">
          Could not load the forecast. Is the backend running on port 8000?
        </p>
      )}

      {phase === 'done' && (
        <TableContainer component={Paper} sx={{ mt: 4, maxWidth: 700 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">PM2.5</TableCell>
                <TableCell align="right">Ozone</TableCell>
                <TableCell align="right">CO</TableCell>
                <TableCell align="right">NO2</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecast.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>{day.date}</TableCell>
                  <TableCell align="right">{day.pm25}</TableCell>
                  <TableCell align="right">{day.ozone}</TableCell>
                  <TableCell align="right">{day.co}</TableCell>
                  <TableCell align="right">{day.no2}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default App;

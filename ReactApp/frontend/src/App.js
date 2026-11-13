
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
  Tooltip,
} from "@mui/material";
import './App.css';
function getAirQuality(aqi) {
    if (aqi == null) {return { label: 'Unavailable', color: '#eeeeee' };}
    if (aqi <= 50) {return { label: 'Good', color: '#c8e6c9' };}
    if (aqi <= 100) {return { label: 'Moderate', color: '#fff9c4' };}
    if (aqi <= 150) {return { label: 'Unhealthy Depending', color: '#ffe0b2' };}
    if (aqi <= 200) {return { label: 'Unhealthy', color: '#ffcdd2' };}
    if (aqi <= 300) {return { label: 'Very Unhealthy', color: '#e1bee7' };}
    return { label: 'Hazardous', color: '#d7a0a0' };
}
function App() {
    const [phase, setPhase] = useState('idle');

    const [forecastHistory, setForecastHistory] = useState(() => {
      const savedHistory = sessionStorage.getItem('forecastHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    });

    const [postalCode, setPostalCode] = useState('');
    async function handlGenerate() {
      if (!/^\d{5}$/.test(postalCode)) {
        return;
      }

      setPhase('loading');

      try {
        const response = await fetch('/api/peak_days');

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        const newForecast = {
          id: Date.now(),
          postalCode: postalCode,
          forecast: data.forecast
        };

        setForecastHistory(previous => [
          newForecast,
          ...previous
        ].slice(0, 3));

        setPhase('done');

      } catch (error) {
        console.error(error);
        setPhase('error');
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
          <Paper sx={{ p: 2 }}>
              <TextField
                  label="ZIP Code"
                  variant="outlined"
                  fullWidth
                  value={postalCode}
                  onChange={(event) => {
                      setPostalCode(event.target.value.replace(/\D/g, '').slice(0, 5));
                  }}
                  placeholder="Enter a 5-digit ZIP code"
              />
          </Paper>
        <p>Testing sample data for a 7 day forecast (shows the highest values for 2025)</p>
        <Button
          variant="contained"
          size="large"
          onClick={handlGenerate}
          disabled={isLoading || !/^\d{5}$/.test(postalCode)}
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

          {forecastHistory.map((entry, index) => (
              <TableContainer
                  component={Paper}
                  key={entry.id}
                  sx={{
                      mt: 4,
                      maxWidth: 700,
                      mx: 'auto'
                  }}
              >
                  <div style={{ padding: '8px 16px' }}>
                      <p style={{ margin: 0 }}>
                          <strong>ZIP Code:</strong> {entry.postalCode}

                          {index === 0 && (
                              <span style={{ marginLeft: '12px', color: 'green' }}>
                                  Newest Forecast
                              </span>
                          )}
                      </p>
                  </div>

                  <Table>
                      <TableHead>
                          <TableRow>
                              <TableCell>Date</TableCell>

                              <TableCell align="right">
                                  <Tooltip
                                      title="PM2.5 measures fine airborne particles with a diameter of 2.5 micrometers or smaller. These particles can penetrate deep into the lungs."
                                      placement="top"
                                      followCursor
                                  >
                                      <span>PM2.5</span>
                                  </Tooltip>
                              </TableCell>

                              <TableCell align="right">
                                  <Tooltip
                                      title="Ozone (O3) is a gas that forms near the ground through reactions involving sunlight and other pollutants. High levels can irritate the lungs."
                                      placement="top"
                                      followCursor
                                  >
                                      <span>Ozone</span>
                                  </Tooltip>
                              </TableCell>

                              <TableCell align="right">
                                  <Tooltip
                                      title="Carbon monoxide (CO) is a colorless, odorless gas produced by incomplete combustion, such as from vehicle exhaust."
                                      placement="top"
                                      followCursor
                                  >
                                      <span>CO</span>
                                  </Tooltip>
                              </TableCell>

                              <TableCell align="right">
                                  <Tooltip
                                      title="Nitrogen dioxide (NO2) is a gas primarily produced by fuel combustion, including vehicle engines and power plants. It can irritate the respiratory system."
                                      placement="top"
                                      followCursor
                                  >
                                      <span>NO2</span>
                                  </Tooltip>
                              </TableCell>

                              <TableCell align="right">
                                  <Tooltip
                                      title="The Air Quality Index (AQI) is a scale from 0 to 500 that communicates how healthy or unhealthy the air is. Higher values indicate greater health concerns."
                                      placement="top"
                                      followCursor
                                  >
                                      <span>Overall AQI</span>
                                  </Tooltip>
                              </TableCell>
                          </TableRow>
                      </TableHead>

                      <TableBody>
                          {entry.forecast.map((day) => {
                              const airQuality = getAirQuality(day.overall_aqi);

                              return (
                                  <TableRow
                                      key={day.date}
                                      sx={{
                                          backgroundColor: airQuality.color,
                                          '&:hover': {
                                              filter: 'brightness(0.96)',
                                          },
                                      }}
                                  >
                                      <TableCell>{day.date}</TableCell>
                                      <TableCell align="right">{day.pm25}</TableCell>
                                      <TableCell align="right">{day.ozone}</TableCell>
                                      <TableCell align="right">{day.co}</TableCell>
                                      <TableCell align="right">{day.no2}</TableCell>
                                      <TableCell align="right">
                                          {day.overall_aqi ?? 'N/A'} ({airQuality.label})
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                      </TableBody>
                  </Table>
              </TableContainer>
          ))}

          {forecastHistory.length > 0 && (
              <div className="disclaimer">
                  <p>
                      <strong>Note:</strong> Information provided by this tool is based on publicly available data provided by the following sources and are subject to their terms of use. The tool is intended for informational purposes only and should not be used as a substitute for professional advice or judgment. Users are encouraged to consult official sources for current conditions in their area.
                  </p>

                  <ul>
                      <li>
                          <a
                              href="https://www.epa.gov/outdoor-air-quality-data"
                              target="_blank"
                              rel="noopener noreferrer"
                          >
                              U.S. EPA AirData
                          </a>
                          {' '}- historical air quality monitoring data.
                      </li>
                  </ul>

                  <p className="source-note">
                      Tool made as part of 2026 UT Dallas Capstone.
                  </p>
              </div>
          )}

    </div>
  );
}

export default App;

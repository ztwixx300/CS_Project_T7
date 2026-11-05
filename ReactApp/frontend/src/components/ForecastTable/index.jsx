import { useState } from 'react';
import {
    Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Box
} from "@mui/material";

function ForecastTable() {
    const [phase, setPhase] = useState('idle')
    const [forecast, setForecast] = useState([])
    const [postalCode, setPostalCode] = useState();

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

        <div className="fcTable">
            <div className='zipcode'>
                <h2>Air quality forecast for DFW</h2>
                <p>Enter a zipcode for an area in DFW you are interested in</p>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    justifyContent: 'center',
                }}>
                    <TextField
                        label="zipcode" variant="outlined" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                        sx={{
                            backgroundColor: '#fff',
                            borderRadius: 1,
                            width: 300,
                        }}>
                    </TextField>
                    <Button size="large" disabled={isLoading} sx={{
                        backgroundColor: '#4fd1c5',
                        color: '#0f2027',
                        fontWeight: 500,
                        borderRadius: '990px',
                        px: 4,
                        flexShrink: 0,
                        '$:hover': { backgroundColor: '#81e6d9' }
                    }}>Go </Button>
                </Box>
            </div>
            <p>Test API Call to backend for button below </p>
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
                    Could not load the forecast.
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
export default ForecastTable

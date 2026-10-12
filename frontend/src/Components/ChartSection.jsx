import {
  Box,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { useState } from 'react';
import eating2Gif from '../assets/eating2.gif';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ChartSection = ({ calories }) => {
  const [selectedMetric, setSelectedMetric] = useState('calories');

  const weekdaySums = {
    calories: Array(7).fill(0),
    proteins: Array(7).fill(0),
    carbs: Array(7).fill(0),
    fats: Array(7).fill(0),
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  calories.forEach(entry => {
    const entryDate = new Date(entry.timestamp);
    if (entryDate < startOfWeek || entryDate > endOfWeek) return;

    let day = entryDate.getDay();
    day = (day + 6) % 7;

    const cals = parseFloat(entry.calories) || 0;
    const prots = parseFloat(entry.proteins) || 0;
    const fats = parseFloat(entry.fats) || 0;
    const carbs = parseFloat(entry.carbs) || 0;

    weekdaySums.calories[day] += cals;
    weekdaySums.proteins[day] += prots;
    weekdaySums.fats[day] += fats;
    weekdaySums.carbs[day] += carbs;
  });

  const metricColors = {
    calories: 'rgba(16, 185, 129, 0.75)',
    proteins: 'rgba(2, 210, 227, 0.75)',
    carbs: 'rgba(245, 158, 11, 0.75)',
    fats: 'rgba(132, 204, 22, 0.75)',
  };

  const chartData = {
    labels: weekdays,
    datasets: [
      {
        label: `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} per day`,
        data: weekdaySums[selectedMetric],
        backgroundColor: metricColors[selectedMetric] || 'rgba(16, 185, 129, 0.75)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(14, 18, 20, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        borderWidth: 1
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#e6e8eb'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#e6e8eb'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        title: {
          display: true,
          text:
            selectedMetric === 'calories'
              ? 'Calories (kcal)'
              : `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} (g)`,
          color: '#e6e8eb',
          font: {
            size: 14,
            weight: '600'
          }
        },
      },
    },
  };

  const isChartEmpty = weekdaySums[selectedMetric].every(val => val === 0);

  return (
    <Box my={4}>
      <Select
        value={selectedMetric}
        onChange={(e) => setSelectedMetric(e.target.value)}
        size="small"
        sx={{
          mb: 2,
          minWidth: { xs: '120px', sm: 180 },
          backgroundColor: 'rgba(14, 18, 20, 0.8)',
          color: '#e6e8eb',
          borderRadius: '0.75rem',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(16, 185, 129, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#10b981',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
          },
          '& .MuiSvgIcon-root': {
            color: '#9ca3af',
          }
        }}
      >
        <MenuItem value="calories">Calories</MenuItem>
        <MenuItem value="proteins">Proteins</MenuItem>
        <MenuItem value="carbs">Carbs</MenuItem>
        <MenuItem value="fats">Fats</MenuItem>
      </Select>

      <Paper elevation={3}
        sx={{
          p: 2,
          maxWidth: 600,
          mx: 'auto',
          opacity: 0.9,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        {isChartEmpty ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            textAlign: 'center',
            opacity: 0.8
          }}>
            <img
              src={eating2Gif}
              alt="No data yet"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
              }}
            />
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>No data for this week</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Log your meals to see your progress!</p>
            </div>
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </Paper>
    </Box>
  );
};

export default ChartSection;
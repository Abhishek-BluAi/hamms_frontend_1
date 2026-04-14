"use client";
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Mock data for visits
const MOCK_VISITS = [
  { id: 1, entry_time: '2024-01-30T08:30:00Z', entry_gate_id: 1, EntryGate: { name: 'Gate 1' } },
  { id: 2, entry_time: '2024-01-30T09:15:00Z', entry_gate_id: 2, EntryGate: { name: 'Gate 2' } },
  { id: 3, entry_time: '2024-01-30T10:00:00Z', entry_gate_id: 1, EntryGate: { name: 'Gate 1' } },
  { id: 4, entry_time: '2024-01-30T11:30:00Z', entry_gate_id: 3, EntryGate: { name: 'Gate 3' } },
  { id: 5, entry_time: '2024-01-30T12:45:00Z', entry_gate_id: 2, EntryGate: { name: 'Gate 2' } },
  { id: 6, entry_time: '2024-01-30T14:00:00Z', entry_gate_id: 4, EntryGate: { name: 'Gate 4' } },
  { id: 7, entry_time: '2024-01-30T15:30:00Z', entry_gate_id: 1, EntryGate: { name: 'Gate 1' } },
  { id: 8, entry_time: '2024-01-30T16:15:00Z', entry_gate_id: 2, EntryGate: { name: 'Gate 2' } },
  { id: 9, entry_time: '2024-01-30T17:00:00Z', entry_gate_id: 3, EntryGate: { name: 'Gate 3' } },
  { id: 10, entry_time: '2024-01-30T18:30:00Z', entry_gate_id: 4, EntryGate: { name: 'Gate 4' } },
  { id: 11, entry_time: '2024-01-30T08:45:00Z', entry_gate_id: 1, EntryGate: { name: 'Gate 1' } },
  { id: 12, entry_time: '2024-01-30T09:30:00Z', entry_gate_id: 2, EntryGate: { name: 'Gate 2' } },
  { id: 13, entry_time: '2024-01-30T11:00:00Z', entry_gate_id: 1, EntryGate: { name: 'Gate 1' } },
  { id: 14, entry_time: '2024-01-30T13:30:00Z', entry_gate_id: 3, EntryGate: { name: 'Gate 3' } },
  { id: 15, entry_time: '2024-01-30T14:45:00Z', entry_gate_id: 2, EntryGate: { name: 'Gate 2' } },
];

const TrafficCharts = () => {
  const [barData, setBarData] = useState({ labels: [], datasets: [] });
  const [lineData, setLineData] = useState({ labels: [], datasets: [] });
  const [isLoading, setIsLoading] = useState(false); // Set to false since we have mock data
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    const processMockData = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check auth session (keeping only for redirect logic)
        const userSession = JSON.parse(localStorage.getItem("adminSession"));
        if (!userSession || !userSession.token || (userSession.roles?.length === 1 && userSession.roles[0].name === "guard")) {
          // If you need to redirect, do it here
          return;
        }

        // Use mock data instead of API call
        const visits = MOCK_VISITS;

        // Filter by selected date (in mock data, all are for today's date)
        const filteredVisits = visits.filter(visit => {
          const entryDate = dayjs(visit.entry_time).format('YYYY-MM-DD');
          return entryDate === selectedDate;
        });

        /** ===== BAR CHART (By Gate) ===== **/
        const gateOrder = ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4'];
        const gateCounts = Object.fromEntries(gateOrder.map(g => [g, 0]));
        filteredVisits.forEach(visit => {
          const gate = visit?.EntryGate?.name || `Gate ${visit?.entry_gate_id || 'Unknown'}`;
          if (gateCounts.hasOwnProperty(gate)) {
            gateCounts[gate]++;
          }
        });

        setBarData({
          labels: gateOrder,
          datasets: [{
            label: `Traffic by Gate (${selectedDate})`,
            data: gateOrder.map(g => gateCounts[g]),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }]
        });

        /** ===== LINE CHART (By Hour) ===== **/
        const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const hourlyCounts = Array(24).fill(0);

        filteredVisits.forEach(visit => {
          const hour = dayjs(visit.entry_time).hour();
          hourlyCounts[hour]++;
        });

        setLineData({
          labels: hourLabels,
          datasets: [{
            label: `Visitors per Hour (${selectedDate})`,
            data: hourlyCounts,
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            tension: 0.4,
          }]
        });

      } catch (error) {
        console.error('Error processing mock data:', error.message);
        setError('Failed to process chart data');
      } finally {
        setIsLoading(false);
      }
    };

    processMockData();
  }, [selectedDate]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Visitor Traffic by Gate (${selectedDate})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        title: { display: true, text: 'Number of Visits' },
      },
      x: { title: { display: true, text: 'Gates' } }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Visitor Traffic by Time (${selectedDate})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        title: { display: true, text: 'Number of Visitors' }
      },
      x: {
        title: { display: true, text: 'Hour of Day' }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* BAR CHART */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Visitor Traffic by Gate</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="p-4">
          <div className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>
      </div>

      {/* LINE CHART */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Visitor Traffic by Time</h2>
        </div>
        <div className="p-4">
          <div className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : (
              <Line data={lineData} options={lineOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficCharts;
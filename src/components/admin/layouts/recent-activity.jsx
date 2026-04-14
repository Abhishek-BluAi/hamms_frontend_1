'use client';
import { useEffect, useState, useMemo } from 'react';

// ✅ ShadCN calendar imports
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";

// ✅ Activity color logic
const getActivityClass = (activityType) => {
  if (!activityType || typeof activityType !== 'string') {
    return 'bg-gray-100 text-gray-800';
  }

  switch (activityType.toLowerCase()) {
    case 'entry':
      return 'bg-green-100 text-green-800';
    case 'exit':
      return 'bg-red-100 text-red-800';
    case 'delivery':
      return 'bg-blue-100 text-blue-800';
    case 'pickup':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ✅ Mock data for activities
const MOCK_ACTIVITIES = [
  {
    id: 1,
    entry_time: '2024-01-30T09:30:00Z',
    exit_time: '2024-01-30T11:30:00Z',
    status: 'completed',
    entry_gate_id: 1,
    EntryGate: { name: 'Gate 1' },
    Visitor: { first_name: 'John', last_name: 'Doe', Company: { name: 'Tech Corp' } },
    Deliveries: []
  },
  {
    id: 2,
    entry_time: '2024-01-30T10:15:00Z',
    exit_time: null,
    status: 'active',
    entry_gate_id: 2,
    EntryGate: { name: 'Gate 2' },
    Visitor: { first_name: 'Jane', last_name: 'Smith', Company: { name: 'Business Inc' } },
    Deliveries: []
  },
  {
    id: 3,
    entry_time: '2024-01-30T11:00:00Z',
    exit_time: null,
    status: 'active',
    entry_gate_id: 3,
    EntryGate: { name: 'Gate 3' },
    Visitor: { first_name: 'Robert', last_name: 'Johnson', Company: { name: 'Delivery Express' } },
    Deliveries: [{ type: 'delivery' }]
  },
  {
    id: 4,
    entry_time: '2024-01-30T08:45:00Z',
    exit_time: '2024-01-30T10:00:00Z',
    status: 'completed',
    entry_gate_id: 1,
    EntryGate: { name: 'Gate 1' },
    Visitor: { first_name: 'Sarah', last_name: 'Williams', Company: { name: 'Consulting Group' } },
    Deliveries: []
  },
  {
    id: 5,
    entry_time: '2024-01-30T13:30:00Z',
    exit_time: null,
    status: 'active',
    entry_gate_id: 4,
    EntryGate: { name: 'Gate 4' },
    Visitor: { first_name: 'Mike', last_name: 'Brown', Company: { name: 'Vendor Ltd' } },
    Deliveries: [{ type: 'pickup' }]
  },
  {
    id: 6,
    entry_time: '2024-01-29T14:15:00Z',
    exit_time: '2024-01-29T15:30:00Z',
    status: 'completed',
    entry_gate_id: 2,
    EntryGate: { name: 'Gate 2' },
    Visitor: { first_name: 'Emma', last_name: 'Wilson', Company: { name: 'Finance Corp' } },
    Deliveries: []
  },
];

// ✅ Inline DatePickerComponent (ShadCN)
function DatePickerComponent({ selectedDate, setSelectedDate }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-sm px-3 py-1.5 md:py-1 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2 w-full md:w-auto justify-center md:justify-start"
          onClick={() => setOpen(!open)}
        >
          <CalendarIcon className="h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-white" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ✅ Mobile activity card component
const MobileActivityCard = ({ activity }) => (
  <div className="bg-gray-50 rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{activity.visitor}</span>
          <span className={`px-2 py-0.5 ${activity.activityClass} rounded-full text-xs`}>
            {activity.activity}
          </span>
        </div>
        <p className="text-sm text-gray-600">{activity.company}</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">{activity.time}</div>
        <div className="text-xs text-gray-500">{activity.date}</div>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-200 pt-2">
      <div className="flex items-center gap-1">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span>{activity.gate}</span>
      </div>
    </div>
  </div>
);

const RecentActivity = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check auth session
  useEffect(() => {
    try {
      const userSession = JSON.parse(localStorage.getItem('adminSession'));
      if (!userSession || !userSession.token || (userSession.roles?.length === 1 && userSession.roles[0].name === "guard")) {
        // If you need to redirect, do it here
        return;
      }
    } catch (err) {
      console.error('Error loading session:', err.message);
    }
  }, []);

  // Check for mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Use useMemo to compute activities without causing cascading renders
  const activities = useMemo(() => {
    // Filter data based on showAll and selectedDate
    const filteredData = showAll ? MOCK_ACTIVITIES : MOCK_ACTIVITIES.filter((visit) => {
      const selectedDateString = selectedDate.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata'
      });
      const visitDate = new Date(visit.entry_time).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata'
      });
      return visitDate === selectedDateString;
    });

    // Transform the filtered data
    return filteredData.map((visit) => {
      let activityType;
      if (visit.entry_time && visit.exit_time) {
        activityType = visit.status === 'completed' ? 'Exit' : 'Entry';
      } else {
        activityType = visit.Deliveries?.[0]?.type || 'Entry';
      }

      return {
        date: new Date(visit.exit_time || visit.entry_time).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        }),
        time: new Date(visit.exit_time || visit.entry_time).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }),
        gate: visit?.EntryGate?.name || `Gate ${visit.entry_gate_id || 'N/A'}`,
        visitor: `${visit.Visitor?.first_name || 'Unknown'} ${visit.Visitor?.last_name || ''}`.trim(),
        company: visit.Visitor?.Company?.name || 'N/A',
        activity: activityType,
        activityClass: getActivityClass(activityType),
      };
    });
  }, [selectedDate, showAll]);

  return (
    <div className="mt-6 bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h2 className="text-lg font-semibold text-center md:text-left">Recent Activity</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1 w-full sm:w-auto justify-center"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  View All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4">
        {isMobile ? (
          // Mobile view - Cards
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <MobileActivityCard key={index} activity={activity} />
            ))}
            {activities.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No activity found.
              </div>
            )}
          </div>
        ) : (
          // Desktop view - Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activities.map((activity, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{activity.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{activity.time}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{activity.gate}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{activity.visitor}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{activity.company}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 ${activity.activityClass} rounded-full text-xs`}>
                        {activity.activity}
                      </span>
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-4">
                      No activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
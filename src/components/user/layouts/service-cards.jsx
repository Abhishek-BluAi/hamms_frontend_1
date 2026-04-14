'use client'

import { useRouter } from 'next/navigation';
import { Package, Upload } from 'lucide-react';

export default function ServiceCards() {
  const router = useRouter();

  const services = [
    {
      id: 'incoming-delivery',
      title: 'Incoming Delivery',
      description: 'Bringing supplies, medicines, or equipment to the hospital',
      icon: <Package className="w-6 h-6" />,
      route: '/security-portal/delivery-pickup',
    },
    {
      id: 'pickup-service',
      title: 'Pickup Service',
      description: 'Collecting items, samples, or documents from the hospital',
      icon: <Upload className="w-6 h-6" />,
      route: '/security-portal/delivery-pickup',
    },
  ];

  const handleCardClick = (route) => {
    router.push(route);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {services.map((service) => (
        <div
          key={service.id}
          onClick={() => handleCardClick(service.route)}
          className="group relative p-6 rounded-2xl border-2 border-gray-200 bg-white cursor-pointer transition-all duration-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md"
        >
          {/* Header with Icon and Radio Button */}
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-orange-50 transition-colors duration-200">
              <div className="text-gray-400 group-hover:text-orange-500 transition-colors duration-200">
                {service.icon}
              </div>
            </div>
            
            {/* Radio Button Indicator */}
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-orange-500 flex items-center justify-center transition-colors duration-200">
              <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-orange-500 transition-colors duration-200" />
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {service.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {service.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PotholeReport } from '../types/database.types';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  reports: PotholeReport[];
  filter: 'all' | 'reported' | 'in-progress' | 'resolved';
}

const Map: React.FC<MapProps> = ({ reports, filter }) => {
  const getStatusColor = (status: PotholeReport['status']) => {
    switch (status) {
      case 'reported': return '#ef4444';
      case 'in-progress': return '#f59e0b';
      case 'resolved': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const customIcon = (status: PotholeReport['status']) => new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${getStatusColor(status)};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.status === filter);

  useEffect(() => {
    const map = document.querySelector('.leaflet-map-container') as HTMLElement;
    if (map) {
      map.style.width = '100%';
      map.style.height = '500px';
    }
  }, []);

  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={12}
      className="w-full h-[500px] rounded-lg shadow-lg z-0"
      style={{ background: '#f5f5f5' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filteredReports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={customIcon(report.status)}
        >
          <Popup className="custom-popup">
            <div className="p-2">
              <h3 className="font-bold text-lg">{report.severity.toUpperCase()} Severity</h3>
              <p className="text-gray-700">{report.description}</p>
              <p className="text-sm text-gray-600 mt-1">Status: {report.status}</p>
              <img 
                src={report.image_url} 
                alt="Pothole" 
                className="mt-2 w-full max-w-[200px] rounded-lg shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reported: {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
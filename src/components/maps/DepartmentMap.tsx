import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Complaint } from '../../data/mockData';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker for department cases (colored by priority)
const getPriorityIcon = (priority: string) => {
  let color = '#3b82f6'; // Medium - Blue
  if (priority === 'Urgent') color = '#dc2626'; // Red
  if (priority === 'High') color = '#f97316'; // Orange
  if (priority === 'Low') color = '#64748b'; // Slate

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);" class="animate-pulse"></div>`,
    className: 'custom-priority-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

interface DepartmentMapProps {
  complaints: Complaint[];
  onSelectComplaint?: (complaint: Complaint) => void;
}

const DepartmentMap: React.FC<DepartmentMapProps> = ({ complaints, onSelectComplaint }) => {
  const defaultPosition: [number, number] = [40.7128, -74.0060];

  return (
    <div className="w-full h-full min-h-[350px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {complaints.map((c) => {
          const lat = Number(c.latitude || c.location_lat || 40.7128);
          const lng = Number(c.longitude || c.location_lng || -74.0060);

          return (
            <Marker 
              key={c.complaint_id} 
              position={[lat, lng]} 
              icon={getPriorityIcon(c.priority)}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1 min-w-[170px]">
                  <div className="flex justify-between items-center text-[9px] font-black">
                    <span className="text-slate-400 font-mono">{c.complaint_id}</span>
                    <span className="uppercase px-1.5 py-0.25 bg-slate-100 rounded text-slate-700">{c.status}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 leading-tight m-0">{c.title}</h4>
                  <p className="text-slate-500 m-0 text-[10px]">Priority: <strong className="text-slate-700">{c.priority}</strong></p>
                  <p className="text-slate-500 m-0 text-[10px] truncate">Address: {c.address || c.location_address}</p>
                  {onSelectComplaint && (
                    <button 
                      onClick={() => onSelectComplaint(c)}
                      className="w-full mt-2 py-1 bg-teal-600 hover:bg-teal-750 text-white font-extrabold rounded text-[9px] uppercase transition-colors"
                    >
                      Inspect Case
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default DepartmentMap;

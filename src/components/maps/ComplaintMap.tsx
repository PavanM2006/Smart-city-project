import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Complaint } from '../../data/mockData';

// Secure Leaflet default marker icons using unpkg CDN
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Category Marker Icons using dynamic Leaflet DivIcons
const getCategoryIcon = (category: string) => {
  let color = '#3b82f6'; // Blue
  if (category === 'Road Damage') color = '#ef4444'; // Red
  if (category === 'Garbage') color = '#10b981'; // Green
  if (category === 'Electricity' || category === 'Street Light') color = '#f59e0b'; // Amber
  if (category === 'Drainage') color = '#a855f7'; // Purple

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.35);" class="animate-pulse"></div>`,
    className: 'custom-category-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

interface ComplaintMapProps {
  complaints: Complaint[];
  onSelectComplaint?: (id: string) => void;
}

const ComplaintMap: React.FC<ComplaintMapProps> = ({ complaints, onSelectComplaint }) => {
  const position: [number, number] = [40.7128, -74.0060];

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
      <MapContainer 
        center={position} 
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
              icon={getCategoryIcon(c.category)}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1.5 min-w-[170px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] font-black text-slate-400">{c.complaint_id}</span>
                    <span className="text-[9px] uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-extrabold">{c.status}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 leading-tight m-0">{c.title}</h4>
                  <p className="text-slate-500 m-0 text-[10px]">Category: <strong className="text-slate-750">{c.category}</strong></p>
                  <p className="text-slate-500 m-0 text-[10px] truncate">Location: {c.address || c.location_address}</p>
                  {onSelectComplaint && (
                    <button 
                      onClick={() => onSelectComplaint(c.complaint_id)}
                      className="w-full mt-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded text-[9px] uppercase transition-all cursor-pointer"
                    >
                      Track Details
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

export default ComplaintMap;

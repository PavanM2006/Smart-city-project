import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChangeLocation: (lat: number, lng: number, address: string) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onChangeLocation }) => {
  const [currentMarker, setCurrentMarker] = useState<[number, number]>([lat, lng]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Sync state if coordinates change from parent (like browser Geolocation triggers)
  useEffect(() => {
    setCurrentMarker([lat, lng]);
  }, [lat, lng]);

  // Keep the map view centered on the latest coordinates
  const RecenterMap = () => {
    const map = useMap();
    useEffect(() => {
      map.invalidateSize({ animate: true });
      map.setView([lat, lng], map.getZoom(), { animate: true });
      const timer = window.setTimeout(() => map.invalidateSize(), 200);
      return () => window.clearTimeout(timer);
    }, [lat, lng, map]);
    return null;
  };

  // Click handler wrapper component for Leaflet
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        setCurrentMarker([clickedLat, clickedLng]);
        
        // Reverse Geocoding via Nominatim OpenStreetMap API
        setIsReverseGeocoding(true);
        let address = `Coordinates: Lat ${clickedLat}, Lng ${clickedLng}`;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLat}&lon=${clickedLng}&zoom=18&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              address = data.display_name;
            }
          }
        } catch (err) {
          console.warn('[OSM Geocoder] Reverse geocoding request failed. Snapping coordinates.', err);
        } finally {
          setIsReverseGeocoding(false);
          onChangeLocation(clickedLat, clickedLng, address);
        }
      }
    });
    return null;
  };

  return (
    <div className="w-full aspect-square min-h-[350px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
      
      {/* Map loading overlay */}
      {isReverseGeocoding && (
        <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center text-xs font-bold text-slate-700">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Reverse Geocoding Street Address...</span>
          </div>
        </div>
      )}

      <MapContainer 
        center={[lat, lng]} 
        zoom={14} 
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap />
        <MapClickHandler />
        <Marker position={currentMarker} />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;

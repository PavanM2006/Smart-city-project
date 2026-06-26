import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Upload, Send, HelpCircle, ArrowLeft, Loader, X } from 'lucide-react';
import apiClient from '../services/api';
import LocationPicker from '../components/maps/LocationPicker';

const ComplaintForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Water Supply');
  const [priority, setPriority] = useState('Medium');
  
  // Maps location state: Snapped center
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [address, setAddress] = useState('425 Oak Avenue, Central District, SmartCity');
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Handle browser Geolocation Satellite GPS queries
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser Geolocation API is not supported by your client.');
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const detectedLat = Number(position.coords.latitude.toFixed(6));
        const detectedLng = Number(position.coords.longitude.toFixed(6));
        
        setLatitude(detectedLat);
        setLongitude(detectedLng);
        
        // Snap Address via reverse geocoding
        let reverseGeocoded = `Coordinates: Lat ${detectedLat}, Lng ${detectedLng}`;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${detectedLat}&lon=${detectedLng}&zoom=18&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              reverseGeocoded = data.display_name;
            }
          }
        } catch (e) {
          console.warn('[OSM Geocoder] Satellite reverse lookup failed.', e);
        }

        setAddress(reverseGeocoded);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setError(`GPS detection failed: ${err.message}. Please select coordinates on the map manually.`);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please provide a title and detailed description.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Form Data wrapping for Multer support
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('address', address);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // POST /api/complaints
      const response = await apiClient.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success) {
        // Redirect back to dashboard upon success
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-slate-700"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600 animate-pulse" /> File a Civic Grievance
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Fill details, snap geo-coordinates, and attach photo evidence</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold">
          {error}
        </div>
      )}

      {/* Grid Layout: Left form inputs, Right interactive OSM Leaflet Picker */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Form */}
        <div className="lg:col-span-3 bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5 font-bold text-xs">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Grievance Title</label>
              <input 
                type="text" 
                placeholder="e.g. Severely cracked asphalt posing threat on Oak Avenue" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold transition-all"
                required
              />
            </div>

            {/* Category & Priority */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Category Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-bold transition-all"
                >
                  <option value="Water Supply">Water Supply</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Drainage">Drainage</option>
                  <option value="Street Light">Street Light</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Severity Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-bold transition-all"
                >
                  <option value="Low">Low (Routine SLA)</option>
                  <option value="Medium">Medium (Normal SLA)</option>
                  <option value="High">High (Urgent Dispatch)</option>
                  <option value="Urgent">Urgent (Immediate Danger)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Detailed Description</label>
              <textarea 
                rows={4}
                placeholder="Mention landmarks, how long the issue has persisted, and if it impacts public safety..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold transition-all resize-none"
                required
              />
            </div>

            {/* Evidence Uploader */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Evidence Photo (Multer Upload Limits: 5MB)</label>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center transition-all cursor-pointer relative bg-slate-50/40 group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-slate-500">
                    <Upload className="w-7 h-7 text-slate-400 mx-auto group-hover:scale-105 transition-transform" />
                    <p className="text-xs font-black text-slate-700">Attach Evidence Photo</p>
                    <p className="text-[9px] text-slate-400 font-bold">JPEG, PNG, WEBP</p>
                  </div>
                </div>

                {/* Previews or Fallbacks */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Upload Requirements</span>
                  </div>
                  <p className="text-slate-400 leading-normal font-semibold">Photographs must show clear visual details of the damage. Geotags are auto-matched with selected coordinates.</p>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-250 shadow-inner mt-3 animate-fade-in">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 p-1 bg-slate-900/85 text-white rounded-full hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Snipped coordinates info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Latitude</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{latitude}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Longitude</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{longitude}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="w-full h-full px-2 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-blue-450 rounded-xl font-black text-[9px] uppercase text-blue-600 flex items-center justify-center gap-1 shadow-xs transition-all disabled:opacity-50"
                >
                  {isLocating ? <Loader className="w-3.5 h-3.5 animate-spin shrink-0" /> : <MapPin className="w-3.5 h-3.5 shrink-0" />} 
                  {isLocating ? 'Locating...' : 'GPS Auto'}
                </button>
              </div>
              
              <div className="col-span-3 border-t border-slate-200/60 pt-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">OSM Snapped Address</span>
                <p className="text-slate-700 font-extrabold leading-relaxed mt-0.5">{address}</p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4 h-4" />}
              {isLoading ? 'Submitting Grievance...' : 'Submit Grievance & Dispatch Alerts'}
            </button>

          </form>
        </div>

        {/* Right Map Location Picker */}
        <div className="lg:col-span-2 space-y-4 z-0">
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4.5 h-4.5 text-blue-600" /> OSM Geocoder Map
              </h3>
              <p className="text-[9px] text-slate-400 font-bold">Click coordinates anywhere on the city layout to snap pin</p>
            </div>
            
            <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <LocationPicker 
                lat={latitude} 
                lng={longitude} 
                onChangeLocation={(lat, lng, addr) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  setAddress(addr);
                }} 
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ComplaintForm;

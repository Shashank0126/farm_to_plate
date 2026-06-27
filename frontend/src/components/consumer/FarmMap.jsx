import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

export default function FarmMap({ lat, lng, farmerName, location, height = '260px' }) {
  if (!lat || !lng) {
    return (
      <div
        className="glass rounded-2xl flex items-center justify-center text-white/30 text-sm"
        style={{ height }}
      >
        No location data
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={[lat, lng]} radius={800} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08 }} />
        <Marker position={[lat, lng]} icon={greenIcon}>
          <Popup>
            <div className="text-xs">
              <strong>{farmerName || 'Farm'}</strong><br />
              {location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

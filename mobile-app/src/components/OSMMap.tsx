import React, { useRef, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface OSMMapProps {
    center?: { lat: number; lng: number };
    markers?: Array<{ lat: number; lng: number; title?: string; color?: string }>;
    route?: Array<{ lat: number; lng: number }>;
}

const OSMMap = ({ center, markers = [], route = [] }: OSMMapProps) => {
    const webViewRef = useRef<WebView>(null);

    // Default to Kano, Nigeria if no center provided
    const mapCenter = center || { lat: 12.0022, lng: 8.5920 };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
          body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
          #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], 13);
          
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(map);

          var markersLayer = L.layerGroup().addTo(map);
          var routeLayer = L.layerGroup().addTo(map);

          function updateMap(data) {
            // Update Center
            if (data.center) {
              map.setView([data.center.lat, data.center.lng]);
            }

            // Update Markers
            markersLayer.clearLayers();
            if (data.markers) {
              data.markers.forEach(m => {
                const marker = L.marker([m.lat, m.lng]).addTo(markersLayer);
                if (m.title) marker.bindPopup(m.title);
                if (m.title === 'Pickup') marker.openPopup();
              });
            }

            // Update Route (Polyline)
            routeLayer.clearLayers();
            if (data.route && data.route.length > 0) {
              const latlngs = data.route.map(p => [p.lat, p.lng]);
              const polyline = L.polyline(latlngs, {color: 'blue', weight: 4}).addTo(routeLayer);
              map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
            }
          }

          // Initial load
          updateMap(${JSON.stringify({ center: mapCenter, markers, route })});

          // Handle messages from React Native
          document.addEventListener('message', function(event) {
             const data = JSON.parse(event.data);
             updateMap(data);
          });
          window.addEventListener('message', function(event) {
             const data = JSON.parse(event.data);
             updateMap(data);
          });
        </script>
      </body>
    </html>
  `;

    useEffect(() => {
        if (webViewRef.current) {
            const data = JSON.stringify({ center, markers, route });
            webViewRef.current.postMessage(data);
            // Also try injecting JS directly for reliability
            webViewRef.current.injectJavaScript(`updateMap(${data}); true;`);
        }
    }, [center, markers, route]);

    return (
        <View style={{ flex: 1, overflow: 'hidden' }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                }}
            />
        </View>
    );
};

export default OSMMap;

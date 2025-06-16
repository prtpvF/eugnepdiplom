export async function getImageMap(lon, lat, imageUrl, mapElementId) {

    const elementId = mapElementId !== undefined ? mapElementId : 'map';
    const mapElement = document.getElementById(elementId);

    if (!mapElement || !mapElement.offsetParent) {
        console.error('Map container not found or not visible:', elementId);
        return;
    }


    if (!mapElement || !mapElement.offsetParent) {
        console.error('Map container not found or not visible');
        return;
    }

    mapElement.style.height = '200px';

    const map = L.map(mapElement).setView([lat, lon], 11);

    var isRetina = L.Browser.retina;
    const baseUrl = 'https://maps.geoapify.com/v1/tile/{mapStyle}/{z}/{x}/{y}.png?apiKey=86ad74aa384547249f62827e4a190907';
    const retinaUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=86ad74aa384547249f62827e4a190907";

    try {
        L.tileLayer(
            isRetina ? retinaUrl : baseUrl, {
                mapStyle: 'osm-bright',
                apiKey: '86ad74aa384547249f62827e4a190907',
                maxZoom: 20,
                attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>'
            }).addTo(map);

        if(imageUrl) {
            const customIcon = L.icon({
                iconUrl: imageUrl,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });

            L.marker([lat, lon], { icon: customIcon }).addTo(map)
                .openPopup();
        } else {
            L.marker([lat, lon]).addTo(map)
                .openPopup();
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 0);
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    } catch (error) {
        console.error('Map initialization error:', error);
    }
}
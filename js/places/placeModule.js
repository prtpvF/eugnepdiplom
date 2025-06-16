import { showError } from 'http://localhost:8080/fe/errorMessageModule.js';
import { getImageMap } from 'http://localhost:8080/fe/map.js';

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await axios.get('http://localhost:8081/place/allWithImages');
        console.log(response);
        const places = response.data;
        renderPlaces(places);
    } catch (error) {
        showError(error);
    }
});

function renderPlaces(places) {
    const container = document.getElementById('placesContainer');
    container.innerHTML = '';

    places.forEach(place => {
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';

        const placeImage = document.createElement('img');
        placeImage.onclick = function() {
            try {
                if (!place.placeId) {
                    throw new Error('placeId is required');
                }
                localStorage.setItem('placeId', place.placeId);
                window.location.href = 'http://localhost:8080/fe/pages/places/images.html';

            } catch (error) {
                console.error('Navigation error:', error);
            }
        };
        placeImage.className = 'place-image';
        placeImage.src = place.images[0];
        placeImage.alt = place.name;
        // placeImage.onerror = () => {
        //     placeImage.src = 'https://via.placeholder.com/300x200?text=No+Image';
        // };

        // Информация о месте
        const placeInfo = document.createElement('div');
        placeInfo.className = 'place-info';

        const placeName = document.createElement('h3');
        placeName.className = 'place-name';
        placeName.textContent = place.name;

        const mapContainer = document.createElement('div');
        mapContainer.className = 'place-map';
        mapContainer.id = `map-${place.id}`;

        placeInfo.appendChild(placeName);
        placeCard.appendChild(placeImage);
        placeCard.appendChild(placeInfo);
        placeCard.appendChild(mapContainer);
        container.appendChild(placeCard);

        setTimeout(() => {
            getImageMap(
                place.lon,
                place.lat,
                place.images[0] || 'https://via.placeholder.com/40x40?text=Place',
                `map-${place.id}`
            );
        }, 100);
    });
}
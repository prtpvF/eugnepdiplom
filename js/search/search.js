// search.js
import { getImageMap } from "map";
import { API_CONFIG } from '../../constants';

let currentGroup = 0;
let totalGroups = 0;
let imageUrls = [];
let itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
let prevBtn, nextBtn, container;
let placeName = document.getElementById("placeName");
let map = document.getElementById("map");
let mapContainer = document.getElementById("mapContainer");
let errorToast = document.getElementById("error-toast");

    async function loadSearchResults(value) {
        try {
            const response = await fetch(API_CONFIG.BASE_URL+`/place/findByParam?value=${value}`);


            if (!response.ok) {
                errorToast.style.display = "block";
                throw new Error('Ошибка загрузки результатов');
            }


            const data = await response.json();
            placeName.innerText = data?.suburb ? 'Фотографии с места: ' + data.suburb : 'Фотографии с места: ' + data.name;
            placeName.style.display = 'block';
            map.style.display = 'block';
            mapContainer.style.display = 'block';
            console.log(data);
            updateMap(data);
            createCarousel(data.images || []);
        } catch (error) {
            errorToast.style.display = "block";
            console.error('Ошибка:', error);

        }
    }

    function updateMap(search) {
        const mapContainer = document.getElementById('map');
        if (!mapContainer._leaflet_map) {
            getImageMap(search.lon, search.lat, null, 'map');
        } else {
            const map = mapContainer._leaflet_map;
            map.setView([search.lat, search.lon]);
        }
    }

    function createCarousel(imageUrls) {
        container = document.getElementById('multi-image-container');
        prevBtn = document.querySelector('.prev-btn');
        nextBtn = document.querySelector('.next-btn');

        container.innerHTML = '';
        container.classList.remove('one-image', 'two-images');

        if (!imageUrls || imageUrls.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'multi-image-item';
            placeholder.innerHTML = '<p>No images available</p>';
            container.appendChild(placeholder);

            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        if (imageUrls.length === 1) {
            container.classList.add('one-image');
        } else if (imageUrls.length === 2) {
            container.classList.add('two-images');
        }

        imageUrls.forEach(url => {
            const item = document.createElement('div');
            item.className = 'multi-image-item';

            const img = document.createElement('img');
            img.src = url;
            img.alt = 'No Image';

            item.appendChild(img);
            container.appendChild(item);
        });

        const itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
        totalGroups = Math.ceil(imageUrls.length / itemsPerGroup);
        currentGroup = 0;
        updateButtonStates();
        scrollToGroup(currentGroup);

    }

    document.querySelector('.prev-btn').addEventListener('click', () => {
        if (currentGroup > 0) {
            currentGroup--;
            scrollToGroup(currentGroup);
            updateButtonStates();
        }
    });

    document.querySelector('.next-btn').addEventListener('click', () => {
        if (currentGroup < totalGroups - 1) {
            currentGroup++;
            scrollToGroup(currentGroup);
            updateButtonStates();
        }
    });


    function updateButtonStates() {
        prevBtn.disabled = currentGroup === 0;
        nextBtn.disabled = currentGroup >= totalGroups - 1;

        if (prevBtn.disabled) {
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }

        if (nextBtn.disabled) {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }

    function scrollToGroup(groupIndex) {
        const items = container.querySelectorAll('.multi-image-item');
        const itemWidth = items[0].offsetWidth + 15; // width + gap

        container.scrollTo({
            left: groupIndex * itemsPerGroup * itemWidth,
            behavior: 'smooth'
        });
    }

    window.addEventListener('resize', () => {
        const newItemsPerGroup = window.innerWidth < 768 ? 2 : 3;
        totalGroups = Math.ceil(imageUrls.length / newItemsPerGroup);
        scrollToGroup(currentGroup);
        updateButtonStates();
    });


document.addEventListener('DOMContentLoaded', async() => {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('query') || '';
    console.log(value);
    await loadSearchResults(value);
});
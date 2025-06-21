import { getImageMap } from 'https://effortless-douhua-d77333.netlify.app/map.js';
import { API_CONFIG } from 'https://effortless-douhua-d77333.netlify.app/constants.js'

let currentPage = 0;
const pageSize = 1; // судя по твоему примеру, размер страницы 1
let totalPages = 0;

let imageUrls = [];
let itemsPerGroup = window.innerWidth < 768 ? 2 : 3;

let prevBtn, nextBtn, container;
const placeName = document.getElementById("placeName");
const map = document.getElementById("map");
const mapContainer = document.getElementById("mapContainer");
const errorToast = document.getElementById("error-toast");

async function loadSearchResults(value) {
    try {
        const response = await fetch(
            API_CONFIG.BASE_URL + `/place/findByParam?value=${encodeURIComponent(value)}&page=${currentPage}&size=${pageSize}`
        );

        if (!response.ok) {
            throw new Error('Ошибка загрузки результатов');
        }

        const data = await response.json();

        if (!data.content || data.content.length === 0) {
            errorToast.style.display = 'block';
            placeName.style.display = 'none';
            map.style.display = 'none';
            mapContainer.style.display = 'none';
            createCarousel([]);
            updatePaginationButtons();
            return;
        }

        errorToast.style.display = 'none';

        // Берём первый и единственный объект на странице
        const place = data.content[0];

        let placeNameText = '';
        if (place.suburb) {
            placeNameText = 'Фотографии с места: ' + place.suburb;
        } else if (place.name) {
            placeNameText = 'Фотографии с места: ' + place.name;
        }

        if (place.street) {
            placeNameText += ' ' + place.street;
        }

        placeName.innerText = placeNameText;
        placeName.style.display = 'block';
        placeName.style.textAlign = 'center';
        placeName.style.color = 'cadetblue';
        placeName.style.marginTop = '10px';
        placeName.style.marginBottom = '0';

        map.style.display = 'block';
        mapContainer.style.display = 'block';

        updateMap(place);
        createCarousel(place.images || []);

        totalPages = data.totalPages;
        renderPagination(totalPages, currentPage);

    } catch (error) {
        console.error('Ошибка:', error);
        errorToast.style.display = 'block';
        placeName.style.display = 'none';
        map.style.display = 'none';
        mapContainer.style.display = 'none';
        createCarousel([]);
        updatePaginationButtons();
    }
}

function updateMap(place) {
    const oldMapEl = document.getElementById('map');

    if (oldMapEl) {
        oldMapEl.remove();
    }

    const newMapEl = document.createElement('div');
    newMapEl.id = 'map';
    newMapEl.style.height = '200px';

    const container = document.getElementById('mapContainer');
    container.appendChild(newMapEl);

    // Теперь можно безопасно инициализировать карту
    getImageMap(place.lon, place.lat, null, 'map');
}


function createCarousel(images) {
    container = document.getElementById('multi-image-container');
    prevBtn = document.querySelector('.prev-btn');
    nextBtn = document.querySelector('.next-btn');

    container.innerHTML = '';
    container.classList.remove('one-image', 'two-images');

    if (!images || images.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'multi-image-item';
        placeholder.innerHTML = '<p>Нет изображений</p>';
        container.appendChild(placeholder);

        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    if (images.length === 1) {
        container.classList.add('one-image');
    } else if (images.length === 2) {
        container.classList.add('two-images');
    }

    images.forEach(url => {
        const item = document.createElement('div');
        item.className = 'multi-image-item';

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Изображение';

        item.appendChild(img);
        container.appendChild(item);
    });

    imageUrls = images;
    totalGroups = Math.ceil(imageUrls.length / itemsPerGroup);
    currentGroup = 0;
    updateButtonStates();
    scrollToGroup(currentGroup);
}

function updatePaginationButtons() {
    prevBtn = document.querySelector('.prev-btn');
    nextBtn = document.querySelector('.next-btn');

    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = currentPage <= 0;
    nextBtn.disabled = currentPage >= totalPages - 1;

    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';

    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
}

document.querySelector('.prev-btn').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        const urlParams = new URLSearchParams(window.location.search);
        const value = urlParams.get('query') || '';
        loadSearchResults(value);
    }
});

document.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        const urlParams = new URLSearchParams(window.location.search);
        const value = urlParams.get('query') || '';
        loadSearchResults(value);
    }
});

// Навигация внутри карусели (если нужна)

let currentGroup = 0;
let totalGroups = 0;

function updateButtonStates() {
    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = currentGroup === 0;
    nextBtn.disabled = currentGroup >= totalGroups - 1;

    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';

    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
}

function scrollToGroup(groupIndex) {
    const items = container.querySelectorAll('.multi-image-item');
    if (items.length === 0) return;
    const itemWidth = items[0].offsetWidth + 15;

    container.scrollTo({
        left: groupIndex * itemsPerGroup * itemWidth,
        behavior: 'smooth'
    });
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

document.getElementById('pagination-controls').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const selectedPage = Number(e.target.dataset.page);
        if (!isNaN(selectedPage) && selectedPage !== currentPage) {
            currentPage = selectedPage;
            const urlParams = new URLSearchParams(window.location.search);
            const value = urlParams.get('query') || '';
            loadSearchResults(value);
        }
    }
});

function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination-controls');
    pagination.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i + 1;
        btn.dataset.page = i;
        if (i === currentPage) btn.disabled = true;
        pagination.appendChild(btn);
    }
}



window.addEventListener('resize', () => {
    itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
    totalGroups = Math.ceil(imageUrls.length / itemsPerGroup);
    scrollToGroup(currentGroup);
    updateButtonStates();
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('query') || '';
    loadSearchResults(value);
});

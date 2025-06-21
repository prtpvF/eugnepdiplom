import { showError } from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { API_CONFIG } from "https://effortless-douhua-d77333.netlify.app/constants.js";

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const placeId = localStorage.getItem("placeId"); // Получаем ID из URL
        if (!placeId) {
            throw new Error('Place ID not specified');
        }
        await loadImagesByPlace(placeId);
    } catch (error) {
        showError(error);
    }
});

function getPlaceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('placeId');
}

async function loadImagesByPlace(placeId, page = 0, size = 12) {
    try {
        const response = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/all/byPlace/${placeId}`, {
            params: {
                page,
                size,
                sort: 'createdAt,desc' // Пример сортировки
            }
        });

        renderImages(response.data.content);
        setupPagination(response.data, placeId);
    } catch (error) {
        showError(error.response?.data?.message || error.message);
    }
}

function renderImages(images) {
    const container = document.getElementById('imagesContainer');
    const text = document.getElementById('placeName');
    container.innerHTML = '';

    if (!images?.length) {
        container.innerHTML = '<div class="no-images">No images found for this place</div>';
        return;
    }
    let place = images[0];
    console.log(place)
    console.log('test')
    let placeNameText = '';
    if (place.place.suburb) {
        placeNameText = 'Фотографии с места: ' + place.place.suburb;
    } else if (place.place.name) {
        placeNameText = 'Фотографии с места: ' + place.place.name;
    }

    if (place.place.street) {
        placeNameText += ' ' + place.place.street;
    }

    text.innerText = placeNameText;
    text.style.display = 'block';
    text.style.textAlign = 'center';
    text.style.color = 'cadetblue';
    text.style.marginTop = '10px';
    text.style.marginBottom = '0';
    images.forEach(image => {
        const imageCard = createImageCard(image);
        imageCard.onclick = function () {
            localStorage.removeItem('photo')
            localStorage.setItem('photo', JSON.stringify(image));
            window.location.href = API_CONFIG.FRONT_URL + '/pages/image/imagePage.html';
        }
        container.appendChild(imageCard);
    });
}

function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';

    const img = document.createElement('img');
    img.className = 'place-image';
    img.src = image.url || image.pathToFile || '/images/default-place.jpg';
    img.alt = `Image of place ${image.id}`;
    img.loading = 'lazy'; // Ленивая загрузка

    img.onerror = () => {
        img.src = '/images/error-image.jpg';
    };

    card.appendChild(img);
    return card;
}

function setupPagination(pageData, placeId) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (pageData.totalPages <= 1) return;

    // Previous Button
    if (!pageData.first) {
        const prevBtn = createPaginationButton('← Previous', () => {
            loadImagesByPlace(placeId, pageData.number - 1);
        });
        pagination.appendChild(prevBtn);
    }

    // Page Numbers
    const startPage = Math.max(0, pageData.number - 2);
    const endPage = Math.min(pageData.totalPages - 1, pageData.number + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPaginationButton(i + 1, () => {
            loadImagesByPlace(placeId, i);
        }, i === pageData.number);
        pagination.appendChild(pageBtn);
    }

    // Next Button
    if (!pageData.last) {
        const nextBtn = createPaginationButton('Next →', () => {
            loadImagesByPlace(placeId, pageData.number + 1);
        });
        pagination.appendChild(nextBtn);
    }
}

function createPaginationButton(text, onClick, isActive = false) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = isActive ? 'active' : '';
    btn.addEventListener('click', onClick);
    return btn;
}
import { API_CONFIG } from  './constants'

document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.gallery-container');
    const prevBtn = document.querySelector('#prevPage');
    const nextBtn = document.querySelector('#nextPage');
    const currentPageSpan = document.querySelector('#currentPage');

    let currentPage = 0;
    const pageSize = 3;

    const loadPhotos = async (page) => {
        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/my?page=${page}&size=${pageSize}`);
            if (!response.ok) throw new Error('Ошибка загрузки');

            const data = await response.json();
            renderGallery(data.content);
            updatePagination(data);
        } catch (error) {
            showError(error.message);
        }
    };

    const renderGallery = (photos) => {
        gallery.innerHTML = photos.map(photo => `
            <div class="photo-card">
                <img src="${photo.pathToFile}" alt="${photo.place?.name || 'Фото'}" class="photo-thumbnail">
                <div class="photo-details">
                    <div class="info-item">
                        <div class="info-label">Место</div>
                        <div class="info-content">${photo.place?.name || 'Не указано'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Лайки</div>
                        <div class="info-content">${photo.likes.length}</div>
                    </div>
                    <a href="photo.html?id=${photo.id}" class="detail-btn">Подробнее</a>
                </div>
            </div>
        `).join('');
    };

    const updatePagination = (data) => {
        currentPageSpan.textContent = data.number + 1;
        prevBtn.disabled = data.first;
        nextBtn.disabled = data.last;
    };

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadPhotos(currentPage);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (!nextBtn.disabled) {
            currentPage++;
            loadPhotos(currentPage);
        }
    });

    // Инициализация
    loadPhotos(currentPage);
});

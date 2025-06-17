import { showError } from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { API_CONFIG } from "https://effortless-douhua-d77333.netlify.app/constants.js";

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const photoGrid = document.getElementById('photoGrid');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const modal = document.getElementById('imageModal');
    const closeModalBtn = document.getElementById('closeModal');
    const editModal = document.getElementById('editModal');
    const closeEditModalBtn = document.getElementById('closeEditModal');

    let currentPage = 0;
    const photosPerPage = 6;
    let totalPages = 1;
    let allPhotos = [];
    let userData = null;
    let currentPhotoId = null;
    let currentPhotoAuthor = null;

    const authorUsername = localStorage.getItem('author');

    async function loadPhotos(page) {
        try {
            const url = new URL('http://localhost:8081/image/byPerson');
            const params = new URLSearchParams({
                username: authorUsername,
                page: page,
                size: photosPerPage
            });
            url.search = params.toString();

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });

            if (response.status === 401) {
                window.location.href = 'http://localhost:8080/fe/pages/login.html';
                return;
            }

            if (response.status === 500 || response.status === 400) {
                const errorData = await response.json();
                showError(errorData.message || 'Ошибка при загрузке фотографий');
                return;
            }

            userData = await response.json();
            allPhotos = userData.content || [];
            totalPages = userData.totalPages || 1;

            updateGallery();
            updatePaginationControls();

        } catch (error) {
            showError('Ошибка сети');
            console.error('Ошибка:', error);
        }
    }

    function updateGallery() {
        photoGrid.innerHTML = allPhotos.map(photo => `
            <div class="photo-item" data-id="${photo.id}">
                <img src="${API_CONFIG.BASE_URL +photo.pathToFile}" alt="Моя фотография">
            </div>
        `).join('');
    }

    function updatePaginationControls() {
        pageInfo.textContent = `Страница ${currentPage + 1} из ${totalPages}`;
        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = currentPage >= totalPages - 1;
    }

    photoGrid.addEventListener('click', async (event) => {
        const photoItem = event.target.closest('.photo-item');
        if (!photoItem) return;

        try {
            const response = await fetch(`http://localhost:8081/image/${photoItem.dataset.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.message || 'Ошибка при загрузке фото');
                return;
            }

            if (response.status === 401) {
                showError("Необходимо авторизоваться");
                return;
            }

            const photoDetails = await response.json();
            localStorage.removeItem('photo');
            localStorage.setItem('photo', JSON.stringify(photoDetails));
            window.location.href = 'http://localhost:8080/fe/pages/image/imagePage.html';
        } catch (error) {
            showError('Ошибка сети');
            console.error(error);
        }
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadPhotos(currentPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadPhotos(currentPage);
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    loadPhotos(currentPage);
});
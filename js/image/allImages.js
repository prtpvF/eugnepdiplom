import { showError } from 'http://localhost:8080/fe/errorMessageModule.js';

document.addEventListener('DOMContentLoaded', function () {
    const photoGrid = document.getElementById('photoGrid');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const noImageText = document.getElementById('no-image-text');
    const openRoutePage = document.getElementById('banner-button');

    let currentPage = 0;
    const photosPerPage = 6;
    let userData = {};

    async function getAllImages(page, size) {
        try {
            const url = new URL('http://localhost:8081/image/all');
            url.searchParams.append('page', page);
            url.searchParams.append('size', size);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                }
            });

            if (response.status === 401) {
                window.location.replace('./login.html');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.message || 'Ошибка при загрузке данных');
                return;
            }

            userData = await response.json();
            updateGallery();
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    function updateGallery() {
        photoGrid.innerHTML = '';
        console.log(userData);

        if(userData.content.length === 0) {
            console.log('hello')
            noImageText.style.display = 'block';
        }

        userData.content.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.dataset.id = photo.id;

            const img = document.createElement('img');
            img.src = photo.pathToFile;
            img.alt = 'Фотография';

            photoItem.appendChild(img);
            photoGrid.appendChild(photoItem);

            photoItem.addEventListener('click', () => {
                localStorage.setItem('photo', JSON.stringify(photo));
                window.location.href = 'http://localhost:8080/fe/pages/image/imagePage.html';
            });
        });

        prevPageBtn.style.display = 'block';
        nextPageBtn.style.display = 'block';

        const totalPages = userData.totalPages > 0 ? userData.totalPages : 1;

        pageInfo.textContent = `Страница ${currentPage + 1} из ${totalPages}`;
        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = currentPage === userData.totalPages - 1 || userData.totalPages === 0;
    }

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            getAllImages(currentPage, photosPerPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < userData.totalPages - 1) {
            currentPage++;
            getAllImages(currentPage, photosPerPage);
        }
    });

    getAllImages(currentPage, photosPerPage);
});


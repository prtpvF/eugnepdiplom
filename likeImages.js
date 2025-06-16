import { showError } from 'http://localhost:8080/fe/errorMessageModule.js';

document.addEventListener('DOMContentLoaded', function () {
    const photoGrid = document.getElementById('photoGrid');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const noDataMessage = document.getElementById('no-data-message');

    let currentPage = 0;
    const photosPerPage = 4;
    let userData = {};

    async function getLikedImages(page, size) {
        try {
            const url = new URL('http://localhost:8081/image/all/liked');
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

            if(response.content === []) {
                noDataMessage.style.display = 'block';
            }

            if (!response.ok) {
                noDataMessage.style.display = 'block';
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


        if(userData.content.length > 0) {
            userData.content.forEach(photo => {
                photoGrid.innerHTML += `
                <div class="photo-item" data-id="${photo.id}">
                    <img src="${photo.pathToFile}" alt="Фотография">
                </div>
            `;

                photoGrid.addEventListener('click', (e) => {
                    localStorage.removeItem('photo');
                    localStorage.setItem('photo', JSON.stringify(photo));
                    window.location.href = 'http://localhost:8080/fe/pages/image/imagePage.html'
                })
            });

            pageInfo.textContent = `Страница ${currentPage + 1} из ${userData.totalPages}`;

            prevPageBtn.disabled = currentPage === 0;
            nextPageBtn.disabled = currentPage === userData.totalPages - 1;
        } else {
            const noPhotosMessage = document.createElement('div');
            noPhotosMessage.id = 'noPhotosMessage';

            const noPhotosText = document.createElement('p');
            noPhotosText.textContent = 'У вас пока нет понравившихся публикаций';

            noPhotosMessage.appendChild(noPhotosText);
        }
    }

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            getLikedImages(currentPage, photosPerPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < userData.totalPages - 1) {
            currentPage++;
            getLikedImages(currentPage, photosPerPage);
        }
    });

    getLikedImages(currentPage, photosPerPage);
});
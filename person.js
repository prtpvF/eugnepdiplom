import { showError } from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { API_CONFIG } from "https://effortless-douhua-d77333.netlify.app/constants.js";

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const photoGrid = document.getElementById('photoGrid');
    const routeGrid = document.getElementById('routeGrid');
    const showMoreBtn = document.getElementById('showMoreBtn');
    const photosTab = document.getElementById('photosTab');
    const routesTab = document.getElementById('routesTab');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const createRouteBtn = document.getElementById('createRouteBtn');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    const noRoutesMessage = document.getElementById('noRoutesMessage');

    const modal = document.getElementById('imageModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalDescription = document.getElementById('modalDescription');
    const editDescriptionBtn = document.getElementById('editDescriptionBtn');
    const deletePhotoBtn = document.getElementById('deletePhotoBtn');
    const editModal = document.getElementById('editModal');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const saveDescriptionBtn = document.getElementById('saveDescriptionBtn');
    const editDescriptionInput = document.getElementById('editDescriptionInput');

    let allPhotos = [];
    let allRoutes = [];
    let userData = null;
    let visiblePhotos = 4;
    let visibleRoutes = 4;
    let currentPhotoId = null;
    let currentTab = 'photos';

    try {
        const response = await fetch(API_CONFIG.BASE_URL +API_CONFIG.ENDPOINTS.ACCOUNT, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = API_CONFIG.FRONT_URL + '/pages/login';
            return;
        }

        if(response.status === 500 || response.status === 400) {
            showError(response.message);
            return;
        }

        userData = await response.json();
        allPhotos = userData.images || [];

        const routesResponse = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PERSON_ROUTES, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (routesResponse.ok) {
            const routesData = await routesResponse.json();
            allRoutes = routesData
        }

        updateGallery();
    } catch (error) {
        showError(error.message);
        console.error(error);
    }

    // Tab switching
    photosTab.addEventListener('click', () => {
        if (currentTab === 'photos') return;
        currentTab = 'photos';
        photosTab.classList.add('active');
        routesTab.classList.remove('active');
        photoGrid.style.display = 'grid';
        routeGrid.style.display = 'none';
        noRoutesMessage.style.display = 'none';
        uploadPhotoBtn.style.display = 'flex';
        createRouteBtn.style.display = 'none';
        updateGallery();
    });

    routesTab.addEventListener('click', () => {
        if (currentTab === 'routes') return;
        currentTab = 'routes';
        routesTab.classList.add('active');
        photosTab.classList.remove('active');
        photoGrid.style.display = 'none';
        noPhotosMessage.style.display = 'none';
        routeGrid.style.display = 'grid';
        uploadPhotoBtn.style.display = 'none';
        createRouteBtn.style.display = 'flex';
        updateRoutes();
    });

    createRouteBtn.onclick = function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        window.location.replace(API_CONFIG.FRONT_URL + '/pages/routes/newRoute.html')
    }

    photoGrid.addEventListener('click', async (event) => {
        const photoItem = event.target.closest('.photo-item');
        if (!photoItem) return;

        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${photoItem.dataset.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                showError(response.message);
                return;
            }

            if (response.status === 401) {
                showError("Необходимо авторизоваться");
                return;
            }

            const photoDetails = await response.json();
            localStorage.removeItem('photo');
            localStorage.setItem('photo', JSON.stringify(photoDetails));
            window.location.href = API_CONFIG.FRONT_URL + '/pages/image/imagePage';
        } catch (error) {
            showError(error.message);
            console.error(error);
        }
    });

    showMoreBtn.addEventListener('click', () => {
        if (currentTab === 'photos') {
            visiblePhotos += 4;
            updateGallery();
        } else {
            visibleRoutes += 4;
            updateRoutes();
        }
    });

    // Modal handlers (same as before)
    editDescriptionBtn.addEventListener('click', () => {
        editModal.style.display = 'flex';
    });

    closeEditModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    saveDescriptionBtn.addEventListener('click', async () => {
        const newDescription = editDescriptionInput.value.trim();
        if (!newDescription) {
            alert('Введите описание');
            return;
        }

        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE + `/${currentPhotoId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ description: newDescription })
            });

            if (!response.ok) throw new Error('Ошибка обновления описания');

            alert('Описание успешно обновлено');
            editModal.style.display = 'none';
            modalDescription.textContent = `Описание: ${newDescription}`;
        } catch (error) {
            alert('Ошибка при обновлении описания');
            console.error(error);
        }
    });

    deletePhotoBtn.addEventListener('click', async () => {
        const confirmDelete = confirm('Вы уверены, что хотите удалить эту фотографию?');
        if (!confirmDelete) return;

        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${currentPhotoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Ошибка удаления фотографии');

            alert('Фотография успешно удалена');
            modal.style.display = 'none';
            allPhotos = allPhotos.filter(photo => photo.id !== currentPhotoId);
            updateGallery();
        } catch (error) {
            alert('Ошибка при удалении фотографии');
            console.error(error);
        }
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    function updateGallery() {
        if (allPhotos.length === 0) {
            noPhotosMessage.style.display = 'block';
            photoGrid.style.display = 'none';
            showMoreBtn.style.display = 'none';
        } else {
            noPhotosMessage.style.display = 'none';
            photoGrid.style.display = 'grid';

            const photosToShow = Math.min(visiblePhotos, allPhotos.length);

            photoGrid.innerHTML = allPhotos.slice(0, photosToShow).map(photo => `
                <div class="photo-item" data-id="${photo.id}">
                    <img src="${API_CONFIG.BASE_URL + photo.pathToFile}" alt="Моя фотография">
                </div>
            `).join('');
        }

        showMoreBtn.style.display = visiblePhotos < allPhotos.length ? 'block' : 'none';
    }

    function updateRoutes() {
        if (allRoutes.length === 0) {
            noRoutesMessage.style.display = 'block';
            routeGrid.style.display = 'none';
            showMoreBtn.style.display = 'none';
        } else {
            noRoutesMessage.style.display = 'none';
            routeGrid.style.display = 'grid';

            const routesToShow = Math.min(visibleRoutes, allRoutes.length);
            routeGrid.innerHTML = allRoutes.slice(0, routesToShow).map(route => `
            <div class="route-item" data-id="${route.id}">
                <div class="route-item-header">
                    <h3>${route.name}</h3>
                </div>
                 <div class="delete-icon-container" data-id="${route.id}"></div>
                <p>${route.placeName || 'Место не указано'}</p>
                <p>${route.description || 'Описание отсутствует'}</p>
            </div>
        `).join('');

            document.querySelectorAll('.route-item').forEach(route => {
                route.addEventListener('click', (event) => {
                    if (event.target.closest('.delete-route-icon')) {
                        return;
                    }

                    const routeId = event.currentTarget.dataset.id;
                    localStorage.setItem('routeId', routeId);
                    window.location.replace(API_CONFIG.FRONT_URL + '/pages/routes/routePage');
                });
            });


            document.querySelectorAll('.delete-icon-container').forEach(container => {
                const routeId = container.getAttribute('data-id');
                const route = allRoutes.find(r => r.id == routeId);

                const deleteIcon = document.createElement('div');
                deleteIcon.className = 'delete-route-icon';
                deleteIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
            `;

                deleteIcon.onclick = () => deleteRoute(route);

                container.appendChild(deleteIcon);
            });
        }

    }

    async function deleteRoute(route) {
        try {
            const response = await axios.delete(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ROUTE +`/${route.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

            if (response.status === 200) {
                allRoutes = allRoutes.filter(r => r.id !== route.id);
                updateRoutes();
            } else {
                showError(response.data?.message || 'Ошибка при удалении маршрута');
            }
        } catch (error) {
            showError(error.response?.data?.message || error.message);
        }
    }

});
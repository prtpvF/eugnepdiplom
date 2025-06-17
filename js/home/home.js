import { showError } from 'errorMessageModule';
import { API_CONFIG } from '../../constants';

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

    let currentGroup = 0;
    let totalGroups = 0;
    let imageUrls = [];
    let itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
    let prevBtn, nextBtn, container;

    imageUrls = ['/static/bitebsk.jpg', '/static/minsk.jpg',
        '/static/minsk2.jpg',
        '/static/mir.jpg', '/static/photo.jpg', '/static/photo1.jpg', '/static/лида.jpg'];

    async function getAllImages(page, size) {
        try {
            const url = new URL(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE+'/all');
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

    function getRoutePage() {
        openRoutePage.addEventListener('click', function () {
            window.location.href = API_CONFIG.FRONT_URL + '/pages/routes/route.html';
        })
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
            img.alt = 'Route image';

            item.appendChild(img);
            container.appendChild(item);
        });

        const itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
        totalGroups = Math.ceil(imageUrls.length / itemsPerGroup);
        currentGroup = 0;

        // Добавляем переменную для хранения таймера
        let autoScrollInterval;

        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                currentGroup = (currentGroup + 1) % totalGroups;
                scrollToGroup(currentGroup);
                updateButtonStates();
            }, 5000); // 5 секунд
        }

        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }

        // Запускаем автоматическую прокрутку
        startAutoScroll();

        // Останавливаем автоматическую прокрутку при взаимодействии пользователя
        container.addEventListener('mouseenter', stopAutoScroll);
        container.addEventListener('mouseleave', startAutoScroll);
        prevBtn.addEventListener('mouseenter', stopAutoScroll);
        nextBtn.addEventListener('mouseenter', stopAutoScroll);

        function updateButtonStates() {
            prevBtn.disabled = false; // Кнопки теперь никогда не отключаются
            nextBtn.disabled = false;

            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }

        function scrollToGroup(groupIndex) {
            const items = container.querySelectorAll('.multi-image-item');
            const itemWidth = items[0].offsetWidth + 15;

            container.scrollTo({
                left: groupIndex * itemsPerGroup * itemWidth,
                behavior: 'smooth'
            });
        }

        document.querySelector('.prev-btn').addEventListener('click', () => {
            currentGroup = (currentGroup - 1 + totalGroups) % totalGroups;
            scrollToGroup(currentGroup);
            updateButtonStates();
            stopAutoScroll();
            startAutoScroll();
        });

        document.querySelector('.next-btn').addEventListener('click', () => {
            currentGroup = (currentGroup + 1) % totalGroups;
            scrollToGroup(currentGroup);
            updateButtonStates();
            stopAutoScroll();
            startAutoScroll();
        });

        window.addEventListener('resize', () => {
            const newItemsPerGroup = window.innerWidth < 768 ? 2 : 3;
            totalGroups = Math.ceil(imageUrls.length / newItemsPerGroup);
            scrollToGroup(currentGroup);
            updateButtonStates();
        });
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
                window.location.href = API_CONFIG.FRONT_URL + '/pages/image/imagePage.html';
            });
        });

        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';

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
    createCarousel(imageUrls);
    getRoutePage()
});


import { getImageMap } from 'http://localhost:8080/fe/map.js';
import { showError } from 'http://localhost:8080/fe/errorMessageModule.js';
import { API_CONFIG } from  './constants'

let currentGroup = 0;
let totalGroups = 0;
let currentImages = [];
let itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
let prevBtn, nextBtn, container;

// Основные элементы интерфейса
const addPhotoButton = document.getElementById("add-photo-btn");
const addCommentForm = document.getElementById("comment-form");

// Основные функции приложения
async function loadRouteData(routeId) {
    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ROUTE + `/${routeId}`);

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('route', JSON.stringify(data));
            updateMap(data);
            return data;
        } else if(response.status === 401) {
            window.location.replace('./login.html');
        } else {
            const error = await response.json();
            showError(error.message);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showError('Сетевая ошибка при загрузке данных');
    }
}

function updateMap(route) {
    const mapContainer = document.getElementById('map');

    if (!mapContainer._leaflet_map) {
        getImageMap(route.lon, route.lat, null, 'map');
    } else {
        mapContainer._leaflet_map.setView([route.lat, route.lon]);
    }
}

function createCarousel(images) {
    container = document.getElementById('multi-image-container');
    prevBtn = document.querySelector('.prev-btn');
    nextBtn = document.querySelector('.next-btn');
    currentImages = images || [];

    container.innerHTML = '';
    container.classList.remove('one-image', 'two-images');

    // Обработка отсутствия изображений
    if (!currentImages.length) {
        container.innerHTML = '<div class="multi-image-item"><p>No images available</p></div>';
        prevBtn.disabled = nextBtn.disabled = true;
        updateButtonStates();
        return;
    }

    // Классы для разного количества изображений
    if (currentImages.length === 1) container.classList.add('one-image');
    if (currentImages.length === 2) container.classList.add('two-images');

    // Создание элементов карусели
    currentImages.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'multi-image-item';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const img = document.createElement('img');
        img.src = item.pathToFile;
        img.alt = 'Route image';
        imageContainer.appendChild(img);

        if (item.description) {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'instagram-note';
            noteDiv.textContent = item.description;
            imageContainer.appendChild(noteDiv);
        }

        itemDiv.appendChild(imageContainer);
        container.appendChild(itemDiv);
    });

    // Обновление состояния карусели
    itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
    totalGroups = Math.ceil(currentImages.length / itemsPerGroup);
    currentGroup = 0;
    updateButtonStates();
    scrollToGroup(0);
}

function setupCarouselControls() {
    prevBtn = document.querySelector('.prev-btn');
    nextBtn = document.querySelector('.next-btn');

    prevBtn.addEventListener('click', () => {
        if (currentGroup > 0) {
            currentGroup--;
            scrollToGroup(currentGroup);
            updateButtonStates();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentGroup < totalGroups - 1) {
            currentGroup++;
            scrollToGroup(currentGroup);
            updateButtonStates();
        }
    });

    window.addEventListener('resize', () => {
        itemsPerGroup = window.innerWidth < 768 ? 2 : 3;
        totalGroups = Math.ceil(currentImages.length / itemsPerGroup);
        scrollToGroup(currentGroup);
        updateButtonStates();
    });
}

function updateButtonStates() {
    prevBtn.disabled = currentGroup === 0;
    nextBtn.disabled = currentGroup >= totalGroups - 1;

    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';

    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
}

function scrollToGroup(groupIndex) {
    const items = container.querySelectorAll('.multi-image-item');
    if (!items.length) return;

    const itemWidth = items[0].offsetWidth + 15;
    container.scrollTo({
        left: groupIndex * itemsPerGroup * itemWidth,
        behavior: 'smooth'
    });
}

function addDescription(route) {
    const descriptionElement = document.getElementById('description');
    if (descriptionElement) {
        descriptionElement.textContent = route.description || '';
    }
}

async function uploadPhoto(routeId, file, description) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('description', description);

    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ROUTE + API_CONFIG.ENDPOINTS.IMAGE + `/${routeId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });

        if (response.ok) {
            const updatedRoute = await response.json();
            localStorage.setItem('route', JSON.stringify(updatedRoute));
            createCarousel(updatedRoute.images);
            return true;
        } else {
            const error = await response.json();
            showError(error.message || 'Ошибка при загрузке фото');
            return false;
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Сетевая ошибка при загрузке фото');
        return false;
    }
}

function displayComments(comments) {
    const container = document.getElementById('comments-container');
    if (!container) return;

    container.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-author-avatar">
                    <img src="${comment.authorImage}" 
                         alt="${comment.author}" 
                         class="avatar-img">
                </div>
                <div class="comment-author-info">
                    <div class="comment-author">${comment.author}</div>
                    <div class="comment-date">${formatDate(comment.createdAt)}</div>
                </div>
            </div>
            <div class="comment-text">${comment.value}</div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function postComment(routeId, commentData) {
    const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.COMMENT +`/new/route`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(commentData)
    });

    if (!response.ok) {
        throw new Error('Failed to post comment');
    }
}

function setupCommentForm(routeId) {
    const form = document.getElementById('comment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const textInput = document.getElementById('comment-text');
        const text = textInput.value.trim();
        const submitBtn = form.querySelector('button[type="submit"]');

        // Валидация комментария
        if (!text) {
            showError('Пожалуйста, введите комментарий');
            return;
        }

        if (text.length < 4 || text.length > 50) {
            showError("Комментарий должен содержать от 4 до 50 символов");
            return;
        }

        // Блокировка формы во время отправки
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';

        try {
            await postComment(routeId, {
                author: getUsernameFromToken(),
                value: text,
                route: parseInt(routeId)
            });
            window.location.reload();
        } catch (error) {
            showError('Не удалось отправить комментарий');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

function adjustLayout() {
    const commentsContainer = document.getElementById('comments-container');
    const commentForm = document.getElementById('comment-form');
    const footer = document.querySelector('footer');

    if (!commentsContainer || !commentForm || !footer) return;

    const availableHeight = window.innerHeight - footer.offsetHeight - 100;
    commentsContainer.style.maxHeight = `${availableHeight}px`;

    commentForm.style.position = 'sticky';
    commentForm.style.bottom = '20px';
    commentForm.style.backgroundColor = 'white';
    commentForm.style.zIndex = '10';
}

function getUsernameFromToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || payload.sub;
    } catch (e) {
        console.error('Error parsing token:', e);
        return null;
    }
}

function setupPhotoUpload() {
    // Основные элементы
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const uploadModal = document.getElementById('upload-modal');
    const cancelBtn = document.getElementById('cancel-upload');
    const uploadForm = document.getElementById('photo-upload-form');
    const fileInput = document.getElementById('photo-input');
    const fileName = document.getElementById('file-name');
    const fileLabel = document.querySelector('.file-label');
    const descriptionInput = document.getElementById('photo-description');

    // Элементы для превью и счетчика
    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview';
    fileLabel.appendChild(previewContainer);

    const charCounter = document.createElement('div');
    charCounter.className = 'char-counter';
    charCounter.innerHTML = '<span id="char-count">0</span>/50';
    descriptionInput.parentNode.appendChild(charCounter);

    const charCountElement = document.getElementById('char-count');
    const submitBtn = uploadForm.querySelector('.submit-btn');

    if (!addPhotoBtn) return;

    // Состояние загрузки
    let isUploading = false;

    // Обработчики событий
    descriptionInput.addEventListener('input', () => {
        charCountElement.textContent = descriptionInput.value.length;
    });

    addPhotoBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);
    uploadModal.addEventListener('click', e => e.stopPropagation());
    fileInput.addEventListener('change', handleFileSelect);
    uploadForm.addEventListener('submit', handleFormSubmit);

    // Функции управления модальным окном
    function openModal() {
        modalOverlay.style.display = 'block';
        uploadModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        resetForm();
    }

    function hideModal() {
        modalOverlay.style.display = 'none';
        uploadModal.style.display = 'none';
        document.body.style.overflow = '';
        resetForm();
    }

    function resetForm() {
        uploadForm.reset();
        fileName.textContent = 'Выберите файл';
        previewContainer.innerHTML = '';
        charCountElement.textContent = '0';
        fileLabel.querySelector('svg').style.display = 'block';
    }

    // Обработчик выбора файла
    function handleFileSelect() {
        if (!fileInput.files.length) return;

        const file = fileInput.files[0];
        fileName.textContent = file.name;
        previewContainer.innerHTML = '';

        if (!file.type.match('image.*')) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            previewContainer.appendChild(img);
            fileLabel.querySelector('svg').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // Обработчик отправки формы
    async function handleFormSubmit(e) {
        e.preventDefault();
        if (isUploading) return;

        const file = fileInput.files[0];
        const description = descriptionInput.value;
        const routeId = localStorage.getItem('routeId');

        // Валидация данных
        if (!file) {
            showError('Пожалуйста, выберите файл');
            return;
        }

        if (!file.type.match('image.*')) {
            showError('Пожалуйста, выберите изображение');
            return;
        }

        if (description.length > 40) {
            showError('Описание не может превышать 40 символов');
            return;
        }

        if (!routeId) {
            showError('Не удалось определить маршрут');
            return;
        }

        // Блокировка интерфейса во время загрузки
        isUploading = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="spinner"></span> Загрузка...';
        submitBtn.disabled = true;

        try {
            const success = await uploadPhoto(routeId, file, description);
            if (success) {
                hideModal();
            }
        } catch (error) {
            showError('Ошибка при загрузке фото');
        } finally {
            isUploading = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка авторизации
    const isAuthenticated = !!localStorage.getItem('access_token');
    addCommentForm.style.display = isAuthenticated ? '' : 'none';
    addPhotoButton.style.display = isAuthenticated ? '' : 'none';

    // Загрузка данных маршрута
    const routeId = localStorage.getItem('routeId');
    if (!routeId) {
        showError('Маршрут не выбран');
        return;
    }

    const routeData = await loadRouteData(routeId);
    if (!routeData) return;

    createCarousel(routeData.images);
    addDescription(routeData);
    updateMap(routeData);
    displayComments(routeData.comments || []);

    setupCarouselControls();
    setupPhotoUpload();
    setupCommentForm(routeId);
    adjustLayout();

    window.addEventListener('load', adjustLayout);
    window.addEventListener('resize', adjustLayout);
});
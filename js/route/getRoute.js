import { showError } from "http://localhost:8080/fe/errorMessageModule.js";

const config = {
    pageSize: 9, // 3x3 grid
    apiEndpoint: 'http://localhost:8081/route/all'
};

let currentPage = 0;
let totalPages = 1;

const elements = {
    routesContainer: document.getElementById('routes-container'),
    loadingSpinner: document.getElementById('loading-spinner'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageInfo: document.getElementById('pageInfo')
};

document.addEventListener('DOMContentLoaded', function() {
    loadRoutes(currentPage);

    elements.prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadRoutes(currentPage);
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadRoutes(currentPage);
        }
    });

});

async function loadRoutes(page) {
    showLoading(true);

    try {
        const response = await fetch(`${config.apiEndpoint}?page=${page}&size=${config.pageSize}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.content) {
            throw new Error('Invalid response format: missing content');
        }

        displayRoutes(data.content);
        totalPages = data.totalPages || 1;
        currentPage = data.number || 0;
        updatePaginationControls();
    } catch (error) {
        console.error('Error loading routes:', error);
        showError('Не удалось загрузить маршруты. Пожалуйста, попробуйте позже.');
        elements.routesContainer.innerHTML = `
            <div class="error-message">
                Ошибка загрузки маршрутов. Пожалуйста, попробуйте позже.
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

function displayRoutes(routes) {
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
        elements.routesContainer.innerHTML = `
            <div class="no-routes">
                Маршруты не найдены.
            </div>
        `;
        return;
    }

    elements.routesContainer.innerHTML = routes.map(route => {

        const routeId = route.id || '';
        const routeName = route.name || 'Без названия';
        const description = route.description || 'Нет описания';
        const placeName = route.placeName || 'Неизвестное место';

        return `
            <div class="route-card" data-route-id="${routeId}">
                <h3 class="card-title">${routeName}</h3>
                <p class="card-text">${description}</p>
                <div class="route-meta">
                    <p class="place-name">${placeName}</p>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.route-card').forEach(card => {
        card.addEventListener('click', function() {
            const routeId = this.getAttribute('data-route-id');

            console.log('Selected route ID:', routeId);

            localStorage.setItem('routeId', routeId);
             window.location.href = 'http://localhost:8080/fe/pages/routes/routePage.html';
        });
    });

    console.log()
}

function updatePaginationControls() {
    elements.pageInfo.textContent = `Страница ${currentPage + 1} из ${totalPages}`;
    elements.prevPageBtn.disabled = currentPage === 0;
    elements.nextPageBtn.disabled = currentPage >= totalPages - 1;
}

function showLoading(show) {
    elements.loadingSpinner.style.display = show ? 'block' : 'none';
}
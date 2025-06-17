import { API_CONFIG } from "../constants";

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = API_CONFIG.FRONT_URL + '/pages/login.html';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const photoId = localStorage.getItem('photoId');
    if (!photoId) {
        showError('Не указан ID фотографии');
        return;
    }

    const elements = {
        photoImage: document.getElementById('photoImage'),
        photoTitle: document.getElementById('photoTitle'),
        photoAuthor: document.getElementById('photoAuthor'),
        photoDate: document.getElementById('photoDate'),
        photoLocation: document.getElementById('photoLocation'),
        ratingStars: document.getElementById('ratingStars'),
        ratingText: document.getElementById('ratingText'),
        commentsContainer: document.getElementById('commentsContainer')
    };

    try {
        const [photoData, ratingData] = await Promise.all([
            fetchPhotoData(photoId, token),
            fetchRatingData(photoId, token)
        ]);

        populatePhotoData(photoData);
        setupRatingSystem(photoId, ratingData, token);
        setupComments(photoData.comments || []);

    } catch (error) {
        showError(error.message);
    }

    async function fetchPhotoData(id, token) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Фото не найдено');
        alert(response.json());
        return await response.json();
    }

    async function fetchRatingData(id, token) {
        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${id}/rating`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? await response.json() : { averageRating: 0, userRating: 0 };
        } catch {
            return { averageRating: 0, userRating: 0 };
        }
    }

    function populatePhotoData(data) {
        elements.photoImage.src = data.pathToFile;
        elements.photoTitle.textContent = data.description || "Фотография";
        elements.photoAuthor.textContent = data.author;
        elements.photoDate.textContent = new Date(data.createdAt).toLocaleDateString();
        elements.photoLocation.textContent = data.place?.name || 'Не указано';
    }

    function setupRatingSystem(photoId, ratingData, token) {
        elements.ratingStars.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.dataset.value = i;
            star.innerHTML = i <= (ratingData.userRating || 0) ? '★' : '☆';
            elements.ratingStars.appendChild(star);
        }

        elements.ratingText.textContent = ratingData.averageRating > 0
            ? `Средняя оценка: ${ratingData.averageRating.toFixed(1)}/5`
            : 'Будьте первым!';

        elements.ratingStars.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', async () => {
                if (!token) {
                    showError('Для оценки нужно авторизоваться');
                    return;
                }

                const value = parseInt(star.dataset.value);
                try {
                    const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${photoId}/rate`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ rating: value })
                    });

                    if (!response.ok) throw new Error('Ошибка оценки');

                    // Обновляем данные после успешной оценки
                    const newRating = await fetchRatingData(photoId, token);
                    setupRatingSystem(photoId, newRating, token);

                } catch (error) {
                    showError(error.message);
                }
            });

            star.addEventListener('mouseover', () => {
                const value = parseInt(star.dataset.value);
                highlightStars(value);
            });

            star.addEventListener('mouseout', () => {
                highlightStars(ratingData.userRating || 0);
            });
        });
    }

    function highlightStars(value) {
        elements.ratingStars.querySelectorAll('.star').forEach((star, index) => {
            star.style.color = index < value ? '#ffd700' : '#666';
        });
    }

    function setupComments(comments) {
        elements.commentsContainer.innerHTML = '';

        const commentsHeader = document.createElement('h3');
        commentsHeader.textContent = 'Комментарии';
        elements.commentsContainer.appendChild(commentsHeader);

        if (comments.length === 0) {
            const noComments = document.createElement('p');
            noComments.textContent = 'Комментариев пока нет';
            elements.commentsContainer.appendChild(noComments);
            return;
        }

        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';

            const author = document.createElement('div');
            author.className = 'comment-author';
            author.textContent = comment.author || 'Аноним';

            const text = document.createElement('div');
            text.className = 'comment-text';
            text.textContent = comment.body || '';

            commentDiv.appendChild(author);
            commentDiv.appendChild(text);
            elements.commentsContainer.appendChild(commentDiv);
        });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
});
import { showError } from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { API_CONFIG } from  './constants'

export async function updateLike(userData) {
    console.log("updateLike function called"); // Debugging

    const photoString = localStorage.getItem('photo');
    if (!photoString) {
        console.error("No photo data found in localStorage");
        return;
    }

    const photo = JSON.parse(photoString);

    let currentPhotoId = photo.id;

    try {
        let userLiked = photo.likes?.some(like => like.author === userData.username);
        console.log("User liked:", userLiked); // Debugging

        const oldRatingSection = document.querySelector('.rating-section');
        if (oldRatingSection) {
            oldRatingSection.remove();
        }

        const ratingSection = document.createElement('div');
        ratingSection.className = 'rating-section';
        ratingSection.innerHTML = `
            <button class="btn btn-like ${userLiked ? 'liked' : ''}" id="likeButton">
                <span class="like-icon"></span>
                <span class="like-text">Лайк</span>
            </button>
        `;

        document.querySelector('.info-container').appendChild(ratingSection);

        const likeButton = ratingSection.querySelector('#likeButton');
        likeButton.addEventListener('click', async () => {
            try {
                const response = await fetch(API_CONFIG.BASE_URL + `/like/${photo.id}`, {
                    method: userLiked ? 'DELETE' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Server response error:", errorText);
                    showError(errorText, 400);
                    return;
                }

                const updatedPhoto = await response.json();

                // Сохраняем обновленные данные в localStorage
                localStorage.setItem('photo', JSON.stringify(updatedPhoto));

                const newLikesCount = updatedPhoto.likes?.length || 0;
                const newUserLiked = updatedPhoto.likes?.some(like => like.author === userData.username);

                const likesElement = document.getElementById('likes');
                likesElement.textContent = `Лайков: ${newLikesCount}`;

                likeButton.classList.toggle('liked', newUserLiked);
                userLiked = newUserLiked;
            } catch (error) {
                console.error("Fetch error:", error);
                showError("Что-то пошло не так", 400);
            }
        });

    } catch (error) {
        showError(error.message);
        console.error(error);
    }
}
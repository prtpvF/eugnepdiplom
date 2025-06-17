import { getImageMap } from 'https://effortless-douhua-d77333.netlify.app/map.js';
import { showError } from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { updateComments, initComments } from 'https://effortless-douhua-d77333.netlify.app/commentModule.js';
import { getPerson } from "https://effortless-douhua-d77333.netlify.app/personModule.js";
import { updateLike } from "https://effortless-douhua-d77333.netlify.app/like.js";
import { API_CONFIG } from  './constants'

let data = null;
let currentPerson = null;

async function loadImageData(imageId) {
    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${imageId}`);

        if (response.ok) {
            data = await response.json();
            localStorage.setItem('photo', JSON.stringify(data));
            updateImageData(data);
        } else if(response.status === 401) {
            window.location.replace('./login.html');
        } else {
            const error = await response.json();
            showError(error.message);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

async function deleteImage(imageId) {

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showError('Фотография успешно удалена', response.status);
            window.location.href =  API_CONFIG.FRONT_URL + '/pages/home';
        } else {
            const error = await response.json();
            showError(error.message, response.status);
        }
    } catch (error) {
        showError('Ошибка при удалении фотографии', 400);
        console.error('Ошибка удаления фотографии:', error);
    }
}

async function updateImageData(data) {
    const imageElement = document.getElementById('image');
    imageElement.src = data.pathToFile;
    imageElement.alt = `Фотография от ${data.author}`;

    const descriptionElement = document.getElementById('description');
    descriptionElement.textContent = data.description;

    const authorElement = document.getElementById('author');
    authorElement.textContent = `Автор: ${data.author}`;

    authorElement.addEventListener('click', () => {
        localStorage.setItem('author', data.author);
        console.log(data.author)
        window.location.href =  API_CONFIG.FRONT_URL + '/pages/person/personPage'
    })

    const likesElement = document.getElementById('likes');
    likesElement.textContent = `Лайков: ${data.likes?.length || 0}`;

    const editButton = document.getElementById('edit-description-btn');


    currentPerson = await getPerson();

    if (data.author === currentPerson.username) {
        document.getElementById('edit-description-btn').style.display = 'flex';
        document.getElementById('delete-image-btn').style.display = 'flex';

    } else if(currentPerson.role === 'ADMIN') {
        document.getElementById('delete-image-btn').style.display = 'flex';
    } else {
        document.getElementById('edit-description-btn').style.display = 'none';
        document.getElementById('delete-image-btn').style.display = 'none';
    }
    const deleteButton = document.getElementById('delete-image-btn');
    deleteButton.title = 'Удалить фотографию';
    updateMap(data.place);
    updateComments(data.comments);
}

function updateMap(place) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer._leaflet_map) {
        getImageMap(place.lon, place.lat, data.pathToFile);
    } else {
        const map = mapContainer._leaflet_map;
        map.setView([place.lat, place.lon]);
    }
}

async function updateDescription(imageId, newDescription) {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE +`/${imageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: newDescription
        });

        if (response.ok) {
            data.description = newDescription;
            toggleEditMode(false);
            updateImageData(data);
        } else {
            const error = await response.json();
            showError(error.message);
        }
    } catch (error) {
        console.error('Ошибка при обновлении описания:', error);
    }
}

function toggleEditMode(showEdit) {
    const descriptionElement = document.getElementById('description');
    const editContainer = document.querySelector('.edit-description');
    const editButton = document.getElementById('edit-description-btn');

    if (showEdit) {
        descriptionElement.style.display = 'none';
        editContainer.style.display = 'block';
        editButton.style.display = 'none';
        document.getElementById('description-edit').value = data.description;
    } else {
        descriptionElement.style.display = 'block';
        editContainer.style.display = 'none';
        if (currentPerson && data.author === currentPerson.username) {
            editButton.style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', async() => {
    const imageString = localStorage.getItem("photo");
    const image = JSON.parse(imageString);
    console.log(image);
    currentPerson = await getPerson();

    initComments(image, currentPerson, () => loadImageData(image.id));
    loadImageData(image.id);
    updateLike(currentPerson);

    document.getElementById('edit-description-btn').addEventListener('click', () => {
        toggleEditMode(true);
        document.querySelector('.map').classList.add('hidden');
    });

    document.getElementById('save-description-btn').addEventListener('click', () => {
        const newDescription = document.getElementById('description-edit').value;
        updateDescription(image.id, newDescription);
        updateMap(image)
        document.querySelector('.map').classList.remove('hidden');
    });

    document.getElementById('cancel-description-btn').addEventListener('click', () => {
        toggleEditMode(false);
        document.querySelector('.map').classList.remove('hidden');
    });

    document.getElementById('delete-image-btn').addEventListener('click', () => {
        deleteImage(image.id);
    });
});
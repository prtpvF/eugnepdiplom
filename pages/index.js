import {showError} from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { API_CONFIG } from "https://effortless-douhua-d77333.netlify.app/constants.js";

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const loginForm = document.getElementById('loginForm');
    const imageForm = document.getElementById('imageForm');

    const findButton = document.querySelector('.find-btn');
    if (findButton) {
        findButton.addEventListener('click', findLocation);
    }

    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', (event) => {
            const input = event.target;
            const preview = document.getElementById('preview');
            const uploadBtn = document.querySelector('.upload-btn'); // Получаем кнопку загрузки

            if (input.files && input.files[0]) {
                const reader = new FileReader();

                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    preview.style.width = '100%';
                    preview.style.height = '100%';
                    preview.style.objectFit = 'cover';
                    preview.style.borderRadius = '10px';
                    preview.style.marginTop = '10px';

                    if (uploadBtn) {
                        uploadBtn.style.display = 'none';
                    }
                };

                reader.readAsDataURL(input.files[0]);
            } else {
                preview.src = '';
                preview.style.display = 'none';
                if (uploadBtn) {
                    uploadBtn.style.display = 'block';
                }
            }
        });
    }

    if (imageForm) {
        imageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveImage(imageForm);
        });
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            handleRegistration(registrationForm);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            handleLogin(loginForm);
        });
    }
});

async function handleRegistration(form) {
    const formData = new FormData(form);

    const username = formData.get('username'); // или другое имя поля
    const password = formData.get('password'); // или другое имя поля

    const englishOnlyRegex = /^[A-Za-z0-9]+$/;

    if (username && !englishOnlyRegex.test(username)) {
        showError("только латиница", 400);
        return;
    }

    if (password && !englishOnlyRegex.test(password)) {
        showError("только латиница", 400);
        return;
    }

    try {
        const response = await axios.post(
            'http://localhost:8081/auth/registration',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        showError("Регистрация успешна", 200);
        setTimeout(() => window.location.href = './login.html', 1500);

    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
            showError(error.response.data|| "Ошибка регистрации", error.response.status);
        } else if (error.request) {
            showError("Не удалось получить ответ от сервера", 0);
        } else {
            showError("Ошибка при отправке запроса", 0);
        }
    }
}
async function handleLogin(form) {
    const formData = new FormData(form);

    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    try {
        const response = await axios.post(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN, JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
            const { 'access_token': accessToken, 'refresh_token': refreshToken } = response.data;
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            window.location.href = API_CONFIG.FRONT_URL + '/pages/home.html';
        }
    } catch (error) {
        if (error.response && ( error.response.status === 404 || error.response.status === 400) ) {
            const message = error.response.data;
            showError('Проблема авторизации', error.response.status);
        } else {
            console.error("Произошла ошибка при входе:", error);
        }
    }
}

async function saveImage(form) {
        const formData = new FormData(form);
        console.log(localStorage.getItem("placeId"))
        const placeId = localStorage.getItem("placeId");
        const response = await axios.post(
            API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.IMAGE,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                },
                params: { placeId },
            }
        );

        const status =  response.status;

        if(status === 200) {
           showError("фотография успешно сохраненна", status)
            window.location.href = API_CONFIG.FRONT_URL + '/pages/account.html';
        }
        if(status !== 200) {
            showError(response.message, status);
        }
}

function setupOutsideClickHandler(containerId) {
    document.addEventListener('click', (event) => {
        const container = document.getElementById(containerId);
        if (container.style.display === 'block' && !container.contains(event.target)) {
            container.style.display = 'none';
        }
    });
}

function updatePlaceContainer(places, containerId, onPlaceClick) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.style.display = 'block';

    places.forEach(place => {
        if (!place.name || !place.typeOfPlace) return;

        const placeElement = createPlaceElement(place, onPlaceClick);
        container.appendChild(placeElement);
    });
}

async function findLocation() {
    const placeName = document.getElementById('location').value;

    return axios.get(API_CONFIG.BASE_URL + '/place/find', {
        params: { cityName: placeName }
    }).then( response => {

        const places = response.data;
        if (places && places.length > 0) {
            updatePlaceContainer(places, 'cityContainer', handlePlaceSelection);
            setupOutsideClickHandler('cityContainer');
            return places;
        } else {
            showError("Место не найденно", 404)
        }
    });
}

function handlePlaceSelection(place) {
    console.log(place);
    const locationInput = document.getElementById('location');
    const selectedPlaceInput = document.getElementById('selectedPlaceId');
    const savedPlace =  savePlace(place);
    console.log( savedPlace);
        const placeId = savedPlace.id?.toString() || savedPlace.id;
        localStorage.setItem("placeId", placeId);

    const name = place?.suburb ? place.suburb : place.name;
    locationInput.value = `${name}`;

    if (selectedPlaceInput) {
        selectedPlaceInput.value = place;
    }
    const placeContainer = document.getElementById('cityContainer');
    placeContainer.style.display = 'none';
}


function createPlaceElement(place, onClick) {
    const placeDiv = document.createElement('div');
    placeDiv.classList.add('place-item');
    const name = place?.suburb ? place.suburb : place.name;
    console.log(place.suburb)
    console.log(place.name)
    placeDiv.innerHTML = `
        <h3>${name}</h3>
    `;

    placeDiv.addEventListener('click', () => {
        onClick(place);
    });

    return placeDiv;
}

async function savePlace(place) {
        if (!place || typeof place !== 'object') {
            throw new Error('Place data is invalid or missing.');
        }

        if (!place.name || !place.typeOfPlace) {
            throw new Error('Invalid place data: name and typeOfPlace are required.');
        }

        const response = await axios.post(
            API_CONFIG.BASE_URL + '/place/',
            JSON.stringify(place),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if(response.status === 200) {
            localStorage.setItem("placeId", place.placeId)
            console.log(response)
            return response.data;
        } else {
            showError(response.message);
        }

}
import { showError } from 'https://effortless-douhua-d77333.netlify.app/errorMessageModule.js';
import { API_CONFIG } from  './constants'

export async function getPerson() {
    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(
            API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PERSON + '/person/account',
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.status === 401) {
            window.location.href = API_CONFIG.FRONT_URL+ '/pages/login.html';
        } else if (response.status === 200) {
            return await response.json();
        }
    } catch (error) {
        showError(error.message)

        if (error.response && error.response.status === 401) {
            window.location.href = API_CONFIG.FRONT_URL + '/pages/login.html';
        }

        throw error;
    }
}
import { showError } from 'http://localhost:8080/fe/errorMessageModule.js';

export async function getPerson() {
    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(
            'http://localhost:8081/person/account',
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.status === 401) {
            window.location.href = 'http://localhost:8080/fe/pages/login.html';
        } else if (response.status === 200) {
            return await response.json();
        }
    } catch (error) {
        showError(error.message)

        if (error.response && error.response.status === 401) {
            window.location.href = 'http://localhost:8080/fe/pages/login.html';
        }

        throw error;
    }
}
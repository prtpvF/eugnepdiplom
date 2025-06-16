import { showError } from "http://localhost:8080/fe/errorMessageModule.js";

document.addEventListener('DOMContentLoaded', function() {
    fetchPlaces();

    document.getElementById('routeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createRoute();
    });
});

function fetchPlaces() {
    fetch('http://localhost:8081/place/all')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(places => {
            const select = document.getElementById('place');

            places.forEach(place => {
                const option = document.createElement('option');
                option.value = place.placeId;

                let displayText = place?.suburb ? place.suburb : place.name;
                console.log(place.suburb);
                console.log(place.name);

                option.textContent = displayText;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching places:', error);
            document.getElementById('message').textContent = 'Error loading places. Please try again later.';
            document.getElementById('message').className = 'error';
        });
}

function createRoute() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const placeId = document.getElementById('place').value;
    const token = localStorage.getItem('access_token');
    const form = document.getElementById('routeForm');

    const routeData = {
        name: name,
        description: description,
        placeId: placeId
    };

    if (description.length < 4 || description.length > 2000) {
        showError("описание должно быть быть меньше 3 символов и длинее 2000")
        setTimeout(() => {
           form.reset();
        }, 6000);
        return;
    }

    fetch('http://localhost:8081/route/new', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(routeData)
    })
        .then(response => {
            if (response.ok) {
                showError("Успешно!", 200)
                return response;
            } else {
                showError(response.message, response)
            }
        })
        .then(() => {
            document.getElementById('message').className = 'success';
            document.getElementById('routeForm').reset();
        })
        .catch(error => {
            console.error('Error creating route:', error);
            document.getElementById('message').textContent = 'Error creating route. Please try again.';
            document.getElementById('message').className = 'error';
        });
}
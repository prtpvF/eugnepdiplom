import { API_CONFIG } from  'https://effortless-douhua-d77333.netlify.app/constants.js'

    document.addEventListener("DOMContentLoaded", () => {
        fetch("/components/header.html")
            .then(response => response.text())
            .then(data => {
                document.body.insertAdjacentHTML("afterbegin", data);
                setupDropdownMenu();
                setupSearch();
            })
            .catch(error => console.error("Ошибка загрузки header:", error));
    });

    async function setupDropdownMenu() {
        const dropdownMenu = document.getElementById("routesDropdown");
        const accountMenu = document.getElementById("accountMenu");
        const profileAvatar = document.getElementById("profileAvatar");
        const home = document.getElementById("home");
        const places = document.getElementById("places");
        const routes = document.getElementById("routes");
        const createRoute = document.getElementById("addRoute");
        const contacts = document.getElementById("contacts");
        const login = document.getElementById("login");
        const account = document.getElementById("account");
        const liked = document.getElementById("liked");
        const logout = document.getElementById("logout");

        if (!dropdownMenu || !accountMenu) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            dropdownMenu.style.display = "none";
            accountMenu.style.display = "none";
        } else {

            try {
                const response = await axios.get('https://diplom-5sra.onrender.com/backend/person/account', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(response.status)
                if(response.status !== 401) {
                    login.style.display = 'none'
                    if (response.data.pathToProfileImage) {
                        console.log("test")
                        profileAvatar.src = response.data.pathToProfileImage;
                        profileAvatar.style.width = "40px"
                        profileAvatar.style.height = "40px"
                        account.classList.add('has-avatar');
                    }
                } else {
                    console.log(response.status)
                    dropdownMenu.style.display = "none";
                    accountMenu.style.display = "none";
                    return;
                }
            } catch (error) {
                dropdownMenu.style.display = "none";
                accountMenu.style.display = "none";
                console.error("Ошибка загрузки данных профиля:", error);
                return;
            }

            dropdownMenu.style.display = "block";
            accountMenu.style.display = "block";
        }

        home.onclick = function () {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.replace(API_CONFIG.FRONT_URL +'/pages/home.html')
        }

        createRoute.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.replace(API_CONFIG.FRONT_URL + '/pages/routes/newRoute.html')
        }

        places.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.href = API_CONFIG.FRONT_URL +`/pages/places/allPlaces.html?nocache=${Date.now()}`;
        }

        routes.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.href = API_CONFIG.FRONT_URL +'/pages/routes/route.html'
        }

        contacts.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.replace(API_CONFIG.FRONT_URL +'/pages/contact.html')
        }

        login.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.replace(API_CONFIG.FRONT_URL +'/pages/login.html')
        }

        account.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.href = API_CONFIG.FRONT_URL +'/pages/account.html';
        }

        liked.onclick = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.replace(API_CONFIG.FRONT_URL +'/pages/image/likedImage.html')
        }

        logout.onclick = function (e) {
            localStorage.clear()
            window.location.replace(API_CONFIG.FRONT_URL +'/pages/login.html')
        }

        accountMenu.addEventListener("mouseenter", () => {
            if (token) dropdownMenu.style.display = "block";
        });

        accountMenu.addEventListener("mouseleave", () => {
            dropdownMenu.style.display = "none";
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById("search-input");

        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                performSearch();
            }
        });
    }

    function performSearch() {
        const searchInput = document.getElementById("search-input");
        const query = searchInput.value.trim();

        if (query) {
            const encodedQuery = encodeURIComponent(query);

            window.location.href = API_CONFIG.FRONT_URL +`/pages/search/search.html?query=${encodedQuery}`;
        } else {
            alert("Пожалуйста, введите поисковый запрос");
        }
    }
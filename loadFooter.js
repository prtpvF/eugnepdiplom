document.addEventListener('DOMContentLoaded', function() {
    fetch('/components/footer.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);

            adjustFooterPosition();
        });
});

function adjustFooterPosition() {
    const windowHeight = window.innerHeight;
    const bodyHeight = document.body.offsetHeight;

    if (bodyHeight < windowHeight) {
        const mainContent = document.querySelector('main');
        const neededHeight = windowHeight - mainContent.offsetTop + 50; // +50px для скролла
        mainContent.style.minHeight = `${neededHeight}px`;
    }
}

window.addEventListener('resize', adjustFooterPosition);
export function showError(message, status) {
    const oldToast = document.getElementById('error-toast');
    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'error-toast';
    toast.classList.add('visible');

    const messageElement = document.createElement('span');
    messageElement.id = 'error-message';
    messageElement.textContent = message;

        toast.style.backgroundColor =  (status == 200) ? 'green' : 'red';


    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.onclick = closeToast;

    toast.appendChild(messageElement);
    toast.appendChild(closeButton);

    document.body.appendChild(toast);

    setTimeout(() => {
        closeToast();
    }, 6000);
}

function closeToast() {
    const toast = document.getElementById('error-toast');
    if (toast) {
        toast.remove();
    }
}

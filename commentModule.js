import { showError } from 'http://localhost:8080/fe/errorMessageModule.js';

function getUsernameFromToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || payload.sub;
    } catch (e) {
        console.error('Error parsing token:', e);
        return null;
    }
}

function getRoleFromToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || null;
    } catch (e) {
        console.error('Error parsing token:', e);
        return null;
    }
}

export function updateComments(comments, image) {
    const commentsElement = document.getElementById('comments');
    commentsElement.innerHTML = '';
    const currentUsername = getUsernameFromToken();
    const currentRole = getRoleFromToken();

    if (comments.length === 0) {
        const noComments = document.createElement('div');
        noComments.className = 'no-comments';
        noComments.textContent = 'Нет комментариев';
        commentsElement.appendChild(noComments);
    } else {
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';

            // Добавляем аватарку автора
            const authorAvatar = document.createElement('div');
            authorAvatar.className = 'comment-author-avatar';
            authorAvatar.innerHTML = `
                <img src="${comment.authorImage || 'default-avatar.png'}" alt="${comment.author}">
            `;

            const commentContentWrapper = document.createElement('div');
            commentContentWrapper.className = 'comment-content-wrapper';

            const commentContent = document.createElement('div');
            commentContent.className = 'comment-content';
            commentContent.innerHTML = `
                <strong>${comment.author}:</strong>
                <p>${comment.value}</p>
            `;

            commentContentWrapper.appendChild(commentContent);

            commentElement.appendChild(authorAvatar);
            commentElement.appendChild(commentContentWrapper);

            if (currentUsername && comment.author === currentUsername || currentRole === 'ADMIN') {
                const deleteIcon = document.createElement('div');
                deleteIcon.className = 'delete-comment-icon';
                deleteIcon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                `;

                deleteIcon.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const response = await fetch(`http://localhost:8081/comment/${comment.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                            }
                        });

                        if (response.ok) {
                            const updatedComments = comments.filter(c => c.id !== comment.id);
                            updateComments(updatedComments, image);
                        } else {
                            showError(await response.text());
                        }
                    } catch (error) {
                        showError('Ошибка при удалении комментария');
                        console.error('Ошибка удаления комментария:', error);
                    }
                });

                commentContentWrapper.appendChild(deleteIcon);
            }

            commentsElement.appendChild(commentElement);
        });
    }
}

export function initComments(image, author, onCommentAdded) {
    const submitBtn = document.getElementById('submit-comment-btn');

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const commentInput = document.getElementById('comment-input');
        const commentText = commentInput.value.trim();

        if (!commentText) return;

        try {
            const response = await fetch(`http://localhost:8081/comment/new`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    image: image.id,
                    author: author.username,
                    value: commentText
                })
            });

            if (response.ok) {
                commentInput.value = '';
                if (onCommentAdded) {
                    onCommentAdded();
                }
            } else if (response.status === 401) {
                window.location.replace('./login.html');
            } else {
                showError(await response.text());
            }
        } catch (error) {
            showError('Ошибка при отправке комментария');
            console.error('Ошибка отправки комментария:', error);
        }
    });
}
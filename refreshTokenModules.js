export async function updateToken() {
    const refreshToken = localStorage.getItem( 'refresh_token');

        const response = axios.post(
            'http://localhost:8081/auth/refresh', {
                headers: {"Authorization": `Bearer ${refreshToken}`}
            });

       if(response.ok) {
           const {'access_token': newAccessToken, 'refresh_token': newRefreshToken} = response.data;
           localStorage.setItem('access_token', newAccessToken);
           localStorage.setItem('refresh_token', newRefreshToken);
       } else {
           window.location.href = '/login';
       }


}
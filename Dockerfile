# Wykorzystujemy ultra lekkiego Nginxa na Alpine Linux
FROM nginx:alpine

# Kopiowanie plików aplikacji do publicznego katalogu serwera
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY turing.js /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Standardowy port HTTP
EXPOSE 80

# Uruchomienie Nginxa w trybie pierwszoplanowym
CMD ["nginx", "-g", "daemon off;"]

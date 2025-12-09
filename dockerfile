FROM tiangolo/nginx-rtmp:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY HTML/ /usr/share/nginx/html/
COPY HLS/ /mnt/hls/


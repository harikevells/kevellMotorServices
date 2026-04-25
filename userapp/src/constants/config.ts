// Centralized configuration for the application
// Update this IP if your local machine's IP changes (check with ipconfig)
export const SERVER_IP = '192.168.31.151';
export const SERVER_PORT = '5000';
export const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}/api/`;
export const SOCKET_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

/**
 * Helper to get full image URL from backend path
 * @param path - The path from database (e.g. /uploads/image.jpg)
 */
export const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://${SERVER_IP}:${SERVER_PORT}${path}`;
};

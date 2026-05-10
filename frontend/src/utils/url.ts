export const getAssetUrl = (path: string | undefined): string => {
    if (!path) return "";
    
    // If it's already an absolute URL or a Data URL (base64), return as is
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
    }
    
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    
    // If we have a baseUrl (like http://localhost:8080), use it directly
    if (baseUrl) {
        return `${baseUrl}/${cleanPath.startsWith("uploads/") ? cleanPath : `uploads/${cleanPath}`}`;
    }

    // Fallback to relative path for production/nginx
    if (cleanPath.startsWith("uploads/")) {
        return `/${cleanPath}`;
    }
    return `/uploads/${cleanPath}`;
};

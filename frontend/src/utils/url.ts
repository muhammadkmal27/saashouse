export const getAssetUrl = (path: string | undefined): string => {
    if (!path) return "";
    
    // If it's already an absolute URL or a Data URL (base64), return as is
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
    }
    
    // Use relative path to leverage Next.js proxying for /uploads
    // Ensure path starts with /uploads/
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (cleanPath.startsWith("uploads/")) {
        return `/${cleanPath}`;
    }
    return `/uploads/${cleanPath}`;
};

export const getAssetUrl = (path: string | undefined): string => {
    if (!path) return "";
    
    // If it's already an absolute URL, return as is
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    
    // Use relative path to leverage Next.js proxying for /uploads
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return normalizedPath;
};

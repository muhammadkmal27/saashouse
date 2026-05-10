export const getAssetUrl = (path: string | undefined): string => {
    if (!path) return "";
    
    // If it's already an absolute URL or a Data URL (base64), return as is
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
    }
    
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const isDev = process.env.NODE_ENV === "development";
    
    // In development, use absolute URL if pointing to localhost
    if (isDev && baseUrl && (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))) {
        return `${baseUrl}/${cleanPath.startsWith("uploads/") ? cleanPath : `uploads/${cleanPath}`}`;
    }

    // In production or when using proxy, always use relative path starting with /uploads
    if (cleanPath.startsWith("uploads/")) {
        return `/${cleanPath}`;
    }
    return `/uploads/${cleanPath}`;
};

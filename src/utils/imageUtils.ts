import { Area } from 'react-easy-crop/types';

// Helper functions for image cropping
export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', error => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export const getCroppedImg = async (imageSrc: string, pixelCrop: Area, targetWidth: number, targetHeight: number): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
    );

    return canvas.toDataURL('image/png');
};

export const processImageFile = (
    file: File,
    maxSizeInMB: number = 5,
    acceptedMimeTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png']
): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!acceptedMimeTypes.includes(file.type)) {
            reject(new Error(`Invalid file type. Only ${acceptedMimeTypes.join(', ')} allowed.`));
            return;
        }

        if (file.size > maxSizeInMB * 1024 * 1024) {
            reject(new Error(`File is too large (max. ${maxSizeInMB}MB).`));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.onerror = () => {
            reject(new Error("Error reading file."));
        };
        reader.readAsDataURL(file);
    });
};

export const handleFileChangeForCropping = async (
    file: File | null,
    processFileFn: (file: File, maxSize?: number, types?: string[]) => Promise<string>,
    onSuccess: (base64Image: string) => void,
    onError: (message: string) => void,
    maxSizeInMB: number = 5,
    acceptedMimeTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png']
): Promise<void> => {
    if (!file) {
        onError("No file selected.");
        return;
    }

    try {
        const result = await processFileFn(file, maxSizeInMB, acceptedMimeTypes);
        onSuccess(result);
    } catch (error: any) {
        onError(error.message || String(error) || "Error processing file.");
    }
};

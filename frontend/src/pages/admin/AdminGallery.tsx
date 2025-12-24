import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface GalleryItem {
    id: number;
    image_url: string;
    caption: string;
    created_at: string;
}

const AdminGallery: React.FC = () => {
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const res = await api.get('/gallery');
            setImages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error('Please select an image');

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', caption);

        try {
            await api.post('/gallery/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Image uploaded successfully');
            setCaption('');
            setFile(null);
            fetchImages();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            await api.delete(`/gallery/${id}`);
            toast.success('Image deleted');
            setImages(images.filter(img => img.id !== id));
        } catch (err) {
            toast.error('Failed to delete image');
        }
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gradient-primary">Awards Gallery Manager</h1>

            {/* Upload Section */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" /> Upload New Image
                </h2>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Select Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-muted-foreground
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary/20 file:text-primary
                            hover:file:bg-primary/30"
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Caption (Optional)</label>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="e.g. Best Performer 2024"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((img) => (
                    <div key={img.id} className="bg-card rounded-xl border border-border overflow-hidden group relative">
                        <div className="aspect-video bg-muted relative">
                            <img
                                src={img.image_url.startsWith('http') ? img.image_url : `${API_URL}${img.image_url}`}
                                alt={img.caption}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(img.id)}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                    title="Delete Image"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {img.caption && (
                            <div className="p-3 border-t border-border">
                                <p className="text-sm font-medium truncate" title={img.caption}>{img.caption}</p>
                            </div>
                        )}
                    </div>
                ))}
                {images.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No images in gallery yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGallery;

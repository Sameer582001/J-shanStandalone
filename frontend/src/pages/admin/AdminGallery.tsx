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
            <div className="glass-card p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md bg-white/60">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    Upload New Image
                </h2>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-full md:w-1/3 space-y-2">
                        <label className="block text-sm font-bold text-foreground">Select Image</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-muted-foreground
                                file:mr-4 file:py-2.5 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-bold
                                file:bg-primary/10 file:text-primary
                                hover:file:bg-primary/20 cursor-pointer
                                border border-input rounded-xl bg-white/50 backdrop-blur-sm p-1 transition-all group-hover:border-primary/50"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                        <label className="block text-sm font-bold text-foreground">Caption (Optional)</label>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/50 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/70"
                            placeholder="e.g. Best Performer 2024"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((img) => (
                    <div key={img.id} className="glass-card rounded-2xl border border-white/20 overflow-hidden group relative shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                            <img
                                src={img.image_url.startsWith('http') ? img.image_url : `${API_URL}${img.image_url}`}
                                alt={img.caption}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button
                                    onClick={() => handleDelete(img.id)}
                                    className="bg-white/10 backdrop-blur-md text-white border border-white/20 p-3 rounded-full hover:bg-rose-500/80 hover:border-rose-500 transition-all transform hover:scale-110 shadow-lg"
                                    title="Delete Image"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        {img.caption && (
                            <div className="p-4 border-t border-white/10 bg-white/60 backdrop-blur-md">
                                <p className="text-sm font-bold text-foreground truncate" title={img.caption}>{img.caption}</p>
                            </div>
                        )}
                    </div>
                ))}
                {images.length === 0 && (
                    <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-primary/20 rounded-2xl bg-white/30 backdrop-blur-sm flex flex-col items-center">
                        <div className="p-4 bg-primary/5 rounded-full mb-4">
                            <ImageIcon className="w-12 h-12 text-primary/40" />
                        </div>
                        <p className="text-lg font-medium">No images in gallery yet</p>
                        <p className="text-sm opacity-70">Upload your first image above</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGallery;

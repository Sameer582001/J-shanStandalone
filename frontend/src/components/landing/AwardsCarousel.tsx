import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryItem {
    id: number;
    image_url: string;
    caption: string;
}

export const AwardsCarousel: React.FC = () => {
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const res = await api.get('/gallery');
                setImages(res.data);
            } catch (err) {
                console.error("Failed to load gallery", err);
            }
        };
        fetchImages();
    }, []);

    const next = () => setCurrent((curr) => (curr + 1) % images.length);
    const prev = () => setCurrent((curr) => (curr - 1 + images.length) % images.length);

    // Auto-advance
    useEffect(() => {
        if (images.length === 0) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [images.length]);


    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Our Achievers</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Celebrating the success of our dedicated leaders
                </p>
            </div>

            {images.length > 0 ? (
                <div className="max-w-5xl mx-auto relative group">
                    {/* Main Slider */}
                    <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                <img
                                    // Construct full URL if relative
                                    src={img.image_url.startsWith('http') ? img.image_url : `${API_URL}${img.image_url}`}
                                    alt={img.caption || 'Award'}
                                    className="w-full h-full object-cover"
                                />
                                {img.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-center">
                                        <p className="text-white text-xl font-bold">{img.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-primary/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-primary/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-primary w-6' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border">
                    <p className="text-xl text-muted-foreground font-medium">Gallery Coming Soon...</p>
                    <p className="text-sm text-muted-foreground mt-2">Images will appear here once uploaded by Admin.</p>
                </div>
            )}
        </section>
    );
};

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, X } from 'lucide-react';

interface DocItem {
    id: number;
    title: string;
    file_url: string;
}

export const LegalDocuments: React.FC = () => {
    const [docs, setDocs] = useState<DocItem[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await api.get('/documents');
                setDocs(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDocs();
    }, []);

    if (docs.length === 0) return null;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Legal Documents</h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {docs.map((doc) => (
                        <div
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className="bg-background border border-border p-6 rounded-xl flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{doc.title}</h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Click to view</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PDF Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-background w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                        {/* Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                {selectedDoc.title}
                            </h3>
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 bg-muted/50 overflow-hidden relative">
                            <iframe
                                src={selectedDoc.file_url.startsWith('http') ? selectedDoc.file_url : `${API_URL}${selectedDoc.file_url}`}
                                className="w-full h-full"
                                title={selectedDoc.title}
                            />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Upload, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocItem {
    id: number;
    title: string;
    file_url: string;
    created_at: string;
}

const AdminDocuments: React.FC = () => {
    const [docs, setDocs] = useState<DocItem[]>([]);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await api.get('/documents');
            setDocs(res.data);
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
        if (!file) return toast.error('Please select a PDF file');

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Document uploaded successfully');
            setTitle('');
            setFile(null);
            fetchDocs();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.delete(`/documents/${id}`);
            toast.success('Document deleted');
            setDocs(docs.filter(d => d.id !== id));
        } catch (err) {
            toast.error('Failed to delete document');
        }
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gradient-primary">Legal Documents Manager</h1>

            {/* Upload Section */}
            <div className="glass-card p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md bg-white/60">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    Upload New Document
                </h2>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-full md:w-1/3 space-y-2">
                        <label className="block text-sm font-bold text-foreground">Select PDF</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf"
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
                        <label className="block text-sm font-bold text-foreground">Document Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/50 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/70"
                            placeholder="e.g. Terms and Conditions"
                            required
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

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {docs.map((doc) => (
                    <div key={doc.id} className="glass-card p-4 rounded-xl border border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors group backdrop-blur-md bg-white/60">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center border border-red-200">
                                <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{doc.title}</h3>
                                <a
                                    href={doc.file_url.startsWith('http') ? doc.file_url : `${API_URL}${doc.file_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-medium text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 mt-0.5"
                                >
                                    View PDF document
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-lg transition-all"
                            title="Delete"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDocuments;

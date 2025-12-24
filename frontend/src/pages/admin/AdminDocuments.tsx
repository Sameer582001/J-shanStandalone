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
            <div className="bg-card p-6 rounded-xl border border-border">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" /> Upload New Document
                </h2>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Select PDF</label>
                        <input
                            type="file"
                            accept=".pdf"
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Document Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="e.g. Terms and Conditions"
                            required
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

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {docs.map((doc) => (
                    <div key={doc.id} className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">{doc.title}</h3>
                                <a
                                    href={doc.file_url.startsWith('http') ? doc.file_url : `${API_URL}${doc.file_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-primary hover:underline"
                                >
                                    View PDF
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
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

import React, { useState, useEffect } from 'react';
import { HiXMark, HiDocumentText, HiPlayCircle, HiCodeBracket, HiQuestionMarkCircle, HiSparkles } from 'react-icons/hi2';
import coursesService from '../../services/coursesService';

const MaterialEditorModal = ({ isOpen, onClose, onSaveSuccess, material, chapterId }) => {
    const [formData, setFormData] = useState({
        title: '',
        type: 'text',
        content: '',
        url: '' // We keep this to see the latest URL
    });

    const [originalContent, setOriginalContent] = useState('');
    const [isContentLoading, setIsContentLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsContentLoading(false);
            if (material) {
                setFormData({
                    title: material.title || '',
                    type: material.originalType || 'text',
                    content: '',
                    url: material.url || ''
                });

                if (material.url) {
                    setIsContentLoading(true);
                    fetch(material.url)
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.text();
                        })
                        .then(text => {
                            setFormData(prev => ({ ...prev, content: text }));
                            setOriginalContent(text);
                        })
                        .catch(err => {
                            console.error("Failed to fetch material content:", err);
                            setError('Failed to load existing content. You can still edit and save.');
                        })
                        .finally(() => setIsContentLoading(false));
                } else {
                    setOriginalContent(material.content || '');
                }
            } else {
                setFormData({ title: '', type: 'text', content: '', url: '' });
                setOriginalContent('');
            }
        }
    }, [material, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            let result;
            let savedMaterialId = material?.id;

            const metadataPayload = {
                title: formData.title,
                type: formData.type,
                chapterId: chapterId
            };

            if (material) {
                result = await coursesService.updateMaterial(savedMaterialId, metadataPayload);
            } else {
                const newMaterialResponse = await coursesService.createMaterialForChapter(metadataPayload);
                savedMaterialId = newMaterialResponse.data.materialId;
                result = newMaterialResponse;
            }

            const contentHasChanged = formData.content !== originalContent;
            if (savedMaterialId && formData.content && contentHasChanged) {
                await coursesService.updateMaterialContent(savedMaterialId, formData.content);
            }

            onSaveSuccess(result.data); // Return the saved/updated material data
            onClose();

        } catch (err) {
            console.error("Error saving material:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const materialTypes = [
        { value: 'text', label: 'Text/Markdown', icon: HiDocumentText },
        { value: 'video', label: 'Video', icon: HiPlayCircle },
        { value: 'md', label: 'Article (MD)', icon: HiDocumentText },
        { value: 'code', label: 'Code', icon: HiCodeBracket },
        { value: 'quiz', label: 'Quiz', icon: HiQuestionMarkCircle },
        { value: 'exercise', label: 'Exercise', icon: HiSparkles }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">{material ? 'Edit Material' : 'Add New Material'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <HiXMark className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 space-y-4 overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        >
                            {materialTypes.map(mt => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown supported)</label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows="15"
                            placeholder={isContentLoading ? "Loading content from URL..." : "## Your Title Here..."}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                            disabled={isContentLoading}
                        />
                    </div>
                </main>

                <footer className="p-4 border-t flex justify-end items-center space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
                        disabled={isSaving || isContentLoading}
                    >
                        {isSaving ? 'Saving...' : (material ? 'Save Changes' : 'Create Material')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default MaterialEditorModal;
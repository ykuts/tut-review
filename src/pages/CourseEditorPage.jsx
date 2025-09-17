import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import coursesService from '../services/coursesService';
import MaterialEditorModal from '../components/dashboard/MaterialEditorModal';
import {
    HiPencil, HiTrash, HiPlusCircle, HiArrowLeft, HiCheck, HiXMark,
    HiOutlineBookOpen, HiOutlineDocumentText, HiOutlinePlayCircle, HiOutlineCodeBracket, HiAcademicCap, HiFolder
} from 'react-icons/hi2';

// Helper to get an icon based on material type
const getMaterialIcon = (type) => {
    const iconClass = "w-5 h-5 text-gray-500";
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return <HiOutlinePlayCircle className={iconClass} />;
    if (typeLower.includes('code')) return <HiOutlineCodeBracket className={iconClass} />;
    if (typeLower.includes('text') || typeLower.includes('md') || typeLower.includes('markdown')) return <HiOutlineDocumentText className={iconClass} />;
    return <HiOutlineBookOpen className={iconClass} />;
};


const CourseEditorPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // State for data, loading, and errors
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // State for the material editor modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [currentChapterId, setCurrentChapterId] = useState(null);
    const [currentModuleId, setCurrentModuleId] = useState(null);

    // State for inline editing of module/chapter titles
    const [editingItem, setEditingItem] = useState(null); // { type, id, value }

    const loadCourse = useCallback(async () => {
        if (!courseId) {
            setCourse({ title: '', description: '', slug: '', modules: [] });
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const courseResult = await coursesService.getCourseById(courseId);
            if (courseResult.success) {
                const courseData = courseResult.data;
                const modulesResult = await coursesService.getModulesByCourse(courseId);
                let modules = modulesResult.success ? modulesResult.data : [];

                modules = await Promise.all(modules.map(async mod => {
                    const chaptersResult = await coursesService.getChaptersByModule(mod.moduleId);
                    let chapters = chaptersResult.success ? chaptersResult.data : [];
                    
                    chapters = await Promise.all(chapters.map(async chap => {
                        const materialsResult = await coursesService.getChapterMaterials(chap.chapterId);
                        const materials = materialsResult.success ? materialsResult.data : [];
                        return { ...chap, materials };
                    }));
                    
                    return { ...mod, chapters };
                }));

                setCourse({ ...courseData, modules });
            } else {
                setError(courseResult.error || "Failed to load course data.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [courseId]);


    useEffect(() => {
        loadCourse();
    }, [loadCourse]);

    const handleCourseChange = (e) => {
        setCourse({ ...course, [e.target.name]: e.target.value });
    };

    const handleSaveCourseDetails = async () => {
        setIsSaving(true);
        try {
            if (courseId) {
                await coursesService.updateCourse(courseId, { title: course.title, description: course.description });
                // No reload needed, UI is already up-to-date from handleCourseChange
            } else {
                const newCourse = await coursesService.createCourse({ title: course.title, description: course.description });
                navigate(`/edit-course/${newCourse.data.courseId}`);
            }
            // Use a more subtle notification in a real app
            console.log('Course details saved!');
        } catch (err) {
            alert(`Error saving course: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddItem = async (type, parentId) => {
        const title = prompt(`Enter new ${type} title:`);
        if (title) {
            setIsSaving(true);
            try {
                if (type === 'module') {
                    const result = await coursesService.createModuleForCourse({ title, courseId });
                    const newModule = result.data;
                    setCourse(prev => ({
                        ...prev,
                        modules: [...prev.modules, { ...newModule, chapters: [] }] // Add empty chapters array
                    }));
                }
                if (type === 'chapter') {
                    const result = await coursesService.createChapterForModule({ title, moduleId: parentId });
                    const newChapter = result.data;
                    setCourse(prev => ({
                        ...prev,
                        modules: prev.modules.map(mod => 
                            mod.moduleId === parentId
                                ? { ...mod, chapters: [...mod.chapters, { ...newChapter, materials: [] }] }
                                : mod
                        )
                    }));
                }
            } catch (err) {
                alert(`Error adding ${type}: ${err.message}`);
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    const handleDeleteItem = async (type, id, parentId = null) => {
        if (window.confirm(`Are you sure you want to delete this ${type}? This is irreversible.`)) {
            try {
                if (type === 'module') {
                    await coursesService.deleteModule(id);
                    setCourse(prev => ({
                        ...prev,
                        modules: prev.modules.filter(mod => mod.moduleId !== id)
                    }));
                }
                if (type === 'chapter') {
                    await coursesService.deleteChapter(id);
                    setCourse(prev => ({
                        ...prev,
                        modules: prev.modules.map(mod => 
                            mod.moduleId === parentId
                                ? { ...mod, chapters: mod.chapters.filter(chap => chap.chapterId !== id) }
                                : mod
                        )
                    }));
                }
                if (type === 'material') {
                    await coursesService.deleteMaterial(id);
                    setCourse(prev => ({
                        ...prev,
                        modules: prev.modules.map(mod => ({
                            ...mod,
                            chapters: mod.chapters.map(chap => 
                                chap.chapterId === parentId
                                    ? { ...chap, materials: chap.materials.filter(mat => mat.id !== id) }
                                    : chap
                            )
                        }))
                    }));
                }
            } catch (err) {
                alert(`Error deleting ${type}: ${err.message}`);
            }
        }
    };

    const handleMaterialSave = (savedMaterial) => {
        const isEditing = !!editingMaterial; // Check if it was an edit or creation

        setCourse(prev => {
            const newModules = prev.modules.map(mod => {
                // Find the right module
                if (mod.moduleId !== currentModuleId) return mod;

                const newChapters = mod.chapters.map(chap => {
                    // Find the right chapter
                    if (chap.chapterId !== savedMaterial.chapterId) return chap;
                    
                    let newMaterials;
                    if (isEditing) {
                        // Update existing material
                        newMaterials = chap.materials.map(mat => mat.id === savedMaterial.id ? savedMaterial : mat);
                    } else {
                        // Add new material
                        newMaterials = [...chap.materials, savedMaterial];
                    }
                    return { ...chap, materials: newMaterials };
                });
                return { ...mod, chapters: newChapters };
            });
            return { ...prev, modules: newModules };
        });

        // Clear the editing state after save
        setEditingMaterial(null);
        setCurrentChapterId(null);
        setCurrentModuleId(null);
    };
    
    const handleSaveEditedTitle = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            if (editingItem.type === 'module') {
                const result = await coursesService.updateModule(editingItem.id, { title: editingItem.value });
                const updatedModule = result.data;
                setCourse(prev => ({
                    ...prev,
                    modules: prev.modules.map(mod => mod.moduleId === editingItem.id ? { ...mod, ...updatedModule } : mod)
                }));
            }
            if (editingItem.type === 'chapter') {
                const result = await coursesService.updateChapter(editingItem.id, { title: editingItem.value });
                const updatedChapter = result.data;
                setCourse(prev => ({
                    ...prev,
                    modules: prev.modules.map(mod => ({
                        ...mod,
                        chapters: mod.chapters.map(chap => chap.chapterId === editingItem.id ? { ...chap, ...updatedChapter } : chap)
                    }))
                }));
            }
            setEditingItem(null);
        } catch (err) {
            alert(`Error updating title: ${err.message}`)
        } finally {
            setIsSaving(false);
        }
    };

    const openMaterialModal = (material, chapterId, moduleId) => {
        setEditingMaterial(material);
        setCurrentChapterId(chapterId);
        setCurrentModuleId(moduleId);
        setIsModalOpen(true);
    };

    if (loading) return <div className="text-center p-10">Loading course editor...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

    const renderItemHeader = (type, item, deleteHandler) => {
        const id = type === 'module' ? item.moduleId : item.chapterId;
        const isEditing = editingItem && editingItem.type === type && editingItem.id === id;
        
        const labelText = type.charAt(0).toUpperCase() + type.slice(1);
        const labelColor = type === 'module' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

        return (
            <div className="flex justify-between items-center w-full">
                {isEditing ? (
                    <div className="flex-grow flex items-center gap-2">
                        <input
                            type="text"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                            className="w-full text-xl font-bold p-2 border-b-2 bg-yellow-50 focus:outline-none focus:border-red-500"
                            autoFocus
                        />
                        <button onClick={handleSaveEditedTitle} className="p-1 text-green-600 hover:text-green-800"><HiCheck className="w-5 h-5"/></button>
                        <button onClick={() => setEditingItem(null)} className="p-1 text-red-600 hover:text-red-800"><HiXMark className="w-5 h-5"/></button>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center gap-4 group">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${labelColor}`}>{labelText}</span>
                        <h2 className={`font-bold ${type === 'module' ? 'text-2xl' : 'text-xl'}`}>{item.title}</h2>
                        <button
                            onClick={() => setEditingItem({ type, id, value: item.title })}
                            className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600"
                        >
                            <HiPencil className="w-5 h-5" />
                        </button>
                    </div>
                )}
                
                <button onClick={() => deleteHandler()} className="p-1 text-gray-400 hover:text-red-600"><HiTrash className="w-5 h-5" /></button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <MaterialEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={handleMaterialSave}
                material={editingMaterial}
                chapterId={currentChapterId}
            />
            
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 mb-4 hover:text-gray-900">
                    <HiArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
                </button>

                {/* Course Details Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border relative">
                    <span className="absolute top-0 left-4 -translate-y-1/2 px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Course</span>
                    <h1 className="text-3xl font-bold mt-4 mb-4">Edit Course</h1>
                    <div className="space-y-4">
                        <input name="title" value={course?.title || ''} onChange={handleCourseChange} placeholder="Course Title" className="w-full text-2xl font-bold p-2 border-b-2 focus:outline-none focus:border-red-500" />
                        <textarea name="description" value={course?.description || ''} onChange={handleCourseChange} placeholder="Course Description" className="w-full text-gray-600 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows="3" />
                         <button onClick={handleSaveCourseDetails} disabled={isSaving} className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400">
                            {isSaving ? 'Saving...' : 'Save Course Details'}
                        </button>
                    </div>
                </div>

                {/* Modules, Chapters, and Materials */}
                {courseId && course?.modules?.map(mod => (
                    <div key={mod.moduleId} className="bg-white p-6 rounded-2xl shadow-lg mb-6 border">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            {renderItemHeader('module', mod, () => handleDeleteItem('module', mod.moduleId, courseId))}
                        </div>
                        
                        <div className="space-y-4 pl-4">
                            {mod.chapters?.map(chap => (
                                <div key={chap.chapterId} className="bg-gray-50 p-4 rounded-xl border">
                                    <div className="flex justify-between items-center mb-3">
                                        {renderItemHeader('chapter', chap, () => handleDeleteItem('chapter', chap.chapterId, mod.moduleId))}
                                    </div>
                                    
                                    {/* Materials List */}
                                    <div className="pl-4 space-y-2">
                                        {chap.materials?.length > 0 ? (
                                            chap.materials.map(mat => (
                                                <div key={mat.id} className="flex items-center justify-between p-2 bg-white rounded-md border group">
                                                    <div className="flex items-center gap-3">
                                                        {getMaterialIcon(mat.originalType)}
                                                        <span className="text-sm font-medium">{mat.title}</span>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{mat.originalType}</span>
                                                    </div>
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 gap-2">
                                                        <button onClick={() => openMaterialModal(mat, chap.chapterId, mod.moduleId)} className="p-1 text-gray-500 hover:text-blue-700"><HiPencil className="w-4 h-4"/></button>
                                                        <button onClick={() => handleDeleteItem('material', mat.id, chap.chapterId)} className="p-1 text-gray-500 hover:text-red-700"><HiTrash className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-center text-gray-500 py-2">No materials in this chapter yet.</p>
                                        )}
                                        <button onClick={() => openMaterialModal(null, chap.chapterId, mod.moduleId)} className="w-full mt-2 flex items-center justify-center p-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md border-2 border-dashed">
                                            <HiPlusCircle className="w-5 h-5 mr-1" /> Add Material
                                        </button>
                                    </div>
                                </div>
                            ))}
                             <button onClick={() => handleAddItem('chapter', mod.moduleId)} className="w-full mt-4 flex items-center justify-center p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border-2 border-dashed">
                                <HiPlusCircle className="w-5 h-5 mr-1" /> Add Chapter to this Module
                            </button>
                        </div>
                    </div>
                ))}
                
                {courseId && (
                     <button onClick={() => handleAddItem('module', courseId)} className="w-full p-4 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center">
                        <HiPlusCircle className="w-6 h-6 mr-2" /> Add New Module
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseEditorPage;
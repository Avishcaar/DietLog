import { useState, useRef } from 'react';
import { Upload, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import API from './api';
import '../styles/meal-upload.css';
import ricebowlGif from '../assets/ricebowl.gif';

export const MealImageUpload = ({ onAnalysisComplete }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        setError(null);

        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size must be less than 10MB');
            return;
        }

        setSelectedImage(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedImage);

            const response = await API.post('/analyze-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.data && onAnalysisComplete) {
                const transformedData = {
                    foodItems: response.data.data.foodItems || [],
                    totalNutrition: response.data.data.nutrition || {}
                };
                console.log('Transformed data:', transformedData);
                onAnalysisComplete(transformedData);
            }

            resetForm();
        } catch (err) {
            console.error('Error analyzing image:', err);
            setError(
                err.response?.data?.message ||
                'Failed to analyze image. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleZoneClick = () => {
        if (!loading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="meal-upload-container">
            {loading ? (
                <div className="loading-container">
                    <img src={ricebowlGif} alt="Analyzing..." className="loading-gif" />
                    <p className="loading-text">Analyzing your meal...</p>
                    <p className="loading-subtext">Our AI Agent is detecting food items and calculating nutrition</p>
                </div>
            ) : (
                <>
                    {!imagePreview && (
                        <div
                            className={`drag-drop-zone ${isDragging ? 'drag-active' : ''}`}
                            onClick={handleZoneClick}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="upload-icon-container">
                                <Upload className="upload-icon" size={60} />
                            </div>

                            <h3 className="upload-title">
                                {isDragging ? 'Drop your image here' : 'Upload Meal Photo'}
                            </h3>

                            <p className="upload-subtitle">
                                Drag and drop or click to select an image
                            </p>

                            <div className="upload-hint">
                                <ImageIcon size={16} />
                                <span> Our AI Agent will analyze and detect all food items</span>
                            </div>

                            <div className="supported-formats">
                                <span className="format-badge">JPEG</span>
                                <span className="format-badge">PNG</span>
                                <span className="format-badge">WebP</span>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className="file-input"
                            />
                        </div>
                    )}

                    {imagePreview && (
                        <div className="image-preview-container">
                            <div className="preview-header">
                                <h3 className="preview-title">Selected Image</h3>
                                <button
                                    onClick={resetForm}
                                    className="remove-image-btn"
                                    type="button"
                                >
                                    <X size={18} />
                                    <span>Remove</span>
                                </button>
                            </div>

                            <img
                                src={imagePreview}
                                alt="Meal preview"
                                className="image-preview"
                            />

                            <button
                                onClick={handleAnalyze}
                                className="analyze-button"
                                disabled={loading}
                            >
                                <Sparkles size={20} />
                                <span>Analyze with AI</span>
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="upload-error">
                            {error}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MealImageUpload;

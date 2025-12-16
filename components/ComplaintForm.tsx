
import React, { useState, useRef } from 'react';
import { analyzeWasteImage, getLocationFromCoordinates, verifyComplaintAuthenticity } from '../services/geminiService';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface ComplaintFormProps {
  onSubmit: (location: string, description: string, imageUrl?: string, isPublic?: boolean, authenticityStatus?: 'Unverified' | 'Likely Authentic' | 'Potential Spam') => void;
  onCancel: () => void;
  language: Language;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit, onCancel, language }) => {
  const [location, setLocation] = useState('');
  const [locationLink, setLocationLink] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const { address, mapLink } = await getLocationFromCoordinates(latitude, longitude);
                if (address) {
                    setLocation(address);
                    if (mapLink) setLocationLink(mapLink);
                } else {
                    // Fallback to coords if no address name returned
                    setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                }
            } catch (error) {
                console.error("Error getting location info:", error);
            } finally {
                setIsLocating(false);
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
            setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Stop any existing streams first
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facingMode } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOpen(true);
        
        // Try to get location when camera starts if not already set
        if (!location && !isLocating) {
            fetchLocation();
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Could not access camera. Please check permissions.");
      }
    }
  };

  const switchCamera = () => {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newMode);
      
      // Stop current
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      
      navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } }).then(stream => {
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      });
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setImage(dataUrl);
      stopCamera();
    }
  };

  const handleAnalyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeWasteImage(image);
      setDescription(prev => {
        const prefix = prev ? prev + "\n\nAI Analysis: " : "AI Analysis: ";
        return prefix + analysis;
      });
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleManualVerification = async () => {
    if (!description && !image) {
        alert("Please provide a description or image to verify.");
        return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    try {
        const status = await verifyComplaintAuthenticity(description, image || undefined);
        setVerificationResult(status);
    } catch (error) {
        console.error("Verification failed", error);
        alert("Failed to verify content.");
    } finally {
        setIsVerifying(false);
    }
  };

  const processSubmission = async (finalLocation: string) => {
    setIsSubmitting(true);
    try {
        let finalIsPublic = isPublic;
        let finalAuthStatus: 'Unverified' | 'Likely Authentic' | 'Potential Spam' = 'Unverified';
        
        // If we already verified manually, use that result
        if (verificationResult && (verificationResult === 'Likely Authentic' || verificationResult === 'Potential Spam')) {
             finalAuthStatus = verificationResult;
        } else if (isPublic) {
             // If user wants it public but hasn't manually verified, verify now
            try {
                const status = await verifyComplaintAuthenticity(description, image || undefined);
                finalAuthStatus = status;
            } catch (err) {
                console.error("Authenticity check failed:", err);
                finalIsPublic = false; 
            }
        }
        
        if (finalAuthStatus === 'Potential Spam') {
             alert("AI Check: This report has been flagged as potentially off-topic or invalid. It has been submitted privately for administrator review.");
             finalIsPublic = false;
        }

        onSubmit(finalLocation, description, image || undefined, finalIsPublic, finalAuthStatus);
    } catch (e) {
        console.error("Submission error:", e);
        alert("An error occurred during submission.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description) {
      alert("Please provide a description.");
      return;
    }

    if (!image) {
      alert("An image is required to file a complaint.");
      return;
    }

    // If location is provided, submit directly
    if (location) {
      processSubmission(location);
      return;
    }

    // If location is missing, attempt auto-detection
    if (!navigator.geolocation) {
      alert("Location is required and Geolocation is not supported. Please enter it manually.");
      return;
    }

    if (window.confirm("Location is missing. Auto-detect current location for this complaint?")) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const { address, mapLink } = await getLocationFromCoordinates(latitude, longitude);
                    const detectedLocation = address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                    
                    setLocation(detectedLocation);
                    if (mapLink) setLocationLink(mapLink);
                    
                    // Confirmation step before final submission
                    if (window.confirm(`Detected location: "${detectedLocation}".\n\nProceed with submission?`)) {
                         processSubmission(detectedLocation);
                    }
                } catch (error) {
                    console.error("Error getting location info:", error);
                    alert("Could not detect location automatically. Please enter it manually.");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                alert("Could not access location. Please check permissions or enter manually.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
  };
  
  const handleCancel = () => {
      stopCamera();
      onCancel();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">{getTranslation(language, 'fileComplaint')}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTranslation(language, 'location')}</label>
              {isLocating && <span className="text-xs text-green-600 animate-pulse">Detecting location...</span>}
          </div>
          <div className="relative">
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white"
                placeholder="e.g., Library, 2nd Floor"
              />
               <button 
                 type="button" 
                 onClick={fetchLocation} 
                 className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500"
                 title="Get current location"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
               </button>
          </div>
          {locationLink && (
              <a href={locationLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  Verified with Google Maps
              </a>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTranslation(language, 'description')}</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white"
            placeholder="Describe the issue in detail."
            required
          />
        </div>

        <div className="flex items-center">
            <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                {getTranslation(language, 'makePublic')}
            </label>
        </div>
        
        {isCameraOpen ? (
          <div className="text-center relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-[60vh] object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-6 items-center">
                <button type="button" onClick={stopCamera} className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <button type="button" onClick={takePicture} className="p-5 bg-white border-4 border-gray-300 rounded-full hover:bg-gray-100 shadow-lg focus:outline-none transform hover:scale-110 transition-transform"></button>
                 <button type="button" onClick={switchCamera} className="p-3 bg-gray-600 bg-opacity-50 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            {isLocating && (
                 <div className="absolute top-4 left-0 right-0 text-center">
                    <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        📍 Locating...
                    </span>
                 </div>
            )}
          </div>
        ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add a Photo <span className="text-red-500">*</span></label>
              <div className="mt-2 flex justify-center items-center space-x-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                <button type="button" onClick={startCamera} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {getTranslation(language, 'takePhoto')}
                </button>
              </div>
            </div>
        )}

        {image && !isCameraOpen && (
          <div className="text-center bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Preview:</p>
            <img src={image} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-md mb-4 object-contain" />
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button type="button" onClick={() => setImage(null)} className="px-3 py-2 text-sm text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors">Remove Image</button>
                <div className="flex gap-2 justify-center">
                    <button 
                        type="button" 
                        onClick={handleAnalyzeImage} 
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:opacity-70 flex items-center transition-colors shadow-sm"
                    >
                        {isAnalyzing ? 'Analyzing...' : getTranslation(language, 'analyze')}
                    </button>
                    
                </div>
            </div>
          </div>
        )}
        
        {/* Manual Verification Button */}
        {(description || image) && !isCameraOpen && (
             <div className="flex flex-col items-center mt-4">
                <button 
                    type="button" 
                    onClick={handleManualVerification} 
                    disabled={isVerifying}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-70 flex items-center transition-colors shadow-sm"
                >
                    {isVerifying ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Checking...
                         </>
                    ) : getTranslation(language, 'checkAuthenticity')}
                </button>
                {verificationResult && (
                    <div className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        verificationResult === 'Likely Authentic' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {getTranslation(language, 'verificationResult')}: {verificationResult}
                    </div>
                )}
             </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={handleCancel} disabled={isSubmitting} className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
            {getTranslation(language, 'cancel')}
          </button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center">
            {isSubmitting ? (
                <>
                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </>
            ) : getTranslation(language, 'submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;

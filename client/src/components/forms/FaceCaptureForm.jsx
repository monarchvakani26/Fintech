// ============================================================
// Rakshak AI — Face Capture & Embedding
// Uses webcam + face-api.js to extract 128-dim face embedding
// Stores ONLY the embedding, never the raw image.
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ShieldCheck, AlertTriangle, Loader, X, ScanFace, CheckCircle } from 'lucide-react';

export default function FaceCaptureForm({ data, onChange, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | camera | detecting | success | error
  const [error, setError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const faceApiRef = useRef(null);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      const faceapi = await import('face-api.js');
      faceApiRef.current = faceapi;

      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      console.log('[FaceCapture] Models loaded successfully');
    } catch (err) {
      console.error('[FaceCapture] Model load error:', err);
      setError('Failed to load face detection models. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setStatus('camera');

      if (!modelsLoaded) {
        await loadModels();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (err) {
      console.error('[FaceCapture] Camera error:', err);
      setError(err.message === 'Permission denied'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Failed to access camera: ' + err.message);
      setStatus('error');
    }
  }, [modelsLoaded, loadModels]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
    if (status !== 'success') setStatus('idle');
  }, [status]);

  // Capture face and generate embedding
  const captureFace = useCallback(async () => {
    if (!videoRef.current || !faceApiRef.current || !canvasRef.current) return;
    
    const faceapi = faceApiRef.current;
    setStatus('detecting');
    setLoading(true);

    try {
      // Detect face with landmarks and compute descriptor
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please face the camera directly and ensure good lighting.');
        setStatus('camera');
        setLoading(false);
        return;
      }

      // Extract the 128-dimensional embedding
      const embedding = Array.from(detection.descriptor);
      const confidence = detection.detection.score;

      // Draw detection box on canvas
      const canvas = canvasRef.current;
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(detection, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);

      // DON'T store image, only the embedding
      onChange({
        face_embedding: embedding,
        embedding_model: 'face-api.js',
        confidence: Math.round(confidence * 100) / 100,
        captured_at: new Date().toISOString(),
        dimensions: embedding.length,
      });

      setFaceDetected(true);
      setStatus('success');
      setError(null);

      // Stop camera after successful capture
      setTimeout(() => stopCamera(), 2000);
    } catch (err) {
      console.error('[FaceCapture] Detection error:', err);
      setError('Face detection failed: ' + err.message);
      setStatus('camera');
    } finally {
      setLoading(false);
    }
  }, [onChange, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
          <ScanFace className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Biometric Verification</h3>
          <p className="text-sm text-white/50">Face capture — only embedding stored</p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <ShieldCheck className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-amber-400">Privacy-First Design</p>
          <p className="text-xs text-amber-400/70 mt-0.5">
            Your face image is processed locally and immediately discarded. 
            Only a 128-dimensional numeric vector (embedding) is stored — it cannot be reverse-engineered into an image.
          </p>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10" style={{ aspectRatio: '4/3' }}>
        <AnimatePresence mode="wait">
          {status === 'idle' && !data.face_embedding && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
                <Camera className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-sm text-white/40">Camera inactive</p>
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold
                  bg-gradient-to-r from-rose-500 to-pink-600 text-white
                  hover:from-rose-600 hover:to-pink-700 active:scale-95
                  transition-all duration-300 shadow-lg shadow-rose-500/20
                  disabled:opacity-40"
              >
                Start Face Capture
              </button>
            </motion.div>
          )}

          {(status === 'camera' || status === 'detecting') && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner markers */}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-rose-400 rounded-tl-xl" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-rose-400 rounded-tr-xl" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-rose-400 rounded-bl-xl" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-rose-400 rounded-br-xl" />
                
                {/* Scanning line */}
                {status === 'detecting' && (
                  <motion.div
                    className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent"
                    animate={{ top: ['15%', '85%', '15%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={captureFace}
                  disabled={loading}
                  className="px-6 py-3 rounded-full font-bold text-sm
                    bg-gradient-to-r from-rose-500 to-pink-600 text-white
                    hover:from-rose-600 hover:to-pink-700 active:scale-95
                    transition-all duration-300 shadow-lg shadow-rose-500/30
                    disabled:opacity-40 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-4 h-4" />
                      Capture Face
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <p className="text-lg font-bold text-emerald-400">Face Registered</p>
              <p className="text-xs text-white/40 mt-1">
                {data.dimensions}-dim embedding captured at {Math.round((data.confidence || 0) * 100)}% confidence
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status indicator */}
        {cameraActive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Embedding Info (if captured) */}
      {data.face_embedding && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <ScanFace className="w-4 h-4 text-rose-400" />
            <p className="text-sm font-bold text-white">Face Embedding</p>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
              {data.embedding_model}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/20 p-2 rounded-lg">
              <span className="text-white/40">Dimensions:</span>
              <span className="text-white font-bold ml-2">{data.dimensions}</span>
            </div>
            <div className="bg-black/20 p-2 rounded-lg">
              <span className="text-white/40">Confidence:</span>
              <span className="text-white font-bold ml-2">{Math.round((data.confidence || 0) * 100)}%</span>
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-2 font-mono truncate">
            [{data.face_embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]
          </p>
          
          {/* Re-capture button */}
          <button
            type="button"
            onClick={() => {
              onChange({});
              setStatus('idle');
              setFaceDetected(false);
            }}
            className="mt-3 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Re-capture face
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

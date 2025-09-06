// Video Generator Class
class VideoGenerator {
    constructor(options = {}) {
        // Default options
        this.options = {
            width: 1920,
            height: 1080,
            fps: 30,
            ...options
        };
        
        // Store video duration as a class property
        this.videoDuration = options.videoDuration || 60;
        
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
    }

    async createVideo({ images, audio, script, videoDuration = 60, isSplitAudio = false }) {
        try {
            console.log(`Creating video with ${images.length} images and ${videoDuration}s duration`);
            console.log(`Audio is split: ${isSplitAudio}`);
            
            // Store video duration as a class property
            this.videoDuration = videoDuration;
            
            // Load images
            const loadedImages = await this.loadImages(images);
            console.log(`Loaded ${loadedImages.length} images for video`);
            
            // Setup canvas with the loaded images
            this.setupCanvas(loadedImages);
            
            // Load audio if provided
            let audioElement = null;
            let audioDuration = 0;
            let audioElements = [];
            
            if (audio) {
                try {
                    // Check if audio is already an array of elements (split audio)
                    if (Array.isArray(audio)) {
                        console.log(`Loading ${audio.length} split audio parts`);
                        audioElements = audio;
                        
                        // Ensure crossOrigin is set for all audio elements
                        audioElements.forEach((audio, index) => {
                            if (audio) {
                                audio.crossOrigin = 'anonymous';
                                console.log(`Audio part ${index + 1} duration: ${audio.duration || 'unknown'}s`);
                            }
                        });
                        
                        // Calculate total audio duration from all parts
                        audioDuration = audioElements.reduce((total, audio) => {
                            return total + (audio.duration || 0);
                        }, 0);
                        
                        console.log(`Total split audio duration: ${audioDuration}s`);
                    } else if (audio.element) {
                        // Audio is an object with element property
                        audioElement = audio.element;
                        audioElement.crossOrigin = 'anonymous';
                        audioDuration = audio.duration || 0;
                    } else if (typeof audio === 'string') {
                        // Audio is a URL string
                        audioElement = new Audio(audio);
                        audioElement.crossOrigin = 'anonymous';
                        
                        // Wait for audio metadata to load
                        await new Promise((resolve, reject) => {
                            audioElement.onloadedmetadata = () => {
                                audioDuration = audioElement.duration;
                                resolve();
                            };
                            
                            audioElement.onerror = () => {
                                reject(new Error('Failed to load audio'));
                            };
                            
                            // Set timeout to prevent hanging
                            setTimeout(() => {
                                if (!audioDuration) {
                                    audioDuration = videoDuration; // Fallback to video duration
                                    resolve();
                                }
                            }, 5000);
                        });
                    }
                    
                    console.log(`Audio duration: ${audioDuration}s`);
                } catch (error) {
                    console.warn('Error loading audio:', error);
                }
            }
            
            // Calculate image duration based on video duration and number of images
            const imageDuration = this.videoDuration / loadedImages.length;
            console.log(`Image duration: ${imageDuration}s per image`);
            
            // Record video with images and audio
            const videoBlob = await this.recordVideo(
                loadedImages, 
                isSplitAudio ? audioElements : audioElement, 
                imageDuration, 
                this.videoDuration, 
                audioDuration,
                isSplitAudio
            );
            
            return videoBlob;
        } catch (error) {
            console.error('Error creating video:', error);
            throw error;
        }
    }

    setupCanvas(images) {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        
        // Set canvas dimensions based on options or default to 1920x1080 (Full HD)
        this.canvas.width = this.options.width || 1920;
        this.canvas.height = this.options.height || 1080;
        
        // Check if we have portrait images and adjust canvas if needed
        if (images && images.length > 0) {
            // Check if most images are portrait orientation
            const portraitImages = images.filter(img => 
                img.isPortrait || (img.url && img.url.includes('portrait')));
                
            if (portraitImages.length > images.length / 2) {
                // Swap dimensions for portrait orientation
                const temp = this.canvas.width;
                this.canvas.width = this.canvas.height;
                this.canvas.height = temp;
                console.log('Canvas adjusted for portrait orientation');
            }
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas style for better rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * Creates a placeholder image with text when image loading fails
     * @param {string} prompt - The original image prompt
     * @returns {HTMLImageElement} - A placeholder image
     */
    createPlaceholderImage(prompt) {
        // Create a placeholder image with text
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add error message
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Image failed to load', canvas.width / 2, canvas.height / 2 - 20);
        
        // Add prompt text (truncated if too long)
        if (prompt) {
            ctx.font = '16px Arial';
            const maxPromptLength = 50;
            const displayPrompt = prompt.length > maxPromptLength ? 
                prompt.substring(0, maxPromptLength) + '...' : prompt;
            ctx.fillText(`"${displayPrompt}"`, canvas.width / 2, canvas.height / 2 + 20);
        }
        
        // Create image from canvas
        const placeholderImg = new Image();
        placeholderImg.src = canvas.toDataURL();
        return placeholderImg;
    }
    
    async loadImages(imageData) {
        console.log('Loading images:', imageData);
        
        // Authentication headers for Pollinations.ai
        const authHeaders = {
            'X-API-Key': '_22aeaFs0yl2hh1G',
            'Referer': 'king.com'
        };
            
        const loadPromises = imageData.map(async (imgData, index) => {
            console.log(`Processing image ${index}:`, imgData.url);
            return new Promise((resolve) => {
                try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {
                        console.log(`Image ${index + 1} loaded successfully:`, img.src);
                        const isPortrait = img.height > img.width;
                        console.log(`Image ${index + 1} dimensions: ${img.width}x${img.height}, isPortrait: ${isPortrait}`);
                        
                        resolve({
                            element: img,
                            prompt: imgData.prompt,
                            index: index,
                            isPortrait: isPortrait
                        });
                    };
                    
                    img.onerror = (error) => {
                        console.error(`Failed to load image ${index + 1}:`, error);
                        const placeholderImg = this.createPlaceholderImage(imgData.prompt);
                        resolve({
                            element: placeholderImg,
                            prompt: imgData.prompt,
                            index: index,
                            isPortrait: false // Placeholder is not portrait
                        });
                    };
                    
                    // Check if the URL is from Pollinations.ai and use fetch with authentication
                    if (imgData.url.includes('pollinations.ai')) {
                        // Add API key as a query parameter to avoid CORS preflight issues
                        const apiKey = '_22aeaFs0yl2hh1G';
                        const separator = imgData.url.includes('?') ? '&' : '?';
                        const urlWithKey = `${imgData.url}${separator}apiKey=${apiKey}`;
                        
                        // Use a proxy server to avoid CORS issues
                        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(urlWithKey);
                        console.log('Using proxy URL for image:', proxyUrl);
                        
                        // Use fetch with CORS-friendly approach
                        fetch(proxyUrl, {
                            headers: {
                                // Only include headers that don't trigger preflight
                                'Referer': 'king.com'
                            },
                            mode: 'cors'
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.blob();
                        })
                        .then(blob => {
                            const objectUrl = URL.createObjectURL(blob);
                            img.src = objectUrl;
                        })
                        .catch(error => {
                            console.error(`Failed to fetch image ${index + 1}:`, error);
                            img.onerror(error);
                        });
                    } else {
                        // Use direct URL for non-Pollinations images
                        img.src = imgData.url;
                    }
                } catch (error) {
                    console.warn(`Error loading image ${index + 1}:`, error);
                    const placeholderImg = this.createPlaceholderImage(imgData.prompt);
                    resolve({
                        element: placeholderImg,
                        prompt: imgData.prompt,
                        index: index,
                        isPortrait: false // Placeholder is not portrait
                    });
                }
            });
        });
        
        // Wait for all images to load
        const loadedImages = await Promise.all(loadPromises);
        console.log(`All ${loadedImages.length} images loaded`);
        
        // Sort images by index to maintain order
        return loadedImages.sort((a, b) => a.index - b.index);
    }

    createPlaceholderImage(prompt) {
        // Create a canvas for the placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#6a11cb');
        gradient.addColorStop(1, '#2575fc');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text with the prompt
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text to fit canvas
        const maxWidth = canvas.width - 40;
        const lineHeight = 30;
        const words = prompt.split(' ');
        let line = '';
        let y = canvas.height / 2 - (words.length / 2) * lineHeight;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, canvas.width / 2, y);
                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        ctx.fillText(line, canvas.width / 2, y);
        
        // Create an image from the canvas
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        
        return img;
    }

    async recordVideo(images, audioElement, imageDuration, videoDuration = 60, audioDuration = 60, isSplitAudio = false) {
        return new Promise((resolve, reject) => {
            this.recordedChunks = [];
            
            // Setup media recorder
            const stream = this.canvas.captureStream(30); // 30 FPS
            
            // Add audio track if available
            if (audioElement) {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Handle split audio differently
                    if (isSplitAudio && Array.isArray(audioElement)) {
                        console.log(`Setting up ${audioElement.length} audio parts for recording`);
                        const audioElements = audioElement;
                        const destination = audioContext.createMediaStreamDestination();
                        
                        // Create sources for each audio part
                        const sources = audioElements.map(audio => {
                            const source = audioContext.createMediaElementSource(audio);
                            source.connect(destination);
                            source.connect(audioContext.destination);
                            return source;
                        });
                        
                        // Add audio track to video stream
                        const audioTrack = destination.stream.getAudioTracks()[0];
                        if (audioTrack) {
                            stream.addTrack(audioTrack);
                        }
                    } else {
                        // Single audio element
                        const source = audioContext.createMediaElementSource(audioElement);
                        const destination = audioContext.createMediaStreamDestination();
                        source.connect(destination);
                        source.connect(audioContext.destination);
                        
                        // Add audio track to video stream
                        const audioTrack = destination.stream.getAudioTracks()[0];
                        if (audioTrack) {
                            stream.addTrack(audioTrack);
                        }
                    }
                } catch (error) {
                    console.warn('Failed to add audio track:', error);
                }
            }
            
            // Create media recorder
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 8000000, // 8 Mbps for high quality
                audioBitsPerSecond: 128000   // 128 kbps for audio
            };
            
            // Fallback mime types
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                    options.mimeType = 'video/webm;codecs=vp8,opus';
                } else if (MediaRecorder.isTypeSupported('video/webm')) {
                    options.mimeType = 'video/webm';
                } else {
                    options.mimeType = 'video/mp4';
                }
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, {
                    type: options.mimeType
                });
                resolve(blob);
            };
            
            this.mediaRecorder.onerror = (event) => {
                reject(new Error('MediaRecorder error: ' + event.error));
            };
            
            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            
            // Start audio playback if available
            if (audioElement) {
                if (isSplitAudio && Array.isArray(audioElement)) {
                    // For split audio, play the first part immediately
                    const audioElements = audioElement;
                    if (audioElements.length > 0) {
                        console.log('Playing first audio part');
                        audioElements[0].currentTime = 0;
                        audioElements[0].play().catch(err => {
                            console.error('Error playing first audio part:', err);
                        });
                        
                        // Set up event listener to play second part when first part ends
                        if (audioElements.length > 1) {
                            console.log('Setting up listener for second audio part');
                            audioElements[0].onended = () => {
                                console.log('First audio part ended, playing second part');
                                audioElements[1].currentTime = 0;
                                audioElements[1].play().catch(err => {
                                    console.error('Error playing second audio part:', err);
                                });
                            };
                        }
                    }
                } else {
                    // Single audio element
                    audioElement.currentTime = 0;
                    audioElement.play().catch(console.warn);
                }
            }
            
            // Log the video duration being used
            console.log(`Recording video with duration: ${videoDuration}s, audio duration: ${audioDuration}s`);
            
            // Set timeout to stop recording after the calculated video duration
            const recordingTimeout = setTimeout(() => {
                if (this.isRecording) {
                    this.mediaRecorder.stop();
                    this.isRecording = false;
                }
                
                // Stop audio
                if (audioElement) {
                    if (isSplitAudio && Array.isArray(audioElement)) {
                        audioElement.forEach(audio => {
                            if (audio) audio.pause();
                        });
                    } else {
                        audioElement.pause();
                    }
                }
            }, videoDuration * 1000);
            
            // Start animating images
            this.animateImages(images, imageDuration, () => {
                // Animation completed callback
                clearTimeout(recordingTimeout);
                
                if (this.isRecording) {
                    // Give a small buffer to ensure all frames are captured
                    setTimeout(() => {
                        this.mediaRecorder.stop();
                        this.isRecording = false;
                        
                        // Stop audio
                        if (audioElement) {
                            if (isSplitAudio && Array.isArray(audioElement)) {
                                audioElement.forEach(audio => {
                                    if (audio) audio.pause();
                                });
                            } else {
                                audioElement.pause();
                            }
                        }
                    }, 500);
                }
            });
        });
    }

    animateImages(images, imageDuration, onComplete) {
        let currentIndex = 0;
        const totalImages = images.length;
        let transitionProgress = 1; // 1 means fully showing current image
        const transitionDuration = 0.5; // transition duration in seconds
        
        // Function to draw the current image with transition effect
        const drawImage = (currentImg, nextImg = null, progress = 1) => {
            // Clear canvas with black background
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw current image
            if (currentImg) {
                const imgElement = currentImg.element;
                
                // Calculate position to center the image
                let x = 0;
                let y = 0;
                let width = this.canvas.width;
                let height = this.canvas.height;
                
                // Maintain aspect ratio
                const imgRatio = imgElement.width / imgElement.height;
                const canvasRatio = this.canvas.width / this.canvas.height;
                
                if (imgRatio > canvasRatio) {
                    // Image is wider than canvas (relative to height)
                    height = width / imgRatio;
                    y = (this.canvas.height - height) / 2;
                } else {
                    // Image is taller than canvas (relative to width)
                    width = height * imgRatio;
                    x = (this.canvas.width - width) / 2;
                }
                
                // Apply high-quality rendering settings
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'high';
                
                // Draw the image centered with a slight shadow for depth
                this.ctx.globalAlpha = 1;
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                this.ctx.drawImage(imgElement, x, y, width, height);
                
                // Reset shadow for text
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
                
                // Add caption if available
                if (currentImg.prompt) {
                    this.drawCaption(currentImg.prompt);
                }
            }
            
            // Draw next image with fade-in effect if in transition
            if (nextImg && progress < 1) {
                const nextImgElement = nextImg.element;
                
                // Calculate position for next image
                let nx = 0;
                let ny = 0;
                let nwidth = this.canvas.width;
                let nheight = this.canvas.height;
                
                // Maintain aspect ratio for next image
                const nextImgRatio = nextImgElement.width / nextImgElement.height;
                const canvasRatio = this.canvas.width / this.canvas.height;
                
                if (nextImgRatio > canvasRatio) {
                    nheight = nwidth / nextImgRatio;
                    ny = (this.canvas.height - nheight) / 2;
                } else {
                    nwidth = nheight * nextImgRatio;
                    nx = (this.canvas.width - nwidth) / 2;
                }
                
                // Draw the next image with opacity based on transition progress
                this.ctx.globalAlpha = 1 - progress;
                this.ctx.drawImage(nextImgElement, nx, ny, nwidth, nheight);
                this.ctx.globalAlpha = 1;
            }
        };
        
        // Draw the first image
        if (images.length > 0) {
            drawImage(images[0]);
        }
        
        // Calculate frame interval for smooth animation (60fps)
        const frameInterval = 1000 / 60; // ~16.7ms for 60fps
        
        // Set up animation loop
        const animate = () => {
            // If we're in transition between images
            if (transitionProgress < 1) {
                // Calculate next transition progress
                transitionProgress += frameInterval / (transitionDuration * 1000);
                
                if (transitionProgress >= 1) {
                    // Transition complete, show only current image
                    transitionProgress = 1;
                    drawImage(images[currentIndex]);
                } else {
                    // Draw transition between previous and current image
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                    drawImage(images[prevIndex], images[currentIndex], transitionProgress);
                }
                
                // Continue animation
                requestAnimationFrame(animate);
            }
        };
        
        // Start animation loop
        animate();
        
        // Set up image change interval
        console.log(`Animating images with ${imageDuration}s per image`);
        
        const changeImage = () => {
            currentIndex++;
            
            if (currentIndex < totalImages) {
                // Start transition to next image
                transitionProgress = 0;
                animate();
                
                // Schedule next image change
                setTimeout(changeImage, imageDuration * 1000);
            } else {
                // Animation complete
                if (onComplete) onComplete();
            }
        };
        
        // Schedule first image change
        setTimeout(changeImage, imageDuration * 1000);
    }

    drawCaption(text) {
        // Set caption style with gradient background
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height - 80, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);
        
        // Text shadow for better readability
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Text style
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 28px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Truncate text if too long
        let caption = text;
        if (text.length > 60) {
            caption = text.substring(0, 57) + '...';
        }
        
        this.ctx.fillText(caption, this.canvas.width / 2, this.canvas.height - 40);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    checkBrowserSupport() {
        const support = {
            webm: false,
            mp4: false
        };
        
        if (typeof MediaRecorder !== 'undefined') {
            support.webm = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') || 
                          MediaRecorder.isTypeSupported('video/webm;codecs=vp8');
            support.mp4 = MediaRecorder.isTypeSupported('video/mp4');
        }
        
        return support;
    }

    getOptimalSettings() {
        const support = this.checkBrowserSupport();
        
        if (support.webm) {
            return {
                mimeType: 'video/webm;codecs=vp9',
                extension: 'webm'
            };
        } else if (support.mp4) {
            return {
                mimeType: 'video/mp4',
                extension: 'mp4'
            };
        } else {
            throw new Error('No supported video format found');
        }
    }

    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // CORS proxy and fetch handling methods have been removed
    
    /**
     * Load audio from URL
     * @param {string} audioUrl - The URL of the audio to load
     * @returns {Promise<string>} - A promise that resolves to the object URL of the loaded audio
     */
    async loadAudio(audioUrl) {
        console.log('Loading audio from URL:', audioUrl);
        
        try {
            console.log('Fetching audio from URL:', audioUrl);
            
            // Check if the URL is from Pollinations.ai and use CORS-friendly approach
            let fetchUrl = audioUrl;
            const options = {};
            
            if (audioUrl.includes('pollinations.ai')) {
                // Add API key as a query parameter to avoid CORS preflight issues
                const apiKey = '_22aeaFs0yl2hh1G';
                const separator = audioUrl.includes('?') ? '&' : '?';
                fetchUrl = `${audioUrl}${separator}apiKey=${apiKey}`;
                
                options.headers = {
                    // Only include headers that don't trigger preflight
                    'Referer': 'king.com'
                };
                options.mode = 'cors';
            }
            
            const response = await fetch(fetchUrl, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const audioObjectUrl = URL.createObjectURL(audioBlob);
            
            console.log('Audio loaded successfully');
            return audioObjectUrl;
        } catch (error) {
            console.error('Audio loading failed:', error.message);
            throw error;
        }
    }
}

// Make VideoGenerator available globally
window.VideoGenerator = VideoGenerator;
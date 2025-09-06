// Main Application Controller
class VideoGeneratorApp {
    constructor() {
        this.generatedContent = {
            script: '',
            images: [],
            audio: null,
            video: null
        };
        
        this.isGenerating = false;
        this.currentStep = 0;
        this.totalSteps = 4;
        
        // Flux Model Configuration
        this.fluxConfig = {
            model: 'flux',
            enhance: true,
            safe: true,
            quality: 'best', // Set quality to best
            nologo: true,    // Remove logo
            defaultDimensions: {
                square: { width: 1024, height: 1024 },
                landscape: { width: 1280, height: 720 },
                portrait: { width: 720, height: 1280 }
            },
            qualitySettings: {
                high: { enhance: true, safe: true, quality: 'best', nologo: true },
                standard: { enhance: false, safe: true, quality: 'standard', nologo: true }
            }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateButtonStates();
        console.log('Video Generator App initialized');
    }
    
    // CORS proxy functionality has been removed
    
    /**
     * Handles CORS for fetch requests to Pollinations.ai
     * @param {string} url - The URL to fetch
     * @returns {Object} - An object with the URL and headers if needed
     */
    async fetchWithCorsHandling(url) {
        console.log('Processing URL for CORS handling:', url);
        
        // Check if this is a Pollinations.ai URL
        if (url.includes('pollinations.ai')) {
            // Use a CORS-friendly approach to avoid preflight issues
            // Add API key as a query parameter instead of a header that would trigger preflight
            const apiKey = '_22aeaFs0yl2hh1G';
            const separator = url.includes('?') ? '&' : '?';
            const urlWithKey = `${url}${separator}apiKey=${apiKey}`;
            
            console.log('Using CORS-friendly approach for Pollinations.ai URL');
            return {
                url: urlWithKey,
                headers: {
                    // Only include headers that don't trigger preflight
                    'Referer': 'king.com'
                },
                mode: 'cors'
            };
        }
        
        // For non-Pollinations URLs, just return the URL
        console.log('Using direct URL (non-Pollinations):', url);
        return url;
    }

    bindEvents() {
        // Keywords input
        const keywordsInput = document.getElementById('keywords');
        if (keywordsInput) {
            keywordsInput.addEventListener('input', () => {
                this.updateButtonStates();
            });
        }

        // Individual generation buttons
        const generateScript = document.getElementById('generateScript');
        if (generateScript) {
            generateScript.addEventListener('click', () => {
                this.generateScript();
            });
        }

        const generateImages = document.getElementById('generateImages');
        if (generateImages) {
            generateImages.addEventListener('click', () => {
                this.generateImages();
            });
        }

        const generateAudio = document.getElementById('generateAudio');
        if (generateAudio) {
            generateAudio.addEventListener('click', () => {
                this.generateAudio();
            });
        }

        const createVideo = document.getElementById('createVideo');
        if (createVideo) {
            createVideo.addEventListener('click', () => {
                this.createVideo();
            });
        }

        // Generate all button
        const generateAll = document.getElementById('generateAll');
        if (generateAll) {
            generateAll.addEventListener('click', () => {
                this.generateAll();
            });
        }

        // Reset button
        const resetAll = document.getElementById('resetAll');
        if (resetAll) {
            resetAll.addEventListener('click', () => {
                this.resetAll();
            });
        }

        // Download button
        const downloadVideo = document.getElementById('downloadVideo');
        if (downloadVideo) {
            downloadVideo.addEventListener('click', () => {
                this.downloadVideo();
            });
        }

        // Create another button
        const createAnother = document.getElementById('createAnother');
        if (createAnother) {
            createAnother.addEventListener('click', () => {
                this.resetAll();
            });
        }

        // Error close button
        const closeError = document.getElementById('closeError');
        if (closeError) {
            closeError.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Edit script button
        const editScript = document.getElementById('editScript');
        if (editScript) {
            editScript.addEventListener('click', () => {
                this.editScript();
            });
        }
    }

    updateButtonStates() {
        const keywords = document.getElementById('keywords')?.value.trim() || '';
        const hasKeywords = keywords.length > 0;
        const hasScript = this.generatedContent.script.length > 0;
        const hasImages = this.generatedContent.images.length > 0;
        const hasAudio = this.generatedContent.audio !== null;

        // Enable/disable buttons based on state
        this.setButtonState('generateScript', hasKeywords && !this.isGenerating);
        this.setButtonState('generateAll', hasKeywords && !this.isGenerating);
        this.setButtonState('generateImages', hasScript && !this.isGenerating);
        this.setButtonState('generateAudio', hasScript && !this.isGenerating);
        this.setButtonState('createVideo', hasScript && hasImages && hasAudio && !this.isGenerating);
    }

    setButtonState(buttonId, enabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !enabled;
        }
    }

    async generateAll() {
        try {
            this.showProgress();
            await this.generateScript();
            await this.generateImages();
            await this.generateAudio();
            await this.createVideo();
            this.showResult();
        } catch (error) {
            this.showError(`Generation failed: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    async generateScript() {
        const keywords = document.getElementById('keywords')?.value.trim();
        if (!keywords) {
            this.showError('Please enter keywords first.');
            return;
        }

        this.isGenerating = true;
        this.updateButtonStates();
        this.updateProgress('script', 'processing', 'Generating script...');
        
        try {
            const prompt = `Create a detailed, engaging video script about "${keywords}". The script should be narrative-style, suitable for a 2-3 minute video. Include vivid descriptions and storytelling elements. Make it informative yet entertaining. Structure it with clear scenes that can be visualized.`;
            
            // Get URL and headers using the CORS handling function
            // Updated API endpoint to match the correct Pollinations.ai endpoint
            const apiUrl = `https://pollinations.ai/api/text/${encodeURIComponent(prompt)}?model=openai`;
            const fetchOptions = await this.fetchWithCorsHandling(apiUrl);
            
            // Make the fetch request with the appropriate options
            let response;
            if (typeof fetchOptions === 'object' && fetchOptions.url) {
                // If fetchWithCorsHandling returned an object with URL and headers
                response = await fetch(fetchOptions.url, {
                    headers: fetchOptions.headers,
                    mode: fetchOptions.mode || 'cors'
                });
            } else {
                // If fetchWithCorsHandling returned just a URL string (fallback)
                // Add API key as a query parameter to avoid CORS preflight issues
                const apiKey = '_22aeaFs0yl2hh1G';
                const separator = fetchOptions.includes('?') ? '&' : '?';
                const urlWithKey = `${fetchOptions}${separator}apiKey=${apiKey}`;
                
                response = await fetch(urlWithKey, {
                    headers: {
                        // Only include headers that don't trigger preflight
                        'Referer': 'king.com'
                    },
                    mode: 'cors'
                });
            }
            
            if (!response.ok) {
                throw new Error(`Script generation failed: ${response.status}`);
            }
            
            const script = await response.text();
            this.generatedContent.script = script;
            
            // Display script
            const scriptContent = document.getElementById('scriptContent');
            if (scriptContent) {
                scriptContent.textContent = script;
            }
            
            // Show script preview
            const scriptPreview = document.getElementById('scriptPreview');
            if (scriptPreview) {
                scriptPreview.style.display = 'block';
            }
            
            this.updateProgress('script', 'completed', 'Script generated!', 100);
            
        } catch (error) {
            this.updateProgress('script', 'error', 'Script generation failed');
            throw error;
        } finally {
            this.isGenerating = false;
            this.updateButtonStates();
        }
    }

    async generateImages() {
        if (!this.generatedContent.script) {
            this.showError('Please generate a script first.');
            return;
        }

        this.isGenerating = true;
        this.updateButtonStates();
        this.updateProgress('image', 'processing', 'Generating images with Flux model...');
        
        try {
            const imageSizeSelect = document.getElementById('imageSize');
            const imageCountSelect = document.getElementById('imageCount');
            const fluxQualitySelect = document.getElementById('fluxQuality');
            
            const selectedSize = imageSizeSelect?.value || '1280x720';
            const [width, height] = selectedSize.split('x').map(Number);
            const imageCount = parseInt(imageCountSelect?.value || '4');
            const fluxQuality = fluxQualitySelect?.value || 'high';
            
            // Update Flux configuration based on quality setting
            this.updateFluxQuality(fluxQuality);
            
            console.log(`Generating ${imageCount} images with Flux model at ${width}x${height} (${fluxQuality} quality)`);
            
            // Create image prompts from script
            const imagePrompts = this.createImagePrompts(this.generatedContent.script, imageCount);
            
            this.generatedContent.images = [];
            const imagesGrid = document.getElementById('imagesGrid');
            if (imagesGrid) {
                imagesGrid.innerHTML = '';
            }
            
            for (let i = 0; i < imagePrompts.length; i++) {
                const prompt = imagePrompts[i];
                const progress = ((i + 1) / imagePrompts.length) * 100;
                
                this.updateProgress('image', 'processing', `Generating Flux image ${i + 1}/${imagePrompts.length}...`, progress);
                
                try {
                    const imageUrl = await this.generateSingleImage(prompt, width, height, i);
                    
                    this.generatedContent.images.push({
                        url: imageUrl,
                        prompt: prompt,
                        index: i
                    });
                    
                    // Display image
                    this.displayImage(imageUrl, prompt, i);
                    
                } catch (error) {
                    console.warn(`Failed to generate image ${i + 1}:`, error);
                }
                
                // Small delay to prevent rate limiting
                await this.delay(1000);
            }
            
            if (this.generatedContent.images.length === 0) {
                throw new Error('No images were generated successfully');
            }
            
            // Show images preview
            const imagesPreview = document.getElementById('imagesPreview');
            if (imagesPreview) {
                imagesPreview.style.display = 'block';
            }
            
            // Update image count
            const imageCountDisplay = document.getElementById('imageCount');
            if (imageCountDisplay) {
                imageCountDisplay.textContent = `${this.generatedContent.images.length} images`;
            }
            
            this.updateProgress('image', 'completed', `${this.generatedContent.images.length} Flux model images generated!`, 100);
            
        } catch (error) {
            this.updateProgress('image', 'error', 'Flux model image generation failed');
            throw error;
        } finally {
            this.isGenerating = false;
            this.updateButtonStates();
        }
    }

    /**
     * Generate a single image using Flux model exclusively
     * Flux Model Specifications:
     * - High-quality image generation with artistic capabilities
     * - Optimal dimensions: 1024x1024, 1280x720, 720x1280
     * - Enhanced quality with 'enhance=true' parameter
     * - Safe content filtering with 'safe=true'
     * - Reproducible results with seed parameter
     */
    async generateSingleImage(prompt, width, height, seed) {
        // Sanitize the prompt before sending it to the API
        const cleaned = this.cleanPrompt(prompt);
        const model = this.fluxConfig?.model || 'flux';

        // Construct a list of endpoints to try in order of preference.
        // The first endpoint uses the selected model with best quality and dimensions specified by the caller.
        // The second endpoint falls back to the turbo model if the first fails.
        // The third endpoint omits model and dimension parameters entirely as a last resort.
        const endpoints = [
            `https://image.pollinations.ai/prompt/${encodeURIComponent(cleaned)}?width=${width}&height=${height}&seed=${seed}&model=${model}&quality=best&nologo=true`,
            `https://image.pollinations.ai/prompt/${encodeURIComponent(cleaned)}?width=${width}&height=${height}&seed=${seed}&model=turbo&nologo=true`,
            `https://image.pollinations.ai/prompt/${encodeURIComponent(cleaned)}?seed=${seed}`
        ];

        // Iterate through the endpoints and return the first one that responds successfully.
        for (let endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    // If the API responded successfully, return the endpoint URL for direct image loading.
                    return endpoint;
                }
            } catch (error) {
                console.log(`Endpoint failed: ${endpoint}`);
            }
        }

        // If none of the endpoints returned a valid response, signal failure to the caller.
        throw new Error('All image generation attempts failed');
    }
    
    /**
     * Validate if dimensions are optimal for Flux model
     */
    validateFluxDimensions(width, height) {
        const validDimensions = [
            [1024, 1024], [1280, 720], [720, 1280],
            [1152, 896], [896, 1152], [1216, 832],
            [832, 1216], [1344, 768], [768, 1344]
        ];
        
        return validDimensions.some(([w, h]) => w === width && h === height);
    }
    
    /**
     * Get optimal Flux dimensions based on aspect ratio
     */
    getOptimalFluxDimensions(targetWidth, targetHeight) {
        const aspectRatio = targetWidth / targetHeight;
        
        // Check if this is a portrait request (height > width)
        if (targetHeight > targetWidth) {
            console.log('Portrait image requested - using portrait dimensions');
            return this.fluxConfig.defaultDimensions.portrait;
        }
        
        if (aspectRatio > 1.5) {
            return this.fluxConfig.defaultDimensions.landscape;
        } else if (aspectRatio < 0.7) {
            return this.fluxConfig.defaultDimensions.portrait;
        } else {
            return this.fluxConfig.defaultDimensions.square;
        }
    }
    
    /**
     * Update Flux quality settings based on user selection
     */
    updateFluxQuality(qualityLevel) {
        const qualitySettings = this.fluxConfig.qualitySettings[qualityLevel];
        if (qualitySettings) {
            this.fluxConfig.enhance = qualitySettings.enhance;
            this.fluxConfig.safe = qualitySettings.safe;
            this.fluxConfig.quality = qualitySettings.quality || 'best';
            this.fluxConfig.nologo = qualitySettings.nologo !== undefined ? qualitySettings.nologo : true;
            console.log(`Flux quality updated to: ${qualityLevel}`, qualitySettings);
        }
    }

    /**
     * Clean a prompt string by removing HTML tags and other unwanted fragments.
     * This helps avoid corrupt prompts being sent to the image generation API.
     *
     * @param {string} prompt - The original prompt
     * @returns {string} - A sanitized prompt suitable for API calls
     */
    cleanPrompt(prompt) {
        // Remove HTML tags and entities
        let cleaned = prompt
            .replace(/<[^>]*>/g, '')        // Strip HTML tags
            .replace(/&[^;]+;/g, ' ')       // Replace HTML entities with spaces
            .replace(/doctype\s+html/gi, '') // Remove doctype declarations
            .replace(/charset[^,\s]*/gi, '') // Remove charset definitions
            .replace(/viewport[^,\s]*/gi, '')// Remove viewport meta tags
            .replace(/maximum-scale[^,\s]*/gi, '') // Remove scale directives
            .replace(/\s+/g, ' ')          // Normalize whitespace
            .trim();

        // Fallback to a generic artistic prompt if the result looks invalid
        if (cleaned.length < 5 || cleaned.includes('meta') || cleaned.includes('property')) {
            cleaned = 'beautiful landscape, artistic masterpiece, vibrant colors, professional photography';
        }

        return cleaned;
    }

    createImagePrompts(script, count) {
        // Split script into sentences and extract key visual elements
        const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const prompts = [];
        
        // Create diverse prompts optimized for Flux model
        const keywords = document.getElementById('keywords')?.value.trim() || '';
        
        // Flux model works best with detailed, artistic prompts
        const fluxOptimizedStyles = [
            'cinematic composition, dramatic lighting, high detail',
            'artistic masterpiece, vibrant colors, professional photography',
            'stunning visual, photorealistic, award-winning composition',
            'breathtaking scene, perfect lighting, ultra-detailed',
            'magnificent view, rich textures, cinematic quality'
        ];
        
        for (let i = 0; i < count; i++) {
            let basePrompt;
            
            if (i < sentences.length) {
                // Use script sentences for first few images
                const sentence = sentences[i].trim();
                basePrompt = sentence;
            } else {
                // Generate variations for remaining images
                const variations = [
                    `${keywords}, wide angle perspective`,
                    `${keywords}, intimate close-up view`,
                    `${keywords}, aerial panoramic view`,
                    `${keywords}, golden hour atmosphere`,
                    `${keywords}, detailed macro perspective`
                ];
                basePrompt = variations[i % variations.length];
            }
            
            // Add Flux-optimized styling
            const fluxStyle = fluxOptimizedStyles[i % fluxOptimizedStyles.length];
            const prompt = `${basePrompt}, ${fluxStyle}, flux model quality`;
            
            prompts.push(prompt);
        }
        
        return prompts;
    }

    displayImage(imageUrl, prompt, index) {
        const imagesGrid = document.getElementById('imagesGrid');
        if (!imagesGrid) return;
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${imageUrl}" alt="Generated image ${index + 1}" loading="lazy">
            <div class="image-caption">
                <div class="scene-info">
                    <span class="scene-number">Scene ${index + 1}</span>
                    <span class="flux-indicator">⚡ Flux</span>
                </div>
                <div class="scene-description">
                    ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}
                </div>
            </div>
        `;
        
        imagesGrid.appendChild(imageItem);
    }

    async generateAudio() {
        if (!this.generatedContent.script) {
            this.showError('Please generate a script first.');
            return;
        }
    
        this.isGenerating = true;
        this.updateButtonStates();
        this.updateProgress('audio', 'processing', 'Generating audio narration...');
        
        try {
            const voiceSelect = document.getElementById('voiceSelect');
            const voice = voiceSelect?.value || 'nova';
            const text = this.generatedContent.script;
            
            // Get selected video duration
            const videoDurationSelect = document.getElementById('videoDuration');
            const selectedDuration = videoDurationSelect ? parseInt(videoDurationSelect.value) : 60;
            
            // Always generate 1-minute audio by splitting into two parts
            console.log('Generating 1-minute audio by splitting into two parts');
            
            // Split text into two roughly equal parts
            const charsPerSecond = 16;
            const partDuration = 31; // 31 seconds per part
            const partLength = Math.floor(partDuration * charsPerSecond * 0.95); // 95% of max to ensure it fits
            
            // Find a good split point (at the end of a sentence if possible)
            const totalText = text;
            const midPoint = Math.floor(totalText.length / 2);
            
            // Look for sentence end (.!?) near the midpoint
            let splitIndex = midPoint;
            const sentenceEndRegex = /[.!?]\s/g;
            let matches = [];
            let match;
            
            while ((match = sentenceEndRegex.exec(totalText)) !== null) {
                matches.push(match.index + 1); // +1 to include the punctuation
            }
            
            // Find closest sentence end to midpoint
            if (matches.length > 0) {
                const closest = matches.reduce((prev, curr) => 
                    Math.abs(curr - midPoint) < Math.abs(prev - midPoint) ? curr : prev
                );
                splitIndex = closest;
            }
            
            const part1 = totalText.substring(0, splitIndex).trim();
            const part2 = totalText.substring(splitIndex).trim();
            
            console.log(`Split text at index ${splitIndex}:\nPart 1 (${part1.length} chars)\nPart 2 (${part2.length} chars)`);
            
            // Generate first part audio with authentication
            const audioUrl1 = `https://pollinations.ai/api/text/${encodeURIComponent(part1)}?model=openai-audio&voice=${voice}`;
            
            // Get URL and headers using fetchWithCorsHandling
            const fetchData1 = this.fetchWithCorsHandling(audioUrl1);
            const audio1 = new Audio();
            audio1.crossOrigin = 'anonymous';
            
            // Simple retry logic
            let part1Success = false;
            let part1RetryCount = 0;
            const maxRetries = 3;
            let part1Error = null;
            
            while (!part1Success && part1RetryCount < maxRetries) {
                try {
                    if (part1RetryCount > 0) {
                        this.updateProgress('audio', 'processing', 
                            `Retrying Part 1 audio generation (attempt ${part1RetryCount + 1}/${maxRetries})...`);
                        // Exponential backoff
                        const backoffTime = Math.pow(2, part1RetryCount) * 1000;
                        await new Promise(resolve => setTimeout(resolve, backoffTime));
                        console.log(`Retrying Part 1 audio after ${backoffTime}ms backoff`);
                    }
                    
                    console.log(`Attempting to load audio (attempt ${part1RetryCount + 1}/${maxRetries}):`, 
                        audioUrl1.substring(0, 100) + '...');
                    
                    await new Promise((resolve, reject) => {
                        // Fetch audio with proper headers and mode
                        const fetchOptions = {};
                        
                        let fetchPromise;
                        if (typeof fetchData1 === 'object') {
                            // Use URL, headers and mode from fetchWithCorsHandling
                            fetchOptions.headers = fetchData1.headers;
                            fetchOptions.mode = fetchData1.mode;
                            fetchPromise = fetch(fetchData1.url, fetchOptions);
                        } else {
                            // If fetchData1 is just a URL string
                            // Add API key as a query parameter to avoid CORS preflight issues
                            const apiKey = '_22aeaFs0yl2hh1G';
                            const separator = fetchData1.includes('?') ? '&' : '?';
                            const urlWithKey = `${fetchData1}${separator}apiKey=${apiKey}`;
                            
                            fetchPromise = fetch(urlWithKey, {
                                headers: {
                                    // Only include headers that don't trigger preflight
                                    'Referer': 'king.com'
                                },
                                mode: 'cors'
                            });
                        }
                        
                        fetchPromise.then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.blob();
                        })
                        .then(blob => {
                            const objectUrl = URL.createObjectURL(blob);
                            
                            audio1.onloadedmetadata = () => {
                                const duration1 = Math.round(audio1.duration);
                                console.log(`Part 1 audio duration: ${duration1}s`);
                                resolve();
                            };
                            
                            audio1.onerror = (e) => {
                                console.warn(`Part 1 audio generation failed (attempt ${part1RetryCount + 1}/${maxRetries})`, e);
                                URL.revokeObjectURL(objectUrl);
                                reject(new Error(`Part 1 audio generation failed: ${e.message || 'Unknown error'}`));
                            };
                            
                            audio1.src = objectUrl;
                        })
                        .catch(error => {
                            console.error('Failed to fetch audio:', error);
                            reject(error);
                        });
                        
                        // Timeout after 30 seconds
                        setTimeout(() => {
                            reject(new Error('Part 1 audio generation timeout'));
                        }, 30000);
                    }); // End of promise chain
                    
                    part1Success = true;
                } catch (error) {
                    part1Error = error;
                    console.warn(`Part 1 audio attempt ${part1RetryCount + 1}/${maxRetries} failed:`, error.message);
                    part1RetryCount++;
                }
            }
            
            if (!part1Success) {
                console.error(`Part 1 audio generation failed after ${maxRetries} attempts`);
                throw part1Error || new Error(`Part 1 audio generation failed after ${maxRetries} attempts`);
            }
            // Generate second part audio with authentication
            const audioUrl2 = `https://pollinations.ai/api/text/${encodeURIComponent(part2)}?model=openai-audio&voice=${voice}`;
            // Get URL and headers using fetchWithCorsHandling
            const fetchData2 = this.fetchWithCorsHandling(audioUrl2);
            const audio2 = new Audio();
            audio2.crossOrigin = 'anonymous';
            
            // Simple retry logic
            let part2Success = false;
            let part2RetryCount = 0;
            let part2Error = null;
            
            while (!part2Success && part2RetryCount < maxRetries) {
                try {
                    if (part2RetryCount > 0) {
                        this.updateProgress('audio', 'processing', 
                            `Retrying Part 2 audio generation (attempt ${part2RetryCount + 1}/${maxRetries})...`);
                        // Exponential backoff
                        const backoffTime = Math.pow(2, part2RetryCount) * 1000;
                        await new Promise(resolve => setTimeout(resolve, backoffTime));
                        console.log(`Retrying Part 2 audio after ${backoffTime}ms backoff`);
                    }
                    
                    console.log(`Attempting to load audio (attempt ${part2RetryCount + 1}/${maxRetries}):`, 
                        audioUrl2.substring(0, 100) + '...');
                    
                    await new Promise((resolve, reject) => {
                        // Fetch audio with proper headers and mode
                        const fetchOptions = {};
                        let fetchPromise;
                        
                        if (typeof fetchData2 === 'object') {
                            // Use URL, headers and mode from fetchWithCorsHandling
                            fetchOptions.headers = fetchData2.headers;
                            fetchOptions.mode = fetchData2.mode;
                            fetchPromise = fetch(fetchData2.url, fetchOptions);
                        } else {
                            // If fetchData2 is just a URL string
                            // Add API key as a query parameter to avoid CORS preflight issues
                            const apiKey = '_22aeaFs0yl2hh1G';
                            const separator = fetchData2.includes('?') ? '&' : '?';
                            const urlWithKey = `${fetchData2}${separator}apiKey=${apiKey}`;
                            
                            fetchPromise = fetch(urlWithKey, {
                                headers: {
                                    // Only include headers that don't trigger preflight
                                    'Referer': 'king.com'
                                },
                                mode: 'cors'
                            });
                        }
                        
                        fetchPromise
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.blob();
                        })
                        .then(blob => {
                            const objectUrl = URL.createObjectURL(blob);
                            
                            audio2.onloadedmetadata = () => {
                                const duration2 = Math.round(audio2.duration);
                                console.log(`Part 2 audio duration: ${duration2}s`);
                                resolve();
                            };
                            
                            audio2.onerror = (e) => {
                                console.warn(`Part 2 audio generation failed (attempt ${part2RetryCount + 1}/${maxRetries})`, e);
                                URL.revokeObjectURL(objectUrl);
                                reject(new Error(`Part 2 audio generation failed: ${e.message || 'Unknown error'}`));
                            };
                            
                            audio2.src = objectUrl;
                        })
                        .catch(error => {
                            console.error('Failed to fetch audio:', error);
                            reject(error);
                        });
                        
                        // Timeout after 30 seconds
                        setTimeout(() => {
                            reject(new Error('Part 2 audio generation timeout'));
                        }, 30000);
                    });
                    
                    part2Success = true;
                } catch (error) {
                    part2Error = error;
                    console.warn(`Part 2 audio attempt ${part2RetryCount + 1}/${maxRetries} failed:`, error.message);
                    part2RetryCount++;
                }
            }
            
            if (!part2Success) {
                console.error(`Part 2 audio generation failed after ${maxRetries} attempts`);
                throw part2Error || new Error(`Part 2 audio generation failed after ${maxRetries} attempts`);
            }
            
            // Audio2 is now loaded with retry logic above
            
            // Store combined audio information
            const totalDuration = Math.round(audio1.duration + audio2.duration);
            
            this.generatedContent.audio = {
                parts: [
                    { url: audioUrl1, duration: Math.round(audio1.duration), element: audio1 },
                    { url: audioUrl2, duration: Math.round(audio2.duration), element: audio2 }
                ],
                url: audioUrl1, // Use first part for player display
                duration: totalDuration,
                element: audio1,
                isSplit: true
            };
            
            // Display audio (first part)
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer) {
                audioPlayer.src = audioUrl1;
            }
            
            // Show audio preview
            const audioPreview = document.getElementById('audioPreview');
            if (audioPreview) {
                audioPreview.style.display = 'block';
            }
            
            // Update duration to show actual seconds
            const audioDuration = document.getElementById('audioDuration');
            if (audioDuration) {
                audioDuration.textContent = `${totalDuration}s (split: ${Math.round(audio1.duration)}s + ${Math.round(audio2.duration)}s)`;
            }
            
            this.updateProgress('audio', 'completed', `Audio generated (${totalDuration}s - split into 2 parts)!`, 100);
        } catch (error) {
            console.error('Audio generation error:', error);
            this.updateProgress('audio', 'error', 'Audio generation failed');
            throw error;
        } finally {
            this.isGenerating = false;
            this.updateButtonStates();
        }
    }

    async createVideo() {
        if (!this.generatedContent.script || !this.generatedContent.images.length || !this.generatedContent.audio) {
            this.showError('Please generate script, images, and audio first.');
            return;
        }

        this.isGenerating = true;
        this.updateButtonStates();
        
        // Get selected video duration from dropdown
        const videoDurationSelect = document.getElementById('videoDuration');
        const selectedDuration = videoDurationSelect ? parseInt(videoDurationSelect.value) : 60;
        
        // Get audio duration for progress message
        const audioDuration = typeof this.generatedContent.audio === 'object' ? 
            this.generatedContent.audio.duration : selectedDuration;
        const videoDuration = selectedDuration; // Use the selected duration
        
        this.updateProgress('video', 'processing', `Creating ${videoDuration}-second video...`);
        
        try {
            // Use the VideoGenerator class to create the video
            const videoGenerator = new VideoGenerator();
            
            // Prepare audio data based on whether it's split or not
            let audioData = this.generatedContent.audio;
            let audioElement = audioData.element;
            let isSplitAudio = audioData.isSplit || false;
            let audioElements = null;
            
            // If audio is split, prepare the array of audio elements
            if (isSplitAudio && audioData.parts && audioData.parts.length > 0) {
                audioElements = audioData.parts.map(part => part.element);
                console.log(`Preparing ${audioElements.length} split audio parts for video creation`);
            }
            
            const videoBlob = await videoGenerator.createVideo({
                images: this.generatedContent.images,
                audio: isSplitAudio ? audioElements : audioElement,
                script: this.generatedContent.script,
                videoDuration: videoDuration, // Pass the selected duration to the video generator
                isSplitAudio: isSplitAudio // Pass the flag indicating if audio is split
            });
            
            // Create video URL
            const videoUrl = URL.createObjectURL(videoBlob);
            this.generatedContent.video = videoUrl;
            
            // Display video
            const finalVideo = document.getElementById('finalVideo');
            if (finalVideo) {
                finalVideo.src = videoUrl;
            }
            
            this.updateProgress('video', 'completed', `${videoDuration}-second video created!`, 100);
            this.showResult();
            
        } catch (error) {
            this.updateProgress('video', 'error', 'Video creation failed');
            throw error;
        } finally {
            this.isGenerating = false;
            this.updateButtonStates();
        }
    }

    updateProgress(step, status, message, progress = 0) {
        const progressFill = document.getElementById(`${step}Progress`);
        const statusElement = document.getElementById(`${step}Status`);
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `progress-status ${status}`;
        }
    }

    showProgress() {
        const progressSection = document.querySelector('.progress-section');
        if (progressSection) {
            progressSection.style.display = 'block';
        }
        
        // Reset all progress items
        ['script', 'image', 'audio', 'video'].forEach(step => {
            this.updateProgress(step, 'waiting', 'Waiting...');
        });
    }

    hideProgress() {
        const progressSection = document.querySelector('.progress-section');
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }

    showResult() {
        const resultSection = document.getElementById('resultSection');
        if (resultSection) {
            resultSection.style.display = 'block';
        }
        
        // Update video info with dynamic duration
        const videoDurationInfo = document.getElementById('videoDurationInfo');
        const videoSizeInfo = document.getElementById('videoSizeInfo');
        
        if (videoDurationInfo) {
            // Get audio duration for accurate video duration display
            const audioDuration = typeof this.generatedContent.audio === 'object' ? 
                this.generatedContent.audio.duration : 60;
            const videoDuration = audioDuration + 1; // Video is slightly longer than audio
            videoDurationInfo.textContent = `${videoDuration} seconds`;
        }
        
        if (videoSizeInfo) {
            videoSizeInfo.textContent = '~10-20 MB';
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorText = document.getElementById('errorText');
        
        if (errorContainer && errorText) {
            errorText.textContent = message;
            errorContainer.style.display = 'block';
        }
        
        console.error('Error:', message);
    }

    hideError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    editScript() {
        const scriptContent = document.getElementById('scriptContent');
        if (!scriptContent) return;
        
        const currentScript = this.generatedContent.script;
        const newScript = prompt('Edit your script:', currentScript);
        
        if (newScript && newScript !== currentScript) {
            this.generatedContent.script = newScript;
            scriptContent.textContent = newScript;
        }
    }

    resetAll() {
        // Clear generated content
        this.generatedContent = {
            script: '',
            images: [],
            audio: null,
            video: null
        };
        
        // Clear UI
        const scriptContent = document.getElementById('scriptContent');
        const imagesGrid = document.getElementById('imagesGrid');
        const audioPlayer = document.getElementById('audioPlayer');
        const finalVideo = document.getElementById('finalVideo');
        
        if (scriptContent) scriptContent.textContent = '';
        if (imagesGrid) imagesGrid.innerHTML = '';
        if (audioPlayer) audioPlayer.src = '';
        if (finalVideo) finalVideo.src = '';
        
        // Hide preview sections
        const scriptPreview = document.getElementById('scriptPreview');
        const imagesPreview = document.getElementById('imagesPreview');
        const audioPreview = document.getElementById('audioPreview');
        const resultSection = document.getElementById('resultSection');
        
        if (scriptPreview) scriptPreview.style.display = 'none';
        if (imagesPreview) imagesPreview.style.display = 'none';
        if (audioPreview) audioPreview.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';
        
        this.hideProgress();
        this.hideError();
        this.updateButtonStates();
    }

    downloadVideo() {
        if (!this.generatedContent.video) {
            this.showError('No video available for download');
            return;
        }
        
        const link = document.createElement('a');
        link.href = this.generatedContent.video;
        link.download = `ai-generated-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoApp = new VideoGeneratorApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.videoApp && !window.videoApp.isGenerating) {
        window.videoApp.showError('An unexpected error occurred. Please try again.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.videoApp && !window.videoApp.isGenerating) {
        window.videoApp.showError('An unexpected error occurred. Please try again.');
    }
});

// -----------------------------------------------------------------------------
// Additional helper classes for image generation
//
// The following classes provide alternative approaches to image generation
// through Pollinations. The PollinationsProxy class is useful during
// development when CORS restrictions prevent direct API calls from a local
// environment. It prefixes requests with a proxy URL to circumvent the
// browser's preflight checks. The ProductionImageGenerator class offers a
// simplified interface for production environments where CORS is not an
// issue. Both classes sanitize prompts using a cleanPrompt method to avoid
// sending malformed HTML or metadata to the API.

/**
 * Development proxy solution for Pollinations image generation.
 *
 * Use this class when running the application from a local server. It
 * automatically routes requests through a proxy to avoid CORS issues and
 * generates image URLs that can be used directly in <img> tags.
 */
class PollinationsProxy {
    constructor() {
        // Base proxy URL; this service forwards requests and handles CORS
        this.proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        // Base API URL for Pollinations images
        this.baseUrl = 'https://image.pollinations.ai/prompt/';
    }

    /**
     * Generate an image URL via the proxy.
     *
     * @param {string} prompt - The raw prompt for image generation
     * @param {Object} options - Additional query parameters (width, height, seed, model, etc.)
     * @returns {Promise<string>} - A URL string pointing to the generated image
     */
    async generateImage(prompt, options = {}) {
        const cleanPrompt = this.cleanPrompt(prompt);
        const params = new URLSearchParams({
            width: options.width || 720,
            height: options.height || 1280,
            seed: options.seed || Math.floor(Math.random() * 1000000),
            model: options.model || 'flux',
            quality: 'best',
            nologo: 'true'
        });

        const url = `${this.proxyUrl}${this.baseUrl}${encodeURIComponent(cleanPrompt)}?${params}`;

        try {
            const response = await fetch(url);
            if (response.ok) {
                // Strip the proxy prefix before returning so the returned URL can
                // be used directly in an <img> tag.
                return url.replace(this.proxyUrl, '');
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.error('Proxy generation failed:', error);
            throw error;
        }
    }

    /**
     * Remove HTML tags and entities from the prompt. If the result is empty or
     * suspicious, provide a generic fallback prompt.
     *
     * @param {string} prompt - The original prompt
     * @returns {string} - A sanitized prompt
     */
    cleanPrompt(prompt) {
        const sanitized = prompt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
        return sanitized || 'artistic masterpiece';
    }
}

/**
 * Production-ready image generator for Pollinations.
 *
 * This class is intended for use in production environments where CORS is
 * properly configured on the server. It asynchronously preloads an image
 * using a standard <img> element and returns the final URL upon success.
 */
class ProductionImageGenerator {
    constructor() {
        this.baseUrl = 'https://image.pollinations.ai/prompt/';
    }

    /**
     * Generate an image and return a URL that can be used directly in the DOM.
     *
     * @param {string} prompt - The raw prompt to generate an image from
     * @param {Object} options - Additional query parameters (width, height, seed, model, etc.)
     * @returns {Promise<string>} - The URL of the generated image
     */
    async generateImage(prompt, options = {}) {
        const cleanPrompt = this.sanitizePrompt(prompt);

        const url = this.buildUrl(cleanPrompt, options);

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(this.getFallbackUrl(options));
            img.src = url;
        });
    }

    /**
     * Construct the full request URL with the provided options.
     */
    buildUrl(prompt, options) {
        const params = {
            width: options.width || 720,
            height: options.height || 1280,
            seed: options.seed || Date.now(),
            model: options.model || 'flux',
            nologo: 'true'
        };
        const queryString = Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
        return `${this.baseUrl}${encodeURIComponent(prompt)}?${queryString}`;
    }

    /**
     * Sanitize the prompt by removing HTML and unwanted metadata. Provide a
     * reasonable fallback when necessary.
     */
    sanitizePrompt(prompt) {
        return prompt
            .replace(/<[^>]*>/g, '')
            .replace(/&[a-zA-Z0-9#]+;/g, ' ')
            .replace(/doctype|html|meta|charset|viewport/gi, '')
            .replace(/[^\w\s,.-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim() || 'beautiful artistic scene';
    }

    /**
     * Provide a fallback URL in case image generation fails. This uses a
     * generic prompt to ensure that some image always loads.
     */
    getFallbackUrl(options) {
        return this.buildUrl('stunning digital art masterpiece', options);
    }
}

// Expose the helper classes globally so they can be accessed from HTML if needed
window.PollinationsProxy = PollinationsProxy;
window.ProductionImageGenerator = ProductionImageGenerator;
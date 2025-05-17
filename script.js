document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const labels = document.querySelectorAll('.resolutions label');
    const container = document.querySelector('.container');
    const dropArea = document.querySelector('#drop-area');
    const fileInput = document.querySelector('#fileInput');
    const browseBtn = document.querySelector('#browseBtn');
    const compressBtn = document.querySelector('#compressBtn');
    const outputDiv = document.querySelector('#output');
    const dropAreaText = document.querySelector('#drop-area-text');
    const fileInfo = document.querySelector('#file-info');
    const themeToggle = document.querySelector('#theme-toggle');
    const themeIcon = document.querySelector('#theme-icon');
    const resolutions = document.querySelectorAll('input[name="resolution"]');
    const optionsContainer = document.querySelector('#options');
    const sizeControlsContainer = document.querySelector('#size-controls');
    const pageTitle = document.querySelector('h1');

    // Create and append the overlay for screen dimming
    const dragDropOverlay = document.createElement('div');
    dragDropOverlay.id = 'drag-drop-overlay';
    document.body.appendChild(dragDropOverlay);

    // Initialize variables
    let sizeSlider = document.querySelector('#size-slider');
    let sizeValueDisplay = document.querySelector('#size-value');
    let sizeUnitSelector = document.querySelector('#unit-selector');
    let currentFiles = [];
    let isDragging = false;
    let individualFileSizes = [];
    let loadingIndicator;
    let globalDragCounter = 0;
    let isFileDrag = false;

    // Set initial values
    document.querySelector('input[id="1080"]').checked = true;

    // Theme management
    function setTheme(theme) {
        document.body.className = theme;
        themeIcon.className = theme === 'dark-mode' ? 'fa-solid fa-mountain-sun' : 'fa-solid fa-moon';
        localStorage.setItem('theme', theme);
    }

    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    setTheme(savedTheme);

    themeToggle.onclick = () => {
        const currentTheme = document.body.className;
        const newTheme = currentTheme === 'dark-mode' ? 'light-mode' : 'dark-mode';
        setTheme(newTheme);
    };

    function highlight() {
        dropArea.classList.add('drag-active');
        dropAreaText.style.opacity = '0';
    }

    function unhighlight() {
        dropArea.classList.remove('drag-active');
        if (currentFiles.length === 0) {
            dropAreaText.style.opacity = '1';
        }
    }

    function resetDragState() {
        globalDragCounter = 0;
        isFileDrag = false;
        dragDropOverlay.classList.remove('visible');
        container.classList.remove('drag-global-active-target');
        document.body.classList.remove('dragging-globally');
        browseBtn.classList.remove('hidden-during-drag');
        unhighlight(); // Ensure dropArea is unhighlighted
    }

    window.addEventListener('dragenter', (e) => {
        const types = e.dataTransfer?.types;
        if (types && Array.from(types).includes('Files')) {
            e.preventDefault();
            isFileDrag = true;
            globalDragCounter++;
            if (globalDragCounter === 1) {
                dragDropOverlay.classList.add('visible');
                container.classList.add('drag-global-active-target');
                document.body.classList.add('dragging-globally');
                browseBtn.classList.add('hidden-during-drag');
            }
        }
    }, false);

    window.addEventListener('dragover', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, false);

    window.addEventListener('dragleave', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            globalDragCounter--;
            if (globalDragCounter <= 0) {
                resetDragState();
            }
        }
    }, false);

    window.addEventListener('drop', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            resetDragState();
        }
    }, false);

    dropArea.addEventListener('dragenter', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            highlight();
        }
    });

    dropArea.addEventListener('dragover', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            highlight();
        }
    });

    dropArea.addEventListener('dragleave', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            if (e.relatedTarget && !dropArea.contains(e.relatedTarget) || !e.relatedTarget) {
                unhighlight();
            }
        }
    });

    dropArea.addEventListener('drop', (e) => {
        if (isFileDrag) {
            e.preventDefault(); // Still prevent default to avoid browser opening the file
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                fileInput.files = files;
                handleFiles(files);
            }
            // No need to reset state here, as window drop handler will handle it
            unhighlight();
        }
    });

    window.addEventListener('dragend', (e) => {
        if (isFileDrag) {
            e.preventDefault();
            resetDragState();
        }
    }, false);

    fileInput.onchange = (e) => {
        handleFiles(e.target.files);
    };

    browseBtn.onclick = () => {
        fileInput.click();
    };

    function createSizeControls() {
        sizeControlsContainer.innerHTML = '';

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const unitSelector = document.createElement('select');
        unitSelector.className = 'unit-selector gradient-stroke';
        unitSelector.innerHTML = `
            <option value="percent">Percent</option>
            <option value="size">Size (KB)</option>
        `;
        sizeUnitSelector = unitSelector;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'size-slider';
        sizeSlider = slider;

        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'size-value-container';

        const valueText = document.createElement('span');
        valueText.className = 'size-value';
        valueText.textContent = '80%';
        valueText.contentEditable = 'true';
        sizeValueDisplay = valueText;

        valueText.addEventListener('focus', function() {
            this.dataset.originalValue = this.textContent;
            const numericValue = this.textContent.replace(/[^\d]/g, '');
            this.textContent = numericValue;
            setTimeout(() => {
                document.execCommand('selectAll', false, null);
            }, 10);
        });

        valueText.addEventListener('blur', function() {
            let newValue = parseInt(this.textContent) || parseInt(this.dataset.originalValue) || 80;
            if (sizeUnitSelector.value === 'percent') {
                newValue = Math.max(10, Math.min(100, newValue));
                this.textContent = `${newValue}%`;
                sizeSlider.value = newValue;
            } else {
                const maxSize = individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 1024;
                const minSize = Math.max(1, Math.floor(maxSize * 0.1));
                newValue = Math.max(minSize, Math.min(maxSize, newValue));
                this.textContent = `${newValue} KB`;
                sizeSlider.value = newValue;
            }
            updateSizeDisplay(true);
        });

        valueText.addEventListener('input', function() {
            this.textContent = this.textContent.replace(/[^\d]/g, '');
        });

        valueText.addEventListener('keydown', function(e) {
            if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });

        valueDisplay.appendChild(valueText);

        // Calculate file sizes
        individualFileSizes = currentFiles.map(f => Math.max(f.size / 1024, 1));

        // Set initial slider values
        if (sizeUnitSelector.value === 'percent') {
            slider.min = '10';
            slider.max = '100';
            slider.value = '80';
        } else {
            const maxSize = individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 1024;
            const minSize = Math.max(1, Math.floor(maxSize * 0.1));
            slider.min = minSize.toString();
            slider.max = maxSize.toString();
            slider.value = maxSize.toString();
        }

        slider.oninput = () => updateSizeDisplay();
        unitSelector.onchange = () => {
            if (unitSelector.value === 'percent') {
                sizeSlider.min = '10';
                sizeSlider.max = '100';
                sizeSlider.value = '80';
                sizeValueDisplay.textContent = '80%';
            } else {
                const maxSize = individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 1024;
                const minSize = Math.max(1, Math.floor(maxSize * 0.1));
                sizeSlider.min = minSize.toString();
                sizeSlider.max = maxSize.toString();
                sizeSlider.value = maxSize.toString();
                sizeValueDisplay.textContent = `${Math.round(maxSize)} KB`;
            }
            updateSizeDisplay(true);
        };

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        sizeControlsContainer.appendChild(sliderContainer);
        sizeControlsContainer.appendChild(unitSelector);

        sizeControlsContainer.style.display = 'block';

        updateSizeDisplay();
    }

    function updateSizeDisplay(keepText = false) {
        const value = parseFloat(sizeSlider.value);

        if (!keepText) {
            sizeValueDisplay.textContent = sizeUnitSelector.value === 'percent'
                ? `${Math.round(value)}%`
                : `${Math.round(value)} KB`;
        }

        const min = parseFloat(sizeSlider.min);
        const max = parseFloat(sizeSlider.max);
        const percent = ((value - min) / (max - min)) * 100 + 2.4;

        // Update background using CSS variable for consistency
        sizeSlider.style.setProperty('--value-percent', `${percent}%`);
        sizeSlider.style.background = `linear-gradient(to right, var(--accent-color) ${percent}%, var(--outline-color) ${percent}%)`;
    }

    function updateFileDisplay() {
        fileInfo.innerHTML = '';
    dropArea.classList.toggle('no-files', currentFiles.length === 0);
    dropArea.classList.toggle('files-added', currentFiles.length > 0);

        if (currentFiles.length === 0) {
            sizeControlsContainer.style.display = 'none';
            optionsContainer.classList.remove('show');
            compressBtn.classList.remove('show');
            dropAreaText.style.display = 'block';
            dropAreaText.style.opacity = '1'; // Ensure text is visible
            return;
        }
        dropAreaText.style.display = 'none';

        if (currentFiles.length <= 3) {
            currentFiles.forEach((file, index) => {
                const fileWrapper = document.createElement('div');
                fileWrapper.style.display = 'flex';
                fileWrapper.style.alignItems = 'center';
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item gradient-stroke';
                fileItem.innerHTML = `
                    <span class="file-name">${file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}</span>
                `;
                // <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
                const removeButton = document.createElement('button');
                removeButton.className = 'small-x gradient-stroke';
                removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeButton.dataset.index = index;

                removeButton.onclick = () => {
                    currentFiles.splice(index, 1);
                    updateFileDisplay();
                    if (currentFiles.length === 0) {
                        compressBtn.classList.remove('show');
                    }
                    createSizeControls(); // Update KB limits
                };

                fileWrapper.appendChild(fileItem);
                fileWrapper.appendChild(removeButton);
                fileInfo.appendChild(fileWrapper);
            });
        } else {
            const fileGroupWrapper = document.createElement('div');
            fileGroupWrapper.style.display = 'flex';
            fileGroupWrapper.style.alignItems = 'center';
            fileGroupWrapper.style.justifyContent = 'center';
            fileGroupWrapper.style.width = '100%';

            const fileGroup = document.createElement('div');
            fileGroup.className = 'file-group'; // No border styling here
            fileGroup.innerHTML = `${currentFiles.length} files selected`;

            const clearAllButton = document.createElement('button');
            clearAllButton.className = 'small-x clear-all gradient-stroke';
            clearAllButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            clearAllButton.onclick = () => {
                currentFiles = [];
                updateFileDisplay();
                compressBtn.classList.remove('show');
            };

            fileGroupWrapper.appendChild(fileGroup);
            fileGroupWrapper.appendChild(clearAllButton);
            fileInfo.appendChild(fileGroupWrapper);
        }

        compressBtn.classList.add('show');
        createSizeControls();
    }

    function handleFiles(files) {
        if (!files || files.length === 0) {
            return;
        }

        const newFiles = Array.from(files).filter(file => file.type.startsWith('image'));

        if (newFiles.length === 0) {
            showError('No supported image files selected');
            return;
        }

        currentFiles = [...currentFiles, ...newFiles].slice(0, 10);
        updateFileDisplay();
        dropAreaText.style.display = 'none';
    }

    function showError(message) {
        const errorCard = document.querySelector('#error-card');
        errorCard.textContent = message;
        errorCard.classList.add('show');
        setTimeout(() => {
            errorCard.classList.remove('show');
        }, 3000);
    }

    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return { width: srcWidth * ratio, height: srcHeight * ratio };
    }

    function createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressInner = document.createElement('div');
        progressInner.className = 'progress-inner';

        progressBar.appendChild(progressInner);

        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Compressing...';

        loadingDiv.appendChild(loadingText);
        loadingDiv.appendChild(progressBar);

        document.body.appendChild(loadingDiv);

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 1;
            if (progress > 95) {
                clearInterval(progressInterval);
            }
            progressInner.style.width = `${progress}%`;
        }, 50);

        return {
            element: loadingDiv,
            complete: () => {
                clearInterval(progressInterval);
                progressInner.style.width = '100%';
                setTimeout(() => {
                    loadingDiv.remove();
                }, 500);
            }
        };
    }

    async function compressFiles() {
        if (currentFiles.length === 0) {
            showError('No files selected');
            return;
        }

        loadingIndicator = createLoadingIndicator();
        outputDiv.innerHTML = '';
        outputDiv.style.display = 'block';

        const resolution = document.querySelector('input[name="resolution"]:checked').value;
        const compressedFiles = [];
        const fileResults = [];

        for (const file of currentFiles) {
            try {
                let targetSizeOrQuality;
                if (sizeUnitSelector.value === 'size') {
                    const fileSizeKB = (file.size / 1024).toFixed(1);
                    targetSizeOrQuality = Math.min(parseInt(sizeSlider.value) / fileSizeKB, 0.92);
                } else {
                    targetSizeOrQuality = parseInt(sizeSlider.value) / 100;
                }

                const compressed = await compressImage(file, resolution, targetSizeOrQuality);
                compressedFiles.push(compressed);

                fileResults.push({
                    name: file.name,
                    originalSize: file.size.toFixed(1),
                    compressedSize: compressed.blob.size
                });
            } catch (error) {
                showError(`Error compressing ${file.name}`);
                console.error(error);
            }
        }

        loadingIndicator.complete();

        if (compressedFiles.length === 0) return;

        const resultDiv = document.createElement('div');
        resultDiv.className = 'compression-result gradient-stroke';

        resultDiv.innerHTML = `
            <h3 class="result-title">Compression Complete</h3>
        `;

        if (fileResults.length === 1) {
            const file = fileResults[0];
            const reduction = ((file.originalSize - file.compressedSize) / file.originalSize * 100).toFixed(1);

            resultDiv.innerHTML += `
                <div class="result-stats">
                    <div class="stat-item">
                        <span class="stat-value">1</span>
                        <span class="stat-label">File</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${(file.originalSize / 1024).toFixed(1)} KB</span>
                        <span class="stat-label">Original</span>
                    </div>
                    <div class="stat-item highlight">
                        <span class="stat-value">${(file.compressedSize / 1024).toFixed(1)} KB</span>
                        <span class="stat-label">Compressed</span>
                    </div>
                    <div class="stat-item highlight">
                        <span class="stat-value">${reduction}%</span>
                        <span class="stat-label">Reduced</span>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML += `
                <div class="result-stats">
                    <div class="stat-item">
                        <span class="stat-value">${compressedFiles.length}</span>
                        <span class="stat-label">Files</span>
                    </div>
                </div>
                <div class="file-results">
                    <h4>Individual Results</h4>
                    <div class="file-results-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>File</th>
                                    <th>Original</th>
                                    <th></th>
                                    <th>Compressed</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${fileResults.map(file => {
                                    const reduction = ((file.originalSize - file.compressedSize) / file.originalSize * 100).toFixed(1);
                                    return `
                                        <tr>
                                            <td>${file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}</td>
                                            <td>${(file.originalSize / 1024).toFixed(1)} KB</td>
                                            <td><i class="fa-solid fa-arrow-right"></i></td>
                                            <td class="highlight">${(file.compressedSize / 1024).toFixed(1)} KB</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        outputDiv.appendChild(resultDiv);

        if (compressedFiles.length === 1) {
            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link gradient-stroke';
            downloadLink.href = compressedFiles[0].dataUrl;
            downloadLink.download = compressedFiles[0].name;
            downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Download';
            outputDiv.appendChild(downloadLink);
        } else {
            const zip = new JSZip();
            compressedFiles.forEach(file => {
                zip.file(file.name, file.blob);
            });
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link gradient-stroke';
            loadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = 'compressed_files.zip';
            downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Download All';
            outputDiv.appendChild(downloadLink);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'small-x gradient-stroke';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

        closeBtn.onclick = () => {
            outputDiv.style.display = 'none';
            compressBtn.classList.add('show');
        };

        outputDiv.appendChild(closeBtn);
        compressBtn.classList.remove('show');
    }

    async function compressImage(file, resolution, qualityFactor) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    const img = new Image();
                    img.onload = function() {
                        const [targetWidth, targetHeight] = getResolutionDimensions(resolution);

                        const dimensions = calculateAspectRatioFit(
                            img.width,
                            img.height,
                            targetWidth,
                            targetHeight
                        );

                        const canvas = document.createElement('canvas');
                        canvas.width = dimensions.width;
                        canvas.height = dimensions.height;
                        const ctx = canvas.getContext('2d');

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

                        const imageQuality = Math.max(0.1, Math.min(0.92, qualityFactor));
                        const dataUrl = canvas.toDataURL('image/jpeg', imageQuality);

                        fetch(dataUrl)
                            .then(res => res.blob())
                            .then(blob => {
                                const compressedName = `compressed_${file.name}`;
                                resolve({ name: compressedName, dataUrl, blob });
                            })
                            .catch(reject);
                    };

                    img.onerror = reject;
                    img.src = event.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function getResolutionDimensions(resolution) {
        switch (resolution) {
            case '360': return [640, 360];
            case '480': return [854, 480];
            case '720': return [1280, 720];
            case '1080': return [1920, 1080];
            case '1440': return [2560, 1440];
            case '2160': return [3840, 2160];
            default: return [1920, 1080];
        }
    }

    compressBtn.onclick = compressFiles;
});
import { compressImage } from './logics/imageCompression.js'; // Assuming your path is correct

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
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
    const optionsContainer = document.querySelector('#options');
    const sizeControlsContainer = document.querySelector('#size-controls'); // This contains the toggle

    // Elements within size-controls
    let sizeSlider = document.querySelector('#size-slider');
    let sizeValueDisplay = document.querySelector('#size-value');
    let sizeUnitSelector = document.querySelector('#unit-selector');
    const compressionModeToggle = document.querySelector('#compression-mode-toggle'); // The toggle switch

    const dragDropOverlay = document.createElement('div');
    dragDropOverlay.id = 'drag-drop-overlay';
    document.body.appendChild(dragDropOverlay);

    let currentFiles = [];
    let individualFileSizes = [];
    let loadingIndicator;
    let globalDragCounter = 0;
    let isFileDrag = false;

    document.querySelector('input[name="resolution"][value="1080"]').checked = true;

    // --- Theme Management ---
    function setTheme(theme) {
        document.body.className = theme;
        themeIcon.className = theme === 'dark-mode' ? 'fa-solid fa-mountain-sun' : 'fa-solid fa-moon';
        localStorage.setItem('theme', theme);
    }
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    setTheme(savedTheme);
    themeToggle.onclick = () => {
        setTheme(document.body.className === 'dark-mode' ? 'light-mode' : 'dark-mode');
    };

    // --- Drag and Drop Handlers ---
    function highlight() { dropArea.classList.add('drag-active'); dropAreaText.style.opacity = '0'; }
    function unhighlight() { dropArea.classList.remove('drag-active'); if (currentFiles.length === 0) dropAreaText.style.opacity = '1';}
    function resetDragState() {
        globalDragCounter = 0; isFileDrag = false;
        dragDropOverlay.classList.remove('visible');
        container.classList.remove('drag-global-active-target');
        document.body.classList.remove('dragging-globally');
        browseBtn.classList.remove('hidden-during-drag');
        unhighlight();
    }
    window.addEventListener('dragenter', (e) => {
        const types = e.dataTransfer?.types;
        if (types && Array.from(types).includes('Files')) {
            e.preventDefault(); isFileDrag = true; globalDragCounter++;
            if (globalDragCounter === 1) {
                dragDropOverlay.classList.add('visible');
                document.body.classList.add('dragging-globally');
                browseBtn.classList.add('hidden-during-drag');
            }
        }
    }, false);
    window.addEventListener('dragover', (e) => { if (isFileDrag) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}, false);
    window.addEventListener('dragleave', (e) => { if (isFileDrag) { e.preventDefault(); globalDragCounter--; if (globalDragCounter <= 0) resetDragState(); }}, false);
    window.addEventListener('drop', (e) => { if (isFileDrag) { e.preventDefault(); resetDragState(); }}, false);
    dropArea.addEventListener('dragenter', (e) => { if (isFileDrag) { e.preventDefault(); highlight(); }});
    dropArea.addEventListener('dragover', (e) => { if (isFileDrag) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; highlight(); }});
    dropArea.addEventListener('dragleave', (e) => { if (isFileDrag) { e.preventDefault(); if ((e.relatedTarget && !dropArea.contains(e.relatedTarget)) || !e.relatedTarget) unhighlight(); }});
    dropArea.addEventListener('drop', (e) => {
        if (isFileDrag) {
            e.preventDefault(); const files = e.dataTransfer.files;
            if (files && files.length > 0) { fileInput.files = files; handleFiles(files); }
            unhighlight();
        }
    });
    window.addEventListener('dragend', (e) => { if (isFileDrag) { e.preventDefault(); resetDragState(); }}, false);

    fileInput.onchange = (e) => handleFiles(e.target.files);
    browseBtn.onclick = () => fileInput.click();

    function updateUiForCompressionMode() {
      const isLossless = compressionModeToggle.checked;
      const sliderContainerElement = sizeControlsContainer.querySelector('.slider-container');
      const unitSelectorElement = sizeControlsContainer.querySelector('.unit-selector');

    //   if (sliderContainerElement) {
    //     sliderContainerElement.style.display = isLossless ? 'none' : 'flex'; // 'flex' or 'block' as per your CSS
    //   }
    //   if (unitSelectorElement) {
    //     unitSelectorElement.style.display = isLossless ? 'none' : 'block'; // 'block' or as per your CSS
    //   }
 }

    if (compressionModeToggle) {
        compressionModeToggle.addEventListener('change', updateUiForCompressionMode);
    }


function configureSizeControls() {
    if (!sizeSlider || !sizeValueDisplay || !sizeUnitSelector) {
        console.error("Size control elements not found in configureSizeControls.");
        return;
    }

    individualFileSizes = currentFiles.map(f => Math.max(f.size / 1024, 1)); // in KB

    if (sizeUnitSelector.value === 'percent') {
        sizeSlider.min = '10';
        sizeSlider.max = '100';
        const currentSliderVal = parseFloat(sizeSlider.value);
        if (isNaN(currentSliderVal) || currentSliderVal < 10 || currentSliderVal > 100) {
            sizeSlider.value = '80';
        }
        sizeValueDisplay.textContent = `${Math.round(parseFloat(sizeSlider.value))}%`;
    } else { // Size in KB
        const maxSizeKB = individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 1024;
        const minSizeKB = Math.max(1, Math.floor(maxSizeKB * 0.05));
        sizeSlider.min = minSizeKB.toString();
        sizeSlider.max = maxSizeKB.toString();
        const currentSliderVal = parseFloat(sizeSlider.value);
        if (isNaN(currentSliderVal) || currentSliderVal < minSizeKB || currentSliderVal > maxSizeKB) {
            sizeSlider.value = maxSizeKB.toString();
        }
        sizeValueDisplay.textContent = `${Math.round(parseFloat(sizeSlider.value))} KB`;
    }
    
    sizeControlsContainer.style.display = 'flex';
    sizeControlsContainer.style.flexDirection = 'column';
    sizeControlsContainer.style.alignItems = 'center';
    sizeControlsContainer.style.gap = '10px';
    updateSizeSliderVisuals();
    updateUiForCompressionMode();
}

    /**
     * Updates the visual fill of the size slider and its text value.
     * @param {boolean} updateTextFromSlider - If true, the text value is updated from the slider's current position.
     */
    function updateSizeSliderVisuals(updateTextFromSlider = true) {
        if (!sizeSlider || !sizeValueDisplay || !sizeUnitSelector) return;

        const value = parseFloat(sizeSlider.value);
        if (updateTextFromSlider) {
            sizeValueDisplay.textContent = sizeUnitSelector.value === 'percent'
                ? `${Math.round(value)}%`
                : `${Math.round(value)} KB`;
        }

        const min = parseFloat(sizeSlider.min);
        const max = parseFloat(sizeSlider.max);
        const percentFill = (max === min) ? 100 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
        
        sizeSlider.style.setProperty('--value-percent', `${percentFill}%`);
        // The CSS for .size-slider should use this --value-percent variable for its background gradient
    }

    // --- Event Listeners for static controls (setup once) ---
    if (sizeSlider) {
        sizeSlider.oninput = () => updateSizeSliderVisuals(true);
    }

    if (sizeUnitSelector) {
        sizeUnitSelector.onchange = () => {
            // When unit changes, reconfigure the slider's min/max and current value
            if (sizeUnitSelector.value === 'percent') {
                sizeSlider.min = '10';
                sizeSlider.max = '100';
                sizeSlider.value = '80'; // Default percentage
            } else { // Size in KB
                const maxSizeKB = individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 1024;
                const minSizeKB = Math.max(1, Math.floor(maxSizeKB * 0.05));
                sizeSlider.min = minSizeKB.toString();
                sizeSlider.max = maxSizeKB.toString();
                sizeSlider.value = maxSizeKB.toString(); // Default to smallest file's max size
            }
            updateSizeSliderVisuals(true); // Update text and slider fill
        };
    }

    if (sizeValueDisplay && sizeValueDisplay.contentEditable === 'true') {
        sizeValueDisplay.addEventListener('focus', function() {
            this.dataset.originalValue = this.textContent;
            const numericValue = this.textContent.replace(/[^\d.]/g, '');
            this.textContent = numericValue;
            setTimeout(() => { try { document.execCommand('selectAll', false, null); } catch(e) {/*ignore*/} }, 10);
        });
        sizeValueDisplay.addEventListener('blur', function() {
            let rawValue = parseFloat(this.textContent);
            if (isNaN(rawValue)) {
                const originalNumeric = parseFloat(this.dataset.originalValue.replace(/[^\d.]/g, ''));
                rawValue = isNaN(originalNumeric) ? (sizeUnitSelector.value === 'percent' ? 80 : (individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 500)) : originalNumeric;
            }

            if (sizeUnitSelector.value === 'percent') {
                rawValue = Math.max(10, Math.min(100, Math.round(rawValue)));
                sizeSlider.value = rawValue;
            } else { // Size in KB
                const maxSizeKB = individualFileSizes.length > 0 ? Math.min(...individualFileSizes) : 1024;
                const minSizeKB = Math.max(1, Math.floor(maxSizeKB * 0.05));
                rawValue = Math.max(minSizeKB, Math.min(maxSizeKB, Math.round(rawValue)));
                sizeSlider.value = rawValue;
            }
            updateSizeSliderVisuals(true); // Update text from slider (which now reflects input) and fill
        });
        sizeValueDisplay.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
            if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
                if (!(e.key === '.' && sizeUnitSelector.value === 'size' && !this.textContent.includes('.'))) {
                     e.preventDefault();
                }
            }
        });
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
        dropAreaText.style.opacity = '1';
        document.querySelector('.resolutions').style.display = 'none';
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
            fileItem.innerHTML = `<span class="file-name" title="${file.name}">${file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}</span>`;
            const removeButton = document.createElement('button');
            removeButton.className = 'small-x gradient-stroke';
            removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeButton.onclick = (e) => {
                e.stopPropagation();
                currentFiles.splice(index, 1);
                updateFileDisplay();
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
        fileGroup.className = 'file-group';
        fileGroup.innerHTML = `${currentFiles.length} files selected`;
        const clearAllButton = document.createElement('button');
        clearAllButton.className = 'small-x clear-all gradient-stroke';
        clearAllButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        clearAllButton.onclick = (e) => {
            e.stopPropagation();
            currentFiles = [];
            updateFileDisplay();
        };
        fileGroupWrapper.appendChild(fileGroup);
        fileGroupWrapper.appendChild(clearAllButton);
        fileInfo.appendChild(fileGroupWrapper);
    }

    optionsContainer.classList.add('show');
    compressBtn.classList.add('show');
    configureSizeControls();

    // Hide resolution options unless a video file is detected
    const hasVideo = currentFiles.some(file => file.type.startsWith('video/'));
    document.querySelector('.resolutions').style.display = hasVideo ? 'flex' : 'none';
}

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (newFiles.length === 0) { showError('No supported image files selected.'); return; }
        
        newFiles.forEach(nf => {
            if (!currentFiles.some(cf => cf.name === nf.name && cf.size === nf.size)) {
                currentFiles.push(nf);
            }
        });
        currentFiles = currentFiles.slice(0, 10);
        updateFileDisplay();
    }

    function showError(message) {
        const errorCard = document.querySelector('#error-card');
        errorCard.textContent = message; errorCard.classList.add('show');
        setTimeout(() => errorCard.classList.remove('show'), 3000);
    }

    function createLoadingIndicator() {
        const loadingDiv = document.createElement('div'); loadingDiv.className = 'loading-indicator';
        const progressBar = document.createElement('div'); progressBar.className = 'progress-bar';
        const progressInner = document.createElement('div'); progressInner.className = 'progress-inner';
        progressBar.appendChild(progressInner);
        const loadingText = document.createElement('div'); loadingText.className = 'loading-text';
        loadingText.textContent = 'Compressing...';
        loadingDiv.appendChild(loadingText); loadingDiv.appendChild(progressBar);
        document.body.appendChild(loadingDiv); loadingDiv.classList.add('show');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1; if (progress > 95) clearInterval(interval);
            progressInner.style.width = `${progress}%`;
        }, 50);
        return {
            element: loadingDiv,
            complete: () => {
                clearInterval(interval); progressInner.style.width = '100%';
                setTimeout(() => { loadingDiv.classList.remove('show'); setTimeout(() => loadingDiv.remove(), 300); }, 500);
            }
        };
    }

    async function compressFiles() {
        if (currentFiles.length === 0) { showError('No files selected'); return; }
        loadingIndicator = createLoadingIndicator();
        outputDiv.innerHTML = ''; outputDiv.style.display = 'block';

        const resolution = document.querySelector('input[name="resolution"]:checked').value;
        const isLossless = compressionModeToggle.checked;
        const compressedFilesData = [];
        const fileResultsForDisplay = [];

        for (const file of currentFiles) {
            try {
                let qualityFactorForLossy = 0.8;
                if (!isLossless) {
                    if (sizeUnitSelector.value === 'size') {
                        const targetSizeKB = parseFloat(sizeSlider.value);
                        const originalSizeKB = file.size / 1024;
                        if (originalSizeKB > 0) {
                            let calculatedQuality = (targetSizeKB / originalSizeKB);
                            if (targetSizeKB >= originalSizeKB * 0.9) qualityFactorForLossy = 0.92;
                            else if (targetSizeKB <= originalSizeKB * 0.15) qualityFactorForLossy = Math.max(0.1, calculatedQuality * 0.6);
                            else if (targetSizeKB <= originalSizeKB * 0.4) qualityFactorForLossy = Math.max(0.1, calculatedQuality * 0.75);
                            else qualityFactorForLossy = Math.min(0.92, Math.max(0.1, calculatedQuality * 0.88));
                        } else qualityFactorForLossy = 0.92;
                    } else {
                        qualityFactorForLossy = parseFloat(sizeSlider.value) / 100;
                    }
                    qualityFactorForLossy = Math.max(0.1, Math.min(0.92, qualityFactorForLossy));
                }

                const compressed = await compressImage(file, resolution, qualityFactorForLossy, isLossless);
                compressedFilesData.push(compressed);
                fileResultsForDisplay.push({
                    name: compressed.name, originalSize: file.size,
                    compressedSize: compressed.blob.size, isLossless: compressed.isLossless
                });
            } catch (error) {
                showError(`Error compressing ${file.name}: ${error.message || 'Unknown error'}`);
                console.error(`Error compressing ${file.name}:`, error);
            }
        }

        if(loadingIndicator) loadingIndicator.complete();
        if (compressedFilesData.length === 0) {
            outputDiv.innerHTML = `<p class="gradient-stroke" style="padding:15px 20px; border-radius:12px; background:var(--secondary); text-align:center;">No files were compressed successfully.</p>`;
            const msgPara = outputDiv.querySelector('p');
            if (msgPara) {
                const closeMsgBtn = document.createElement('button'); closeMsgBtn.className = 'small-x gradient-stroke';
                closeMsgBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                closeMsgBtn.style.position = 'absolute'; closeMsgBtn.style.top = '10px'; closeMsgBtn.style.right = '10px';
                closeMsgBtn.onclick = () => { outputDiv.style.display = 'none'; compressBtn.classList.add('show'); };
                msgPara.style.position = 'relative'; msgPara.appendChild(closeMsgBtn);
            }
            return;
        }

        const resultDiv = document.createElement('div');
        resultDiv.className = 'compression-result gradient-stroke';
        resultDiv.innerHTML = `<h3 class="result-title">Compression Complete <span style="font-size: 0.8em; opacity: 0.7;">(${isLossless ? 'Lossless PNG' : 'Lossy JPEG'})</span></h3>`;

        if (fileResultsForDisplay.length === 1) {
            const res = fileResultsForDisplay[0];
            const reduction = res.originalSize > 0 ? ((res.originalSize - res.compressedSize) / res.originalSize * 100) : 0;
            resultDiv.innerHTML += `
                <div class="result-stats">
                    <div class="stat-item"><span class="stat-value">1</span><span class="stat-label">File</span></div>
                    <div class="stat-item"><span class="stat-value">${(res.originalSize / 1024).toFixed(1)} KB</span><span class="stat-label">Original</span></div>
                    <div class="stat-item highlight"><span class="stat-value">${(res.compressedSize / 1024).toFixed(1)} KB</span><span class="stat-label">Compressed</span></div>
                    <div class="stat-item highlight"><span class="stat-value">${reduction.toFixed(1)}%</span><span class="stat-label">Reduced</span></div>
                </div>`;
        } else {
            resultDiv.innerHTML += `
                <div class="result-stats">
                    <div class="stat-item"><span class="stat-value">${compressedFilesData.length}</span><span class="stat-label">Files</span></div>
                </div>
                <div class="file-results">
                    <h4>Individual Results</h4>
                    <div class="file-results-table">
                        <table>
                            <thead><tr><th>File</th><th>Original</th><th></th><th>Compressed</th><th>Reduced</th></tr></thead>
                            <tbody>
                                ${fileResultsForDisplay.map(fr => {
                                    const reduction = fr.originalSize > 0 ? ((fr.originalSize - fr.compressedSize) / fr.originalSize * 100) : 0;
                                    return `
                                        <tr>
                                            <td title="${fr.name}">${fr.name.length > 20 ? fr.name.substring(0, 17) + '...' : fr.name}</td>
                                            <td>${(fr.originalSize / 1024).toFixed(1)} KB</td>
                                            <td><i class="fa-solid fa-arrow-right"></i></td>
                                            <td class="highlight">${(fr.compressedSize / 1024).toFixed(1)} KB</td>
                                            <td class="highlight">${reduction.toFixed(1)}%</td>
                                        </tr>`;
                                }).join('')}
                            </tbody></table></div></div>`;
        }
        outputDiv.appendChild(resultDiv);

        if (compressedFilesData.length === 1) {
            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link gradient-stroke';
            downloadLink.href = compressedFilesData[0].dataUrl;
            downloadLink.download = compressedFilesData[0].name;
            downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Download Image';
            outputDiv.appendChild(downloadLink);
        } else if (compressedFilesData.length > 1) {
            const zip = new JSZip();
            compressedFilesData.forEach(cf => zip.file(cf.name, cf.blob));
            const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE", compressionOptions: { level: 6 } });
            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link gradient-stroke';
            downloadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = `compressed_images${isLossless ? '_lossless' : ''}.zip`;
            downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Download All as ZIP';
            outputDiv.appendChild(downloadLink);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'small-x gradient-stroke';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.style.position = 'absolute'; closeBtn.style.top = '15px'; closeBtn.style.right = '15px';
        closeBtn.onclick = () => { outputDiv.style.display = 'none'; compressBtn.classList.add('show'); };
        resultDiv.appendChild(closeBtn);
        compressBtn.classList.remove('show');
    }

    // Initial setup calls
    updateFileDisplay(); // This will hide controls if no files initially
    compressBtn.onclick = compressFiles;

    // Initial UI update for compression mode (e.g. if toggle is checked by default)
    updateUiForCompressionMode(); 
});

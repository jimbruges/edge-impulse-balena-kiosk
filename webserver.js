window.WebServer = async () => {

    const els = {
        title: document.querySelector('#header-row h1'),
        cameraContainer: document.querySelector('#capture-camera .capture-camera-inner'),
        cameraImg: document.querySelector('#capture-camera img'),
        timePerInference: document.querySelector('#time-per-inference'),
        additionalInfo: document.querySelector('#additional-info'),
        timePerInferenceContainer: document.querySelector('#time-per-inference-container'),
        additionalInfoContainer: document.querySelector('#additional-info-container'),
        imageClassify: {
            row: document.querySelector('#image-classification-conclusion'),
            text: document.querySelector('#image-classification-conclusion .col'),
        },
        views: {
            loading: document.querySelector('#loading-view'),
            captureCamera: document.querySelector('#capture-camera'),
        }
    };

    const colors = [
        '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#42d4f4', '#f032e6', '#fabed4',
        '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3',
    ];
    const labelToColor = { };
    // // Define the top of the image and the number of columns

    const TOP_Y = 50;
    const NUM_COLS = 5;
    const COL_WIDTH = Math.round(96/ NUM_COLS);
    const MAX_ITEMS = 10;

    // Define the factor of the width/height which determines the threshold
    // for detection of the object's movement between frames:
    const DETECT_FACTOR = 1.5;
    // Initialize variables
    countsum = 0;
    previous_blobs  = new Array(NUM_COLS).fill([]); 

    function switchView(el) {
        for (let k of Object.keys(els.views)) {
            els.views[k].style.display = 'none';
        }
        el.style.display = '';
    }

    // Here is how we connect back to the server
    const socket = io.connect(location.origin);
    socket.on('connect', () => {
        socket.emit('hello');
    });

    socket.on('hello', (opts) => {
        els.title.textContent = opts.projectName;

        switchView(els.views.captureCamera);
    });

    socket.on('image', (opts) => {
        els.cameraImg.src = opts.img;
    });

    socket.on('classification', (opts) => {
        let result = opts.result;
        let modelType = opts.modelType;

        els.timePerInference.textContent = opts.timeMs;
        els.additionalInfo.textContent = 'Count: ' + countsum;
        els.timePerInferenceContainer.style.display = '';
        els.additionalInfoContainer.style.display = '';

        console.log('classification', opts.result, opts.timeMs);

        if (result.classification) {
            els.imageClassify.row.style.display = '';

            let conclusion = 'uncertain';

            for (let k of Object.keys(result.classification)) {
                if (result.classification[k] >= 0.7) {
                    conclusion = k + ' (' + result.classification[k].toFixed(2) + ')';
                }
            }

            els.imageClassify.text.textContent = conclusion;
        }
        else {
            for (let bx of Array.from(els.cameraContainer.querySelectorAll('.bounding-box-container'))) {
                bx.parentNode?.removeChild(bx);
            }
            let factor = els.cameraImg.naturalHeight / els.cameraImg.clientHeight;
            current_blobs = new Array(NUM_COLS).fill([]); 
            for (let b of result.bounding_boxes) {
                // console.log('b', b);
                let bb = {
                    x: b.x / factor,
                    y: b.y / factor,
                    width: b.width / factor,
                    height: b.height / factor,
                    label: b.label,
                    value: b.value
                };
                col = Math.round(b.x / COL_WIDTH);
                // console.log('prev_blobs', previous_blobs, COL_WIDTH);
                if (previous_blobs[col] != undefined){
                    for (let blob of previous_blobs[col]) {
                        if (blob.x != undefined) {
                            if (Math.abs(Math.round(b.x - blob.x)) < DETECT_FACTOR * (b.width + blob.width) && Math.abs(Math.round(b.y - blob.y)) < DETECT_FACTOR * (b.height + blob.height)) {
                                // Check this blob has "moved" across the Y threshold
                                if (blob.y >= TOP_Y && b.y < TOP_Y) {
                                    // Increment count for this column if blob has left the top of the image
                                    countsum++;
                                }
                            }
                        }
                        
                    }
                }
                if (current_blobs[col] != undefined) {
                    current_blobs[col].push(b);
                }
                else {
                    current_blobs[col] = [b];
                }
                
                previous_blobs = current_blobs;
                els.imageClassify.row.style.display = '';
                els.additionalInfo.textContent = 'Count: ' + countsum;
                els.imageClassify.text.textContent = 'Count: '+ countsum;
                console.log('countsum', countsum);
                if (!labelToColor[bb.label]) {
                    labelToColor[bb.label] = colors[0];
                    colors.splice(0, 1);
                }

                let color = labelToColor[bb.label];

                let el = document.createElement('div');
                el.classList.add('bounding-box-container');
                el.style.position = 'absolute';
                el.style.border = 'solid 3px ' + color;

                if (modelType === 'object_detection') {
                    el.style.width = (bb.width) + 'px';
                    el.style.height = (bb.height) + 'px';
                    el.style.left = (bb.x) + 'px';
                    el.style.top = (bb.y) + 'px';
                }
                else if (modelType === 'constrained_object_detection') {
                    let centerX = bb.x + (bb.width / 2);
                    let centerY = bb.y + (bb.height / 2);

                    el.style.borderRadius = '10px';
                    el.style.width = 20 + 'px';
                    el.style.height = 20 + 'px';
                    el.style.left = (centerX - 10) + 'px';
                    el.style.top = (centerY - 10) + 'px';
                }

                let label = document.createElement('div');
                label.classList.add('bounding-box-label');
                label.style.background = color;
                label.textContent = bb.label + ' (' + bb.value.toFixed(2) + ')';
                if (modelType === 'constrained_object_detection') {
                    el.style.whiteSpace = 'nowrap';
                }
                el.appendChild(label);

                els.cameraContainer.appendChild(el);
            }

            els.imageClassify.row.style.display = 'none';
        }
    });
};

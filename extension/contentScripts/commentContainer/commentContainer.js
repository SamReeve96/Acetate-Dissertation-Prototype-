//Manage comments

// for now default to 1, but in theory this would be read from a DB
nextAnnotationId = 1;

let currentOriginAndPath = window.location.origin + window.location.pathname;

annotationInstances = [];

currentAnnotationInstance = {
    url: currentOriginAndPath,
    annotations: []
};

// Annotations that have not been saved
// TODO if the user leaves the page when this array is populated, alert are they sure they want to leave-
draftAnnotations = [];

// Create annotation object
function CreateAnnotation(annotationData) {
    if (draftAnnotations.length > 0) {
        alert('Please delete or save current draft');
    } else {
        let newAnnotation = {
            ID: nextAnnotationId,
            elementAuditID: annotationData.elementAuditID,
            elementType: annotationData.elementType,
            selectedText: annotationData.selectionText,
            created: Date.now()
        };
    
        draftAnnotations.push(newAnnotation);
    
        displayAnnotation(newAnnotation);
    
        //needs to be cached, can be done by pressing the save button
    }
}

//Save annotation to cache (chrome sync storage) (TODO:before sending to remote storage)
function cacheAnnotation(newAnnotation) {
    // Check that there's an annotation
    if (!newAnnotation) {
        //message('Error: No annotation data');
        return;
    }

    currentAnnotationInstance.annotations.push(newAnnotation);

    let message = {
        type: 'cacheInstance',
        instance: currentAnnotationInstance
    };

    chrome.runtime.sendMessage(message);
}

// when the extension is loaded on a page, load all the annotations from the cache
function loadAnnotationsFromCache() {
    // set variable instance to cache instance
    chrome.storage.sync.get(['annotationInstances'], function (result) {
        let annotationInstances = result.annotationInstances;

        if (annotationInstances !== undefined) {
            //Filter all instances stored in the browser and check if the current page already has an instance
            filteredInstances = annotationInstances.filter(instance => (instance.url === currentOriginAndPath));
            if (filteredInstances.length == 1) { // TODO: handle multiple instances of the same page, 
                currentAnnotationInstance = filteredInstances[0];

                // for all annotations, load
                currentAnnotationInstance.annotations.forEach(annotation => {
                    displayAnnotation(annotation);
                });

                // if annotations have been loaded, update the next id
                getNextAnnotationID();
            }
        }
    });
}

// Get the next annotation ID if annotations are loaded from Cache (function will be removed when DB is implemented)
function getNextAnnotationID() {
    largestId = nextAnnotationId;

    // get the highest id from cached annotations
    currentAnnotationInstance.annotations.forEach(annotation => {
        if (annotation.ID > largestId) {
            largestId = annotation.ID;
        }
    });

    nextAnnotationId = ++largestId;
}

function SaveAnnotation(button) {
    let annotationBox = button.srcElement.parentNode.parentNode;
    let annotationId = parseInt(annotationBox.getAttribute('annotationId'));

    // find the annotation
    filteredAnnotations = draftAnnotations.filter(annotation => annotation.ID === annotationId);

    if (filteredAnnotations.length != 1) {
        console.log('Either too many annotations found or not any with the Id: ' + annotationId);
    } else {
        cacheAnnotation(filteredAnnotations[0]);
        //Then upload to db
        //Change annotation controls

        // remove from drafts
        draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);
    }
}

// show annotation 
function displayAnnotation(annotation) {
    let commentsDiv = document.querySelector('div#comments');
    let commentBoxTemplate = document.querySelector('template');


    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);

    // Allows the extension to work out what annotation button was pressed
    let annotationButton = clone.querySelector('.controls button');
    annotationButton.addEventListener('click', function (annotation) {
        SaveAnnotation(annotation);
    });

    let annotationBox = clone.querySelector('.commentBox');
    annotationBox.classList.add(randomColour());
    annotationBox.setAttribute('annotationId', annotation.ID);

    // For demo populate annotation with selected text
    let annotationTextBox = clone.querySelector('textarea');

    if (annotation !== undefined) {
        annotationText = 'Text selected "' + annotation.selectedText + '"' +
            '\n and the annotation id is: ' + annotation.ID +
            '\n and the element type is: ' + annotation.elementType +
            '\n and the element id is: ' + annotation.elementAuditID +
            '\n and the element was created at: ' + annotation.created.toLocaleString();
    } else {
        annotationText = 'No data, error?';
    }

    annotationTextBox.innerHTML = annotationText;

    // apply theme styles if needed
    let isInDarkMode = checkTheme();

    if (isInDarkMode) {
        annotationTextBox.classList.add('dark');
    }

    commentsDiv.appendChild(clone);
}

function randomColour() {
    let colors = ['pink', 'yellow', 'cyan', 'green'];
    min = 0;
    max = colors.length;
    let randomIndex = Math.floor(Math.random() * (max - min)) + min;

    return colors[randomIndex];
}

function checkTheme() {
    let commentsContainer = document.querySelector('commentscontainer');
    return commentsContainer.classList.contains('dark');
}

function changeTheme() {
    let commentsContainer = document.querySelector('commentscontainer');
    let containerHeader = document.querySelector('#containerHeader');
    let commentTextAreas = [...document.getElementsByClassName('commentTextArea')];

    let isInDarkMode = checkTheme();

    if (isInDarkMode) {
        // remove dark mode classes
        commentsContainer.classList.remove('dark');
        containerHeader.classList.remove('dark');
        commentTextAreas.forEach(cta => {
            cta.classList.remove('dark');
        });

    } else {
        // add dark mode classes
        commentsContainer.classList.add('dark');
        containerHeader.classList.add('dark');
        commentTextAreas.forEach(cta => cta.classList.add('dark'));
    }
}
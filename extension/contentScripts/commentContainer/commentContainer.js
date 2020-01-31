// Manage comments

// For now default to 1, but in theory this would be read from a DB
let nextAnnotationId = 1;

const currentOriginAndPath = window.location.origin + window.location.pathname;

let annotationInstances = [];

let currentAnnotationInstance = {
    url: currentOriginAndPath,
    annotations: []
};

// Annotations that have not been saved
// TODO if the user leaves the page when this array is populated, alert are they sure they want to leave-
let draftAnnotations = [];

let annotationSort = 'Element';

function changeSort() {
    const sortOrder = document.querySelector('select#annotationSort').value;

    if (draftAnnotations.length > 0) {
        alert('Please delete or save current draft');
        document.querySelector('select#annotationSort').value = annotationSort;
    } else if (currentAnnotationInstance.annotations.length < 1) {
        alert('Nothing to sort... Annotate some things first!');
        document.querySelector('select#annotationSort').value = annotationSort;
    } else {
        annotationSort = sortOrder;
        sortAnnotations();
    }
}

function sortAnnotations(redrawAnnotations = true) {
    if (annotationSort === 'Element') {
        currentAnnotationInstance.annotations.sort((annotation1, annotation2) => {
            if (annotation1.elementAuditID > annotation2.elementAuditID) {
                return 1;
            }
            if (annotation1.elementAuditID < annotation2.elementAuditID) {
                return -1;
            }
            if (annotation1.elementAuditID === annotation2.elementAuditID) {
                return annotation1.created - annotation2.created;
            }
        });
    } else if (annotationSort === 'Created') {
        currentAnnotationInstance.annotations.sort((annotation1, annotation2) => {
            return annotation1.created - annotation2.created;
        });
    }

    if (redrawAnnotations) {
        // Remove all annotation template elements
        const commentsElem = document.querySelector('commentscontainer');
        while (commentsElem.firstChild) {
            commentsElem.removeChild(commentsElem.firstChild);
        }

        // Redraw annotations
        // For all annotations, load
        currentAnnotationInstance.annotations.forEach(annotation => {
            displayAnnotation(annotation);
            setEditMode(annotation.ID, false);
        });
    }
}

// Create annotation object
function createDraftAnnotation(annotationData) {
    if (draftAnnotations.length > 0) {
        alert('Please delete or save current draft');
    } else {
        const newAnnotation = {
            ID: nextAnnotationId++,
            elementAuditID: annotationData.elementAuditID,
            elementType: annotationData.elementType,
            selectedText: annotationData.selectionText,
            created: Date.now()
        };

        if (annotationData.comment === undefined) {
            // Debug default, newAnnotation needs to be got when the user saves a draft
            // Then this can be set to "enter a comment here!" for instance
            newAnnotation.comment = 'Text selected "' + newAnnotation.selectedText + '"' +
            '\n and the annotation id is: ' + newAnnotation.ID +
            '\n and the element type is: ' + newAnnotation.elementType +
            '\n and the element id is: ' + newAnnotation.elementAuditID +
            '\n and the element was created at: ' + newAnnotation.created.toLocaleString();
        } else {
            newAnnotation.comment = annotationData.comment;
        }

        draftAnnotations.push(newAnnotation);

        displayAnnotation(newAnnotation);
    }
}

function cacheInstance() {
    const message = {
        type: 'cacheInstance',
        instance: currentAnnotationInstance
    };

    chrome.runtime.sendMessage(message);
}

// When the extension is loaded on a page, load all the annotations from the cache
function loadAnnotationsFromCache() {
    // Set variable instance to cache instance
    chrome.storage.sync.get(['annotationInstances'], (result) => {
        annotationInstances = result.annotationInstances;

        if (annotationInstances !== undefined) {
            // Filter all instances stored in the browser and check if the current page already has an instance
            const filteredInstances = annotationInstances.filter(instance => (instance.url === currentOriginAndPath));
            if (filteredInstances.length === 1) {
                currentAnnotationInstance = filteredInstances[0];

                // For all annotations, load
                currentAnnotationInstance.annotations.forEach(annotation => {
                    displayAnnotation(annotation);
                    setEditMode(annotation.ID, false);
                });

                // If annotations have been loaded, update the next id
                getNextAnnotationID();
            }
        }
    });
}

// Get the next annotation ID if annotations are loaded from Cache (function will be removed when DB is implemented)
function getNextAnnotationID() {
    let largestId = nextAnnotationId;

    // Get the highest id from cached annotations
    currentAnnotationInstance.annotations.forEach(annotation => {
        if (annotation.ID > largestId) {
            largestId = annotation.ID;
        }
    });

    nextAnnotationId = ++largestId;
}

function getIDFromButtonClick(clickEvent) {
    const annotationBox = clickEvent.srcElement.parentNode.parentNode;
    return parseInt(annotationBox.getAttribute('annotationId'));
}

function setEditMode(annotationId, editMode = true) {
    // Update Controls for that annotation
    const annotateButton = document.querySelector('[annotationId="' + annotationId + '"] #annotate');
    const updateButton = document.querySelector('[annotationId="' + annotationId + '"] #update');
    const deleteButton = document.querySelector('[annotationId="' + annotationId + '"] #delete');
    const editButton = document.querySelector('[annotationId="' + annotationId + '"] #edit');
    const threadButton = document.querySelector('[annotationId="' + annotationId + '"] #thread');
    const cancelButton = document.querySelector('[annotationId="' + annotationId + '"] #cancel');
    const commentBox = document.querySelector('[annotationId="' + annotationId + '"] textarea');

    // Only visible in draft state
    annotateButton.classList.add('hidden');
    updateButton.classList.remove('hidden');
    deleteButton.classList.remove('hidden');
    editButton.classList.remove('hidden');
    threadButton.classList.remove('hidden');
    cancelButton.classList.remove('hidden');
    commentBox.disabled = true;

    if (editMode) {
        // Entering edit mode
        deleteButton.classList.add('hidden');
        editButton.classList.add('hidden');
        threadButton.classList.add('hidden');
        commentBox.disabled = false;
    } else {
        // Leaving edit mode
        updateButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
    }
}

function saveAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);

    // Find the draft annotation
    const filteredAnnotations = draftAnnotations.filter(annotation => annotation.ID === annotationId);

    if (filteredAnnotations.length !== 1) {
        console.log('Either too many annotations found or not any with the Id: ' + annotationId);
    } else {
        // The annotation currently in drafts that will be moved to the instance array
        const annotationToSave = filteredAnnotations[0];
        annotationToSave.comment = document.querySelector('[annotationId="' + annotationId + '"] textarea').value;
        currentAnnotationInstance.annotations.push(annotationToSave);
        cacheInstance();
        // Then upload to db

        // Remove from drafts
        draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);

        setEditMode(annotationId, false);

        // Add hover event trigger to annotated elem
        // attachAnnotatedElementTrigger(annotationId, annotationToSave.elementAuditID, annotationToSave.selectionText);

        sortAnnotations();
    }
}

// // SelectionText is unused for now
// // Style and attach a hover event
// function attachAnnotatedElementTrigger(annotationId, elementAuditID, selectionText) {
//     const annotatedElem = document.querySelector('[element_audit_id="' + annotationId + '"]');
//     const annotationBox = document.querySelector('[annotationid="' + annotationId + '"]');

//     // Style

//     // Attach trigger

// }

function deleteAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);

    // Find the annotation
    const filteredAnnotations = currentAnnotationInstance.annotations.filter(annotation => annotation.ID === annotationId);

    if (filteredAnnotations.length !== 1) {
        console.log('Either too many annotations found or not any with the Id: ' + annotationId);
    } else {
        // Remove from cache
        currentAnnotationInstance.annotations = currentAnnotationInstance.annotations.filter(annotation => annotation.ID !== annotationId);
        cacheInstance();

        // Then remove from DB
    }

    // Remove html element
    const annotationElement = document.querySelector('[annotationId="' + annotationId + '"]');
    annotationElement.parentNode.removeChild(annotationElement);
}

function editAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);
    setEditMode(annotationId);
}

function updateAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);
    // Find the annotation in the cache and update it's attributes
    const annotationIndex = currentAnnotationInstance.annotations.findIndex(annotation => annotation.ID === annotationId);

    if (annotationIndex >= 0) {
        const annotationToUpdate = currentAnnotationInstance.annotations[annotationIndex];
        // Right now editing just the annotation comment
        const annotationText = document.querySelector('[annotationId="' + annotationId + '"] textarea').value;
        annotationToUpdate.comment = annotationText;
        annotationToUpdate.lastUpdated = Date.now();

        currentAnnotationInstance.annotations[annotationIndex] = annotationToUpdate;
        cacheInstance();

        setEditMode(annotationId, false);
    }
}

function toggleThread(buttonClick) {
    alert('Functionality Coming Soon! Pester me at: https://github.com/SamReeve96/Acetate/ To get me to implement it sooner!');
}

function cancelAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);

    const annotationIsADraft = draftAnnotations.filter(annotation => annotation.ID === annotationId).length === 1;

    // Determine if an edit cancellation or draft cancellation
    if (annotationIsADraft) {
        // Remove from drafts
        draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);
        // Remove draft element
        const annotationElement = document.querySelector('[annotationId="' + annotationId + '"]');
        annotationElement.parentNode.removeChild(annotationElement);
    } else {
        // Reset commentBox value
        const annotationIndex = currentAnnotationInstance.annotations.findIndex(annotation => annotation.ID === annotationId);
        document.querySelector('[annotationId="' + annotationId + '"] textarea').value = currentAnnotationInstance.annotations[annotationIndex].comment;
        setEditMode(annotationId, false);
    }
}

// Show annotation
function displayAnnotation(annotation) {
    const commentsDiv = document.querySelector('commentscontainer');
    const commentBoxTemplate = document.querySelector('template');

    // Create new comment instance
    const clone = document.importNode(commentBoxTemplate.content, true);

    // Allows the extension to work out what annotation button was pressed
    const saveButton = clone.querySelector('button#annotate');
    saveButton.addEventListener('click', (annotation) => {
        saveAnnotation(annotation);
    });

    const editButton = clone.querySelector('button#edit');
    editButton.addEventListener('click', (annotation) => {
        editAnnotation(annotation);
    });

    const deleteButton = clone.querySelector('button#delete');
    deleteButton.addEventListener('click', (annotation) => {
        deleteAnnotation(annotation);
    });

    const threadButton = clone.querySelector('button#thread');
    threadButton.addEventListener('click', (annotation) => {
        toggleThread(annotation);
    });

    const cancelButton = clone.querySelector('button#cancel');
    cancelButton.addEventListener('click', (annotation) => {
        cancelAnnotation(annotation);
    });

    const updateButton = clone.querySelector('button#update');
    updateButton.addEventListener('click', (annotation) => {
        updateAnnotation(annotation);
    });

    const annotationBox = clone.querySelector('.commentBox');
    annotationBox.classList.add('default');
    annotationBox.setAttribute('annotationId', annotation.ID);

    // For demo populate annotation with selected text
    const annotationTextBox = clone.querySelector('textarea');

    annotationTextBox.value = annotation.comment;

    // Apply theme styles if needed
    const isInDarkMode = checkTheme();

    if (isInDarkMode) {
        annotationTextBox.classList.add('dark');
    }

    commentsDiv.appendChild(clone);
}

function checkTheme() {
    const commentsContainer = document.querySelector('commentscontainer');
    return commentsContainer.classList.contains('dark');
}

function changeTheme() {
    const commentsContainer = document.querySelector('commentscontainer');
    const commentTextAreas = [...document.getElementsByClassName('commentTextArea')];

    const isInDarkMode = checkTheme();

    if (isInDarkMode) {
        // Remove dark mode classes
        commentsContainer.classList.remove('dark');
        commentTextAreas.forEach(cta => {
            cta.classList.remove('dark');
        });
    } else {
        // Add dark mode classes
        commentsContainer.classList.add('dark');
        commentTextAreas.forEach(cta => cta.classList.add('dark'));
    }
}

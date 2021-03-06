// Manage comments

// For now default to 0, but in theory this would be read from a DB
let nextAnnotationId = 0;

// Annotations that have not been saved
// TODO if the user leaves the page when this array is populated, alert are they sure they want to leave-
let draftAnnotations = [];

// Ways the annotation cards can be ordered
const annotationSortMode = {
    ELEMENT: 'Element',
    CREATED: 'Created'
};

let cachedSortOrder;

function getCachedSortOrder() {
    // Send message to backend to change active state
    const message = {
        type: 'getCachedSortOrder_Content'
    };

    chrome.runtime.sendMessage(message);
}

function sortAnnotations(newSortOrder, redrawAnnotations = true) {
    if (newSortOrder === annotationSortMode.ELEMENT) {
        currentSheet.sheetData.annotations.sort((annotation1, annotation2) => {
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
    } else if (newSortOrder === annotationSortMode.CREATED) {
        currentSheet.sheetData.annotations.sort((annotation1, annotation2) => {
            return annotation1.created - annotation2.created;
        });
    }

    if (redrawAnnotations) {
        // Clear Element Annotation event map
        clearElementAnnotationEventMap();

        // Remove all annotation template elements
        const shadow = document.querySelector('div#shadowContainer').shadowRoot;
        const cardsContainer = shadow.querySelector('cardsContainer');
        const numberOfCards = cardsContainer.children.length;
        for (let i = 0; i < numberOfCards; i++) {
            cardsContainer.firstChild.remove();
        }

        // Redraw annotations
        // For all annotations, load
        currentSheet.sheetData.annotations.forEach(annotation => {
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
            elementAuditID: parseInt(annotationData.elementAuditID),
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

function cacheSheet(modification = false) {
    const message = {
        type: 'cacheSheet',
        modification: modification,
        Sheet: currentSheet
    };

    chrome.runtime.sendMessage(message);
}

// When the extension is loaded on a page, load all the annotations from the cache
function loadAnnotationsFromSheet() {
    // Only display annotations if on the page
    if (currentSheet.sheetData.URL === currentOriginAndPath) {
        // Sort Annotations before displaying them
        sortAnnotations(annotationSortMode.ELEMENT, false);

        // For all annotations, load
        currentSheet.sheetData.annotations.forEach(annotation => {
            displayAnnotation(annotation);
            setEditMode(annotation.ID, false);
        });

        // If annotations have been loaded, update the next id
        getNextAnnotationID();
    } else {
        // This message shouldn't really happen
        console.error('current page does not match current sheet url');
    }
}

// Get the next annotation ID if annotations are loaded from Cache (function will be removed when DB is implemented)
function getNextAnnotationID() {
    let largestId = nextAnnotationId;

    // Get the highest id from cached annotations
    currentSheet.sheetData.annotations.forEach(annotation => {
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
    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    const selectorPrefix = '[annotationId="' + annotationId + '"]';
    const annotationCard = shadow.querySelector(selectorPrefix);
    const annotateButton = shadow.querySelector(selectorPrefix + ' #annotate');
    const updateButton = shadow.querySelector(selectorPrefix + ' #update');
    const deleteButton = shadow.querySelector(selectorPrefix + ' #delete');
    const editButton = shadow.querySelector(selectorPrefix + ' #edit');
    const threadButton = shadow.querySelector(selectorPrefix + ' #thread');
    const cancelButton = shadow.querySelector(selectorPrefix + ' #cancel');
    const textArea = shadow.querySelector(selectorPrefix + ' textarea');

    // Only visible in draft state
    annotationCard.classList.remove('edit');
    annotateButton.classList.add('hidden');
    updateButton.classList.remove('hidden');
    deleteButton.classList.remove('hidden');
    editButton.classList.remove('hidden');
    threadButton.classList.remove('hidden');
    cancelButton.classList.remove('hidden');
    textArea.disabled = true;

    if (editMode) {
        // Entering edit mode
        deleteButton.classList.add('hidden');
        editButton.classList.add('hidden');
        threadButton.classList.add('hidden');
        textArea.disabled = false;
        annotationCard.classList.add('edit');
    } else {
        // Leaving edit mode
        updateButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
    }
}

function sendUpdateFirestoreSheet(sheet) {
    const message = {
        type: 'updateFirestoreSheet',
        sheet: sheet
    };

    chrome.runtime.sendMessage(message);
}

function saveAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);

    // Find the draft annotation
    const draftAnnotation = draftAnnotations.find(annotation => annotation.ID === annotationId);

    if (draftAnnotation === undefined) {
        console.log('Failed to find draft annotation with the Id: ' + annotationId);
        return;
    }

    // The annotation currently in drafts that will be moved to the Sheet array
    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    draftAnnotation.comment = shadow.querySelector('[annotationId="' + annotationId + '"] textarea').value;
    currentSheet.sheetData.annotations.push(draftAnnotation);
    cacheSheet(true);
    // Then upload to db
    sendUpdateFirestoreSheet(currentSheet);

    // Remove from drafts
    draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);

    // Resort annotations to move ex-draft to correct position
    sortAnnotations(cachedSortOrder);
}

function deleteAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);

    // Find the annotation
    const annotationToDelete = currentSheet.sheetData.annotations.find(annotation => annotation.ID === annotationId);

    if (annotationToDelete === undefined) {
        console.log('Failed to find annotation with the Id: ' + annotationId);
        return;
    }

    // Remove from cache
    currentSheet.sheetData.annotations = currentSheet.sheetData.annotations.filter(annotation => annotation.ID !== annotationId);
    cacheSheet(true);

    // Then remove from DB
    sendUpdateFirestoreSheet(currentSheet);

    // Remove html element0
    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    const annotationElement = shadow.querySelector('[annotationId="' + annotationId + '"]');
    annotationElement.parentNode.removeChild(annotationElement);

    // Remove content modifications eventlistener
    const elemAnnotationIdPos = elementAnnotationsMap[annotationToDelete.elementAuditID].indexOf(annotationId);
    elementAnnotationsMap[annotationToDelete.elementAuditID].splice(elemAnnotationIdPos, 1);

    // And, if the last annotation for that element is deleted, remove the highlight
    if (elementAnnotationsMap[annotationToDelete.elementAuditID].length === 0) {
        const annotatedElem = document.querySelector('[element_audit_id="' + annotationToDelete.elementAuditID + '"]');
        annotatedElem.classList.remove('annotated');
    }
}

function editAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);
    setEditMode(annotationId);
}

function updateAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);
    // Find the annotation in the cache and update it's attributes
    const annotationIndex = currentSheet.sheetData.annotations.findIndex(annotation => annotation.ID === annotationId);

    if (annotationIndex >= 0) {
        const annotationToUpdate = currentSheet.sheetData.annotations[annotationIndex];
        // Right now editing just the annotation comment
        const shadow = document.querySelector('div#shadowContainer').shadowRoot;
        const annotationText = shadow.querySelector('[annotationId="' + annotationId + '"] textarea').value;
        annotationToUpdate.comment = annotationText;
        annotationToUpdate.lastUpdated = Date.now();

        currentSheet.sheetData.annotations[annotationIndex] = annotationToUpdate;
        cacheSheet(true);

        sendUpdateFirestoreSheet(currentSheet);

        setEditMode(annotationId, false);
    }
}

function toggleThread(buttonClick) {
    alert('Functionality Coming Soon! Pester me at: https://github.com/SamReeve96/Acetate/ To get me to implement it sooner!');
}

function cancelAnnotation(buttonClick) {
    const annotationId = getIDFromButtonClick(buttonClick);

    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    const annotationIsADraft = draftAnnotations.find(annotation => annotation.ID === annotationId) !== undefined;

    // Determine if an edit cancellation or draft cancellation
    if (annotationIsADraft) {
        // Get the draft element ID
        const draftAnnotationElemId = draftAnnotations.find(annotation => annotation.ID === annotationId).elementAuditID;

        // Remove from drafts
        draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);
        // Remove draft element
        const annotationElement = shadow.querySelector('[annotationId="' + annotationId + '"]');

        annotationElement.parentNode.removeChild(annotationElement);

        // Remove element id from slide event map object
        const elemAnnotationIdPos = elementAnnotationsMap[draftAnnotationElemId].indexOf(annotationId);
        elementAnnotationsMap[draftAnnotationElemId].splice(elemAnnotationIdPos, 1);

        // And, if the last annotation for that element is deleted, remove the highlight
        if (elementAnnotationsMap[draftAnnotationElemId].length === 0) {
            const annotatedElem = document.querySelector('[element_audit_id="' + draftAnnotationElemId + '"]');
            annotatedElem.classList.remove('annotated');
        }
    } else {
        // Reset commentBox value
        const annotationIndex = currentSheet.sheetData.annotations.findIndex(annotation => annotation.ID === annotationId);
        shadow.querySelector('[annotationId="' + annotationId + '"] textarea').value = currentSheet.sheetData.annotations[annotationIndex].comment;
        setEditMode(annotationId, false);
    }
}

// Show annotation
function displayAnnotation(annotation) {
    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    const commentBoxTemplate = shadow.querySelector('template');

    // Create new comment Sheet
    const cloneCommentBox = document.importNode(commentBoxTemplate.content, true);

    // Allows the extension to work out what annotation button was pressed
    const saveButton = cloneCommentBox.querySelector('button#annotate');
    saveButton.addEventListener('click', annotation => {
        saveAnnotation(annotation);
    });

    const editButton = cloneCommentBox.querySelector('button#edit');
    editButton.addEventListener('click', annotation => {
        editAnnotation(annotation);
    });

    const deleteButton = cloneCommentBox.querySelector('button#delete');
    deleteButton.addEventListener('click', annotation => {
        deleteAnnotation(annotation);
    });

    const threadButton = cloneCommentBox.querySelector('button#thread');
    threadButton.addEventListener('click', annotation => {
        toggleThread(annotation);
    });

    const cancelButton = cloneCommentBox.querySelector('button#cancel');
    cancelButton.addEventListener('click', annotation => {
        cancelAnnotation(annotation);
    });

    const updateButton = cloneCommentBox.querySelector('button#update');
    updateButton.addEventListener('click', annotation => {
        updateAnnotation(annotation);
    });

    const annotationBox = cloneCommentBox.querySelector('.commentBox');
    annotationBox.classList.add('default');
    annotationBox.setAttribute('annotationId', annotation.ID);

    // For demo populate annotation with selected text
    const annotationTextBox = cloneCommentBox.querySelector('textarea');

    annotationTextBox.innerHTML = annotation.comment;

    const cardsContainer = shadow.querySelector('cardsContainer');
    cardsContainer.appendChild(cloneCommentBox);

    // Add hover event trigger to annotated elem in content.js
    attachAnnotatedElementTrigger(annotation.ID, annotation.elementAuditID, annotation.selectionText);
}

function removeAnnotatedElemStyling() {
    // Iterate over the styled elements
    const annotatedElems = document.getElementsByClassName('annotated');
    const annotatedElemsCount = annotatedElems.length;

    for (let i = 0; i < annotatedElemsCount; i++) {
        annotatedElems[0].classList.remove('annotated');
    }
}

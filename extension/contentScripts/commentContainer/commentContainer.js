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
            ID: nextAnnotationId++,
            elementAuditID: annotationData.elementAuditID,
            elementType: annotationData.elementType,
            selectedText: annotationData.selectionText,
            created: Date.now()
        };
        
        if (annotationData.comment === undefined)
        {
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
    
        //needs to be cached, can be done by pressing the save button
    }
}

function cacheInstance() {
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
                    setEditMode(annotation.ID, false);
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

function getIDFromButtonClick(clickEvent) {
    let annotationBox = clickEvent.srcElement.parentNode.parentNode;
    return parseInt(annotationBox.getAttribute('annotationId'));
}

function setEditMode(annotationId, editMode = true) {
    //Update Controls for that annotation
    let annotateButton = document.querySelector('[annotationId="' + annotationId + '"] #annotate');
    let updateButton = document.querySelector('[annotationId="' + annotationId + '"] #update');
    let deleteButton = document.querySelector('[annotationId="' + annotationId + '"] #delete');
    let editButton = document.querySelector('[annotationId="' + annotationId + '"] #edit');
    let threadButton = document.querySelector('[annotationId="' + annotationId + '"] #thread');
    let cancelButton = document.querySelector('[annotationId="' + annotationId + '"] #cancel');
    let commentBox = document.querySelector('[annotationId="' + annotationId + '"] textarea');

    //Only visible in draft state
    annotateButton.classList.add('hidden');
    updateButton.classList.remove('hidden');
    deleteButton.classList.remove('hidden');
    editButton.classList.remove('hidden');
    threadButton.classList.remove('hidden');
    cancelButton.classList.remove('hidden');
    commentBox.disabled = true;

    //Entering edit mode
    if (editMode) {
        deleteButton.classList.add('hidden');
        editButton.classList.add('hidden');
        threadButton.classList.add('hidden');
        commentBox.disabled = false;
    } else { // leaving edit mode
        updateButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
    }

}

function SaveAnnotation(buttonClick) {
    let annotationId =  getIDFromButtonClick(buttonClick);

    // find the draft annotation
    filteredAnnotations = draftAnnotations.filter(annotation => annotation.ID === annotationId);

    if (filteredAnnotations.length != 1) {
        console.log('Either too many annotations found or not any with the Id: ' + annotationId);
    } else {
        //The annotation currently in drafts that will be moved to the instance array
        let annotationToSave = filteredAnnotations[0];
        annotationToSave.comment = document.querySelector('[annotationId="' + annotationId + '"] textarea').value;
        currentAnnotationInstance.annotations.push(annotationToSave);
        cacheInstance();
        //Then upload to db

        // remove from drafts
        draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);

    setEditMode(annotationId, false);

    }
}

function DeleteAnnotation(buttonClick) {
    let annotationId =  getIDFromButtonClick(buttonClick);

    // find the annotation
    filteredAnnotations = currentAnnotationInstance.annotations.filter(annotation => annotation.ID === annotationId);

    if (filteredAnnotations.length != 1) {
        console.log('Either too many annotations found or not any with the Id: ' + annotationId);
    } else {
        // remove from cache
        currentAnnotationInstance.annotations = currentAnnotationInstance.annotations.filter(annotation => annotation.ID !== annotationId);
        cacheInstance();

        //Then remove from DB
    }

    // Remove html element
    let annotationElement = document.querySelector('[annotationId="' + annotationId + '"]');
    annotationElement.parentNode.removeChild(annotationElement);
}

function EditAnnotation(buttonClick) {
    let annotationId =  getIDFromButtonClick(buttonClick);
    setEditMode(annotationId);
}

function UpdateAnnotation(buttonClick) {
    let annotationId =  getIDFromButtonClick(buttonClick);
    //find the annotation in the cache and update it's attributes
    annotationIndex = currentAnnotationInstance.annotations.findIndex(annotation => annotation.ID === annotationId);

    if (annotationIndex >= 0) {
        annotationToUpdate = currentAnnotationInstance.annotations[annotationIndex];
        //right now editing just the annotation comment
        let annotationText = document.querySelector('[annotationId="' + annotationId + '"] textarea').value;
        annotationToUpdate.comment = annotationText;
        annotationToUpdate.lastUpdated = Date.now();

        currentAnnotationInstance.annotations[annotationIndex] = annotationToUpdate;
        cacheInstance();

        setEditMode(annotationId, false);
    }
}

function ToggleThread(buttonClick) {
    alert('Functionality Coming Soon! Pester me at: https://github.com/SamReeve96/Acetate/ To get me to implement it sooner!');
}

function CancelAnnotation(buttonClick) {
    let annotationId =  getIDFromButtonClick(buttonClick);

    annotationIsADraft = draftAnnotations.filter(annotation => annotation.ID === annotationId).length === 1;

    //Determine if an edit cancellation or draft cancellation
    if (annotationIsADraft) {
        // remove from drafts
        draftAnnotations = draftAnnotations.filter(annotation => annotation.ID !== annotationId);
        //remove draft element
        let annotationElement = document.querySelector('[annotationId="' + annotationId + '"]');
        annotationElement.parentNode.removeChild(annotationElement);
    } else {
        //Reset commentBox value
        annotationIndex = currentAnnotationInstance.annotations.findIndex(annotation => annotation.ID === annotationId);
        document.querySelector('[annotationId="' + annotationId + '"] textarea').value = currentAnnotationInstance.annotations[annotationIndex].comment;
        setEditMode(annotationId, false);
    }
}

// show annotation 
function displayAnnotation(annotation) {
    let commentsDiv = document.querySelector('div#comments');
    let commentBoxTemplate = document.querySelector('template');

    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);

    // Allows the extension to work out what annotation button was pressed
    let saveButton = clone.querySelector('button#annotate');
    saveButton.addEventListener('click', function (annotation) {
        SaveAnnotation(annotation);
    });

    let editButton = clone.querySelector('button#edit');
    editButton.addEventListener('click', function (annotation) {
        EditAnnotation(annotation);
    });

    let deleteButton = clone.querySelector('button#delete');
    deleteButton.addEventListener('click', function (annotation) {
        DeleteAnnotation(annotation);
    });

    let threadButton = clone.querySelector('button#thread');
    threadButton.addEventListener('click', function (annotation) {
        ToggleThread(annotation);
    });

    let cancelButton = clone.querySelector('button#cancel');
    cancelButton.addEventListener('click', function (annotation) {
        CancelAnnotation(annotation);
    });

    
    let updateButton = clone.querySelector('button#update');
    updateButton.addEventListener('click', function (annotation) {
        UpdateAnnotation(annotation);
    });

    let annotationBox = clone.querySelector('.commentBox');
    annotationBox.classList.add(randomColour());
    annotationBox.setAttribute('annotationId', annotation.ID);

    // For demo populate annotation with selected text
    let annotationTextBox = clone.querySelector('textarea');

    annotationTextBox.value = annotation.comment;

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
    let commentsContainer = document.querySelector('commentsContainer');
    return commentsContainer.classList.contains('dark');
}

function changeTheme() {
    let commentsContainer = document.querySelector('commentsContainer');
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
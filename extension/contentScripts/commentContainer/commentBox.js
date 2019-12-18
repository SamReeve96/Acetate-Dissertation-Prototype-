//Manage comments

// for now default to 1, but in theory this would be read from a DB
// plus should be appended to the comment container not the button?
annotationId = 1;

// annotationInstance = {
//     instanceURL: '',
//     annotations: []
// };

// Create annotation object
function CreateAnnotation(annotationData) {
    let newAnnotation = {
        ID: 'No Id, this will be assigned by the database (also this string indicate the anno hasn\'nt been sent to the db yet and so should be cached if I do annotation caching)',
        elementAuditID: annotationData.elementAuditID,
        elementType: annotationData.elementType,
        selectedText: annotationData.selectionText,
        created: Date.now()
    };

    cacheAnnotation(newAnnotation);

    displayAnnotation(newAnnotation);
}

//Save annotation to cache (chrome sync storage) (TODO:before sending to remote storage)
function cacheAnnotation(newAnnotation) {
    // Check that there's an annotation
    if (!newAnnotation) {
        //message('Error: No annotation data');
        return;
    }

    annotationInstance.annotations.push(newAnnotation);

    let message = {
        type: 'cacheInstance',
        instance: annotationInstance
    };

    chrome.runtime.sendMessage(message);
}

// when the extension is loaded on a page, load all the annotations from the cache
function loadAnnotationsFromCache() {
    // set variable instance to cache instance
    chrome.storage.sync.get(['annotationInstance'], function (result) {
        console.log('Value currently is ' + result.annotationInstance);
        if (result.hasOwnProperty('annotationInstance')) {
            annotationInstance = result.annotationInstance;

            // for all annotations, load
            annotationInstance.annotations.forEach(annotation => {
                displayAnnotation(annotation);
            });

        } else {
            annotationInstance = {
                instanceURL: '',
                annotations: []
            };
        }
    });
}

// show annotation 
function displayAnnotation(annotation) {
    let commentsDiv = document.querySelector('div#comments');
    let commentBoxTemplate = document.querySelector('template');


    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);

    // Allows the extension to work out what annotation button was pressed
    let annotationButton = clone.querySelector('.controls button');
    annotationId++;
    annotationButton.addEventListener('click', function () {
        SaveAnnotation();
    });

    let annotationBox = clone.querySelector('.commentBox');
    annotationBox.classList.add(randomColour());

    // For demo populate annotation with selected text
    let annotationTextBox = clone.querySelector('textarea');

    if (annotation !== undefined) {
        annotationText = 'Text selected "' + annotation.selectedText + '"' +
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
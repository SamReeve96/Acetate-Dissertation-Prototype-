//Manage comments

// for now default to 1, but in theory this would be read from a DB
// plus should be appended to the comment container not the button?
annotationId = 1;

annotations = [];

function CreateAnnotation(annotationData) {
    let newAnnotation = {
        ID: 'No Id, this will be assigned by the database (also this string indicate the anno hasn\'nt been sent to the db yet and so should be cached if I do annotation caching)',
        elementAuditID: annotationData.elementAuditID,
        elementType: annotationData.elementType,
        selectedText: annotationData.selectionText,
        created: Date.now()
    };

    annotations.push(newAnnotation);

    displayAnnotation(newAnnotation);
}

function displayAnnotation(annotation) {
    let commentsDiv = document.querySelector('div#comments');
    let commentBoxTemplate =  document.querySelector('template');
    
    
    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);
    
    // Allows the extension to work out what annotation button was pressed
    let annotationButton = clone.querySelector('.controls button');
    annotationId++;
    annotationButton.addEventListener('click', function() {
        SaveAnnotation();
    });

    let annotationBox = clone.querySelector('.commentBox');
    annotationBox.classList.add(randomColour());

    // For demo populate annotation with selected text
    let annotationTextBox = clone.querySelector('textarea');

    if (annotation !== undefined) {
        annotationText = 'Text selected "' + annotation.selectedText + '"'
                      + '\n and the element type is: ' + annotation.elementType
                      + '\n and the element id is: ' + annotation.elementAuditID
                      + '\n and the element was created at: ' + annotation.created.toLocaleString();
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

    if (isInDarkMode)
    {
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

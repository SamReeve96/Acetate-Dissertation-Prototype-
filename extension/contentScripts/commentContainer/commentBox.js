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
    let commentsContainerElem = document.querySelector('div#comments');
    let commentBoxTemplate =  document.querySelector('template');
    
    
    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);
    
    // Allows the extension to work out what annotation button was pressed
    let annotationButton = clone.querySelector('button');
    annotationId++;
    annotationButton.addEventListener('click', function() {
        SaveAnnotation();
    });

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

    commentsContainerElem.appendChild(clone);
}


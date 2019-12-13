//Manage comments

// for now default to 1, but in theory this would be read from a DB
// plus should be appended to the comment container not the button?
annotationId = 1;

function AddAnnotation(annotationItem) {
    let commentsContainerElem = document.querySelector('commentsContainer');
    let commentBoxTemplate =  document.querySelector('template');
    
    
    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);
    
    // Allows the extension to work out what annotation button was pressed
    let annotationButton = clone.querySelector('button');
    annotationButton.id = annotationId;
    annotationId++;
    annotationButton.addEventListener('click', function() {
        AddAnnotation();
    });

    // For demo populate annotation with selected text //TODO selected element
    let annotationTextBox = clone.querySelector('textarea');

    if (annotationItem !== undefined) {
        annotationText = annotationItem.selectionText;
        annotationText += ' and the element was a ' + annotationItem.contextElement;
    } 
    else {
        annotationText = "No text or element selected";
    }

    annotationTextBox.innerHTML = annotationText;

    commentsContainerElem.appendChild(clone);
}



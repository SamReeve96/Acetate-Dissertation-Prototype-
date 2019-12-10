//Manage comments 

function AddAnnotation() {
    let commentsContainerElem = document.querySelector('commentsContainer');
    let commentBoxTemplate =  document.querySelector('template');

    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);
    commentsContainerElem.appendChild(clone);
}
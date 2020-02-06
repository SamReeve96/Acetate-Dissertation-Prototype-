let cachedSortOrder;
const sortDropdown = document.querySelector('#annotationCardSort');

function getCachedSortOrder() {
    // Send message to backend to change active state
    const message = {
        type: 'getCachedSortOrder_Popup'
    };

    chrome.runtime.sendMessage(message);
}

function handleMessage(message) {
    switch (message.type) {
    case 'returnCachedSortOrder':
        cachedSortOrder = message.sortOrder;
        sortDropdown.value = message.sortOrder;
        break;
    }
}

// Add listener for messaged
chrome.runtime.onMessage.addListener(message => {
    handleMessage(message);
});

getCachedSortOrder();

const activateButton = document.getElementById('Activate');
activateButton.onclick = function() {
    // Send message to backend to change active state
    const message = {
        type: 'changeActiveState'
    };

    chrome.runtime.sendMessage(message);
};

sortDropdown.addEventListener('change', () => {
    // Send a message to backend to change sort order
    const message = {
        type: 'changeAnnotationSort',
        newSortOrder: sortDropdown.value
    };

    chrome.runtime.sendMessage(message);
});

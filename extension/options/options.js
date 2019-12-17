//--- Active by default settings

let activeOnPageLoadCheckBox = document.getElementById('activeOnPageLoad');

chrome.storage.sync.get('activeOnPageLoad', function (data) {
    activeOnPageLoadCheckBox.checked = data.activeOnPageLoad;
});

activeOnPageLoadCheckBox.addEventListener( 'change', function() {
    chrome.storage.sync.set({ activeOnPageLoad: activeOnPageLoadCheckBox.checked }, function () {
        console.log('acetate is active on page load:' + activeOnPageLoadCheckBox.checked);
    });
});

//---Dark mode settings

let darkModeByDefaultCheckBox = document.getElementById('darkModeByDefault');

chrome.storage.sync.get('darkModeByDefault', function (data) {
    darkModeByDefaultCheckBox.checked = data.darkModeByDefault;
});

darkModeByDefaultCheckBox.addEventListener( 'change', function() {
    chrome.storage.sync.set({ darkModeByDefault: darkModeByDefaultCheckBox.checked }, function () {
        console.log('acetate is in dark mode by default:' + darkModeByDefaultCheckBox.checked);
    });
});
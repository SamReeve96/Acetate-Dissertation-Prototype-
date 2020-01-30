// --- Active by default settings

const activeOnPageLoadCheckBox = document.getElementById('activeOnPageLoad');

chrome.storage.sync.get('activeOnPageLoad', (data) => {
    activeOnPageLoadCheckBox.checked = data.activeOnPageLoad;
});

activeOnPageLoadCheckBox.addEventListener('change', () => {
    chrome.storage.sync.set({ activeOnPageLoad: activeOnPageLoadCheckBox.checked }, () => {
        console.log('acetate is active on page load:' + activeOnPageLoadCheckBox.checked);
    });
});

// ---Dark mode settings

const darkModeByDefaultCheckBox = document.getElementById('darkModeByDefault');

chrome.storage.sync.get('darkModeByDefault', (data) => {
    darkModeByDefaultCheckBox.checked = data.darkModeByDefault;
});

darkModeByDefaultCheckBox.addEventListener('change', () => {
    chrome.storage.sync.set({ darkModeByDefault: darkModeByDefaultCheckBox.checked }, () => {
        console.log('acetate is in dark mode by default:' + darkModeByDefaultCheckBox.checked);
    });
});

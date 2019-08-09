window.onload = async function () {
    await setDefaults();
}

async function setDefaults() {
    chrome.tabs.onActivated.addListener(async function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabsArray) {
            let tab = tabsArray[0];
            chrome.tabs.executeScript(tab.id, { file: './active.js' });
        });
    });

    chrome.runtime.onMessage.addListener(async function (request) {
        if (request.createMenus) {
            await updateAllMenus();
        }
    });
}

async function removeAllMenus() {
    await chrome.contextMenus.removeAll();
}

async function updateAllMenus() {
    await removeAllMenus();
    const currentText = await recieveData('currentText');

    const mainContext = {
        id: 'MAIN_ITEM',
        title: currentText || 'username@domain.ru',
        contexts: ['all']
    }
    chrome.contextMenus.create(mainContext);
    chrome.contextMenus.update('MAIN_ITEM', { onclick: callInsert });
    await createContextMenus();
}

function callInsert(info) {
    if (info.menuItemId === 'MAIN_ITEM') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabsArray) {
            let tab = tabsArray[0];
            chrome.tabs.executeScript(tab.id, { file: './insert_text.js' });
        });
    }
}

async function createContextMenus() {
    const settings = await recieveData('settings');
    if (settings === undefined || (!settings[0] && !settings[1])) {
        return
    }
    chrome.contextMenus.create({
        id: 'VARIANTS',
        title: 'Show variants',
        contexts: ['all']
    })
    const currentDomain = await recieveData('currentDomain');
    const urlVariants = await recieveData('urlVariants');
    const prefix = await recieveData('prefix');

    if (settings[0]) {
        urlVariants.forEach((url, index) => {
            let title = '';
            if (prefix !== undefined && prefix !== '') {
                title = `${prefix}+${url}${currentDomain}`;
            } else {
                title = url + currentDomain;
            }
            chrome.contextMenus.create({
                id: `url-${index}`,
                title: title,
                contexts: ['all'],
                parentId: 'VARIANTS'
            })
            chrome.contextMenus.update(`url-${index}`, { onclick: insertTitle(title) });
        });
    }
    const allEmailDomains = await recieveData('allEmailDomains');

    if (settings[1]) {
        //
    }

    // titles.forEach(title => {
    //     async function insertMenuTitle() {
    //         await storeData({ 'currentText': title });
    //         chrome.tabs.query({ active: true, currentWindow: true }, function (tabsArray) {
    //             let tab = tabsArray[0];
    //             chrome.tabs.executeScript(tab.id, { file: './insert_text.js' });
    //         });
    //     }

    //     chrome.contextMenus.onClicked.removeListener(insertMenuTitle);
    //     chrome.contextMenus.onClicked.addListener(insertMenuTitle);
    // });
    // chrome.contextMenus.onClicked.addListener(await insertSubtitle(titles));
}

function insertTitle(title) {
    return async function (info) {
        await storeData({ 'currentText': title });
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabsArray) {
            let tab = tabsArray[0];
            chrome.tabs.executeScript(tab.id, { file: './insert_text.js' });
        });
    }
}

// let currentText = await recieveData('currentText');
// const prefix = await recieveData('prefix');
// const currentDomain = await recieveData('currentDomain');
// const currentUrl = await recieveData('currentUrl');
// if (userPrefix !== undefined && prefix !== '') {
//     currentText = `${prefix}+${currentUrl}${currentDomain}`;
//     await storeData({ 'currentText': currentText });
// }









































function storeData(dataSet = {}, callback = () => { }) {
    return new Promise(resolve => {
        chrome.storage.sync.set(dataSet, function () {
            callback();
            resolve();
        });
    });
}

function recieveData(propName = '') {
    return new Promise(resolve => {
        chrome.storage.sync.get([propName], function (result) {
            resolve(result[propName]);
        });
    });
}
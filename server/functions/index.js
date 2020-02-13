const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// get sheet data to display annotations for current or shared page
exports.loadSheetById = functions.https.onRequest((req, res) => {
    const reqSheetID = req.query.sheetID;

    // find sheet - find fun will be replaced with a firestore query
    const loadSheet = db.collection('sheets').doc(reqSheetID).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                res.status(500).send('No such document!');
            } else {
                console.log('Document data:', doc.data());
                const sheetId = doc.id;
                const sheetData = doc.data();
                const sheetToReturn = {
                    sheetId: sheetId,
                    sheetData: sheetData
                };
                res.status(200).send(sheetToReturn);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.status(500).send();
        });
});

// get sheet data to display annotations for current or shared page
exports.loadSheetByURL = functions.https.onRequest((req, res) => {
    const reqSheetURL = req.query.sheetUrl;
    console.log('requestedURL', reqSheetURL);

    // find sheet - find fun will be replaced with a firestore query
    const loadSheet = db.collection('sheets').where('URL', '==', reqSheetURL).get()
        .then(snapshot => {
            console.log('SnapShot', snapshot);
            if (snapshot.empty) {
                console.log('No matching documents.');
                res.status(200).send({ msg: 'No matching documents.' });
            } else {
                // Not expecting any other result as there should only ever be 1 sheet for that url
                snapshot.forEach(doc => {
                    console.log('Document data:', doc.data());
                    const sheetId = doc.id;
                    const sheetData = doc.data();
                    const sheetToReturn = {
                        sheetId: sheetId,
                        sheetData: sheetData
                    };
                    res.status(200).send(sheetToReturn);
                });
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.status(500).send();
        });
});

// add new sheet to firestore
exports.addSheet = functions.https.onRequest((req, res) => {
    const JSONToJS = JSON.parse(JSON.stringify(req.body));
    console.log(JSONToJS);

    // add to firebase
    db.collection('sheets').add(JSONToJS)
        .then(
            docRef => {
                let newSheetId = docRef.id;
                console.log('newSheetId: ', newSheetId);

                if (newSheetId === undefined) {
                    newSheetId = 'new Sheet Id couldn\'t be returned';
                }

                // if it went okay inform sender, send back the id of the new sheet
                res.status(200).send({ newSheetId });
            })
        .catch(error => {
            // something went wrong
            res.status(500).send(error);
        }
        );
});

// update sheet in firestore
exports.updateSheet = functions.https.onRequest((req, res) => {
    const sheetId = req.query.sheetID;
    const JSONToJS = JSON.parse(JSON.stringify(req.body));
    console.log(JSONToJS);

    // Update in firebase
    db.collection('sheets').doc(sheetId).update(JSONToJS);

    // if it went okay inform sender
    res.status(200).send();
});

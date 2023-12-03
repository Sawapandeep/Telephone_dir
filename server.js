const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Initialize Firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://telephone-dir-14f0d-default-rtdb.firebaseio.com/'
});

// Define a reference to the Firebase database
const db = admin.database();
const phoneDirectoryRef = db.ref('PhoneDirectory');

// Express endpoint to add a new contact to the phone directory
app.post('/addContact', async (req, res) => {
  const { name, phoneNumber, address } = req.body;
  const timestamp = new Date().toISOString();

  try {
    // Check if the phone number already exists in the database
    const snapshot = await phoneDirectoryRef.orderByChild('phoneNumber').equalTo(phoneNumber).get();

    if (snapshot.exists()) {
      let duplicatePhoneNumber = false;
      snapshot.forEach((contact) => {
        if (contact.val().phoneNumber === phoneNumber) {
          duplicatePhoneNumber = true;
        }
      });

      if (duplicatePhoneNumber) {
        console.log(`Contact with phone number ${phoneNumber} already exists. Cannot add.`);
        res.status(400).json({ error: 'Contact with phone number already exists.' });
        return;
      }
    }

    const newContactRef = phoneDirectoryRef.push();
    newContactRef.set({
      name: name,
      phoneNumber: phoneNumber,
      address: address,
      timestamp: timestamp
    });
    console.log(`Contact ${name} added successfully.`);
    res.status(200).json({ message: 'Contact added successfully.' });
  } catch (error) {
    console.error('Error checking duplicate phone number:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Express endpoint to update an existing contact in the phone directory
app.put('/updateContact', (req, res) => {
  const { name, phoneNumber, address } = req.body;
  const timestamp = new Date().toISOString();

  // Find the contact by name
  phoneDirectoryRef.orderByChild('name').equalTo(name).once('value', (snapshot) => {
    if (snapshot.exists()) {
      const contactKey = Object.keys(snapshot.val())[0];

      // Check if the new phone number already exists in the database
      phoneDirectoryRef.orderByChild('phoneNumber').equalTo(phoneNumber).once('value', (snapshotPhoneNumber) => {
        if (!snapshotPhoneNumber.exists() || snapshotPhoneNumber.val()[contactKey]) {
          phoneDirectoryRef.child(contactKey).update({
            phoneNumber: phoneNumber,
            address: address,
            timestamp: timestamp
          });
          console.log(`Contact ${name} updated successfully.`);
          res.status(200).json({ message: 'Contact updated successfully.' });
        } else {
          console.log(`Contact with phone number ${phoneNumber} already exists. Cannot update.`);
          res.status(400).json({ error: 'Contact with phone number already exists.' });
        }
      });
    } else {
      console.log(`Contact ${name} not found.`);
      res.status(404).json({ error: 'Contact not found.' });
    }
  });
});

// Express endpoint to delete an existing contact from the phone directory
app.delete('/deleteContact', (req, res) => {
  const { name } = req.body;

  // Find the contact by name
  phoneDirectoryRef.orderByChild('name').equalTo(name).once('value', (snapshot) => {
    if (snapshot.exists()) {
      const contactKey = Object.keys(snapshot.val())[0];
      phoneDirectoryRef.child(contactKey).remove();
      console.log(`Contact ${name} deleted successfully.`);
      res.status(200).json({ message: 'Contact deleted successfully.' });
    } else {
      console.log(`Contact ${name} not found.`);
      res.status(404).json({ error: 'Contact not found.' });
    }
  });
});

// Express endpoint to get all contacts from the phone directory
app.get('/getContacts', (req, res) => {
  phoneDirectoryRef.once('value', (snapshot) => {
    const contacts = snapshot.val() || {};
    res.status(200).json(contacts);
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

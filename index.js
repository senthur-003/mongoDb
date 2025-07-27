const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const uri = "mongodb+srv://senthurgeneral:CWrJBLvnfOZ22ljs@appdb.ugxhq.mongodb.net?retryWrites=true&w=majority";
const corsOptions = {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// app.get('/users', async (req, res) => {
//     // const users = { name: 'siva', email: 'siva@gmail.com', password: '123456' }
//     // res.json(users);
//     async function getCollectionData(databaseName, collectionName) {
//         try {
//             await client.connect();
//             console.log("Connected to MongoDB");

//             const database = client.db(databaseName);
//             const collection = database.collection(collectionName);

//             // --- Methods to retrieve data ---

//             // 1. Find all documents in a collection
//             console.log(`\n--- All documents in "${collectionName}" ---`);
//             const allDocuments = await collection.find({}).toArray();
//             console.log(allDocuments);

//             // 2. Find documents matching a specific query
//             console.log(`\n--- Documents in "${collectionName}" matching a query (e.g., age > 30) ---`);
//             const query = { age: { $gt: 30 } }; // Example: find documents where 'age' is greater than 30
//             const matchingDocuments = await collection.find(query).toArray();
//             console.log(matchingDocuments);

//             // 3. Find a single document
//             console.log(`\n--- Find a single document in "${collectionName}" (e.g., name: "Alice") ---`);
//             const singleDocument = await collection.findOne({ name: "Alice" });
//             console.log(singleDocument);

//             // 4. Find with projection (select specific fields)
//             console.log(`\n--- Documents with projection (only name and email) ---`);
//             const projectionDocuments = await collection.find({}, { projection: { name: 1, email: 1, _id: 0 } }).toArray();
//             console.log(projectionDocuments);

//             // 5. Find with sorting
//             console.log(`\n--- Documents sorted by age (descending) ---`);
//             const sortedDocuments = await collection.find({}).sort({ age: -1 }).toArray(); // -1 for descending, 1 for ascending
//             console.log(sortedDocuments);

//             // 6. Find with limit and skip (pagination)
//             console.log(`\n--- Documents with limit and skip (e.g., skip 1, limit 2) ---`);
//             const paginatedDocuments = await collection.find({}).skip(1).limit(2).toArray();
//             console.log(paginatedDocuments);

//         } catch (error) {
//             console.error("Error connecting to or querying MongoDB:", error);
//         } finally {
//             // Close the client when you're done
//             await client.close();
//             console.log("Disconnected from MongoDB");
//         }
//     }
// });




async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        // Exit the process if we can't connect to the database
        process.exit(1);
    }
}

// Call the connection function
connectToMongo();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/api/customerlist', async (req, res) => {
    try {
        const database = client.db('customer');
        const collection = database.collection('customerDetails');

        let cursor = collection.find();

        const documents = await cursor.toArray();
        if (documents) {
            res.json(documents);
        } else {
            res.status(404).json({ message: "Document not found." });
        }

    } catch (error) {
        console.error("Error retrieving customer data:", error);
        res.status(500).json({ error: "Failed to retrieve customer data from MongoDB." });
    }finally {
        await client.close(); 
    }
});

app.post('/api/addcustomer', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        await client.connect(); 
        const database = client.db('customer');
        const collection = database.collection('customerDetails');

        const newCustomer = { name, email, password };
        const result = await collection.insertOne(newCustomer);

        if (result.insertedId) {
            res.status(201).json({ message: "Customer added successfully!", id: result.insertedId });
        } else {
            res.status(400).json({ message: "Failed to add customer." });
        }
    } catch (error) {
        console.error("Error adding customer:", error);
        res.status(500).json({ error: "Failed to add customer to MongoDB." });
    } finally {
        await client.close(); 
    }
});


app.put('/api/updatecustomer/:id', async (req, res) => {
  try {
    await client.connect(); // Ensure DB connection

    const database = client.db('customer');
    const collection = database.collection('customerDetails');

    const customerId = req.params.id;

    if (!ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID format.' });
    }

    const updatedData = req.body;

    if (!updatedData || Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: 'No data provided for update.' });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(customerId) },
      { $set: updatedData }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: 'Customer updated successfully!' });
    } else {
      res.status(404).json({ message: 'Customer not found or no changes made.' });
    }

  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer in MongoDB.' });
  } finally {
    await client.close(); 
  }
});


app.delete('/api/deletecustomer/:id', async (req, res) => {
  try {
    await client.connect(); // Ensure DB connection

    const database = client.db('customer');
    const collection = database.collection('customerDetails');

    const customerId = req.params.id;

    if (!ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID format.' });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(customerId) });

    if (result.deletedCount > 0) {
      res.json({ message: 'Customer deleted successfully!' });
    } else {
      res.status(404).json({ message: 'Customer not found.' });
    }

  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer from MongoDB.' });
  } finally {
    await client.close(); 
  }
});

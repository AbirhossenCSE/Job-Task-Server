const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wpavw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // jobTasks.tasks

        const database = client.db('jobTasks');
        const taskCollection = database.collection('tasks');
        const userCollection = database.collection('users');


        app.post('/users', async (req, res) => {
            const { uid, email, displayName } = req.body;

            if (!uid || !email) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            // Check if user already exists
            const existingUser = await userCollection.findOne({ uid });

            if (!existingUser) {
                const newUser = { uid, email, displayName };
                const result = await userCollection.insertOne(newUser);
                res.status(201).json(result);
            } else {
                res.status(200).json({ message: "User already exists" });
            }
        });


        // Get All Tasks
        app.get("/tasks", async (req, res) => {
            try {
                const tasks = await taskCollection.find().toArray();
                res.json(tasks || []);
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
            }
        });

        // Get Single Task
        app.get("/tasks/:id", async (req, res) => {
            try {
                const { id } = req.params;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ message: "Invalid task ID" });
                }
                const task = await taskCollection.findOne({ _id: new ObjectId(id) });
                if (!task) {
                    return res.status(404).json({ message: "Task not found" });
                }
                res.json(task);
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch task", error: error.message });
            }
        });

        // Add a New Task
        app.post("/tasks", async (req, res) => {
            try {
                const { title, description, category } = req.body;
                if (!title || !category) {
                    return res.status(400).json({ message: "Title and category are required" });
                }

                const newTask = {
                    title,
                    description: description || "",
                    category,
                    timestamp: new Date(),
                };

                const result = await taskCollection.insertOne(newTask);
                res.json({ message: "Task added successfully", insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ message: "Failed to add task", error: error.message });
            }
        });

        // Update a Task
        app.put("/tasks/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { title, description, category } = req.body;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid task ID" });
                }

                if (!title || !description) {
                    return res.status(400).json({ error: "Title and description are required" });
                }

                const updatedTask = await taskCollection.updateOne(
                    { _id: new ObjectId(id) }, // Find the task by ID
                    { $set: { title, description, category } } // Only update these fields
                );

                if (updatedTask.matchedCount === 0) {
                    return res.status(404).json({ error: "Task not found" });
                }

                res.json({ message: "Task updated successfully" });
            } catch (error) {
                console.error("Error updating task:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });



        // Delete a Task
        app.delete("/tasks/:id", async (req, res) => {
            try {
                const { id } = req.params;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ message: "Invalid task ID" });
                }

                const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ message: "Task not found" });
                }

                res.json({ message: "Task deleted successfully" });
            } catch (error) {
                res.status(500).json({ message: "Failed to delete task", error: error.message });
            }
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Task is hare')
})
app.listen(port, () => {
    console.log(`Task at: ${port}`)
})


const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://taskhive-da97e.web.app",
    "https://task-hive-client.vercel.app",
  ],
  credentials: true,
};

const port = process.env.PORT || 5000;
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//jwt

// JWT Middleware to verify token and roles
const verifyToken = (roles = []) => {
  return (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .send({ message: "Unauthorized access: No token provided" });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        res.clearCookie("token");
        return res
          .status(400)
          .send({ message: "Invalid token. Please log in again." });
      }

      req.user = decoded;
      const email = req.user.email;
      const user = await userCollection.findOne({ email });

      // Role-based authorization check
      if (roles.length && !roles.includes(user.role)) {
        return res
          .status(403)
          .send({
            message: "Forbidden access: You don't have the required role",
          });
      }

      next();
    });
  };
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.htppe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false,
};
const userCollection = client.db("taskhive").collection("users");
async function run() {
  try {
    const taskCollection = client.db("taskhive").collection("taskCollection");
    const submissionCollection = client
      .db("taskhive")
      .collection("submissionCollection");
    const withdrawCollection = client
      .db("taskhive")
      .collection("withdrawCollection");
    const paymentCollection = client
      .db("taskhive")
      .collection("paymentCollection");
    const paymentConfirm = client.db("taskhive").collection("paymentConfirm");
    const notificationCollection = client
      .db("taskhive")
      .collection("notification");

    // JWT Route to generate token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    // Logout and clear token cookie
    app.post("/log-out", async (req, res) => {
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // Save user data in DB
    app.put("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const isExists = await userCollection.findOne(query);
      if (isExists) return res.send({ message: "User already exists" });
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Admin-only route: Get all users
    app.get("/users", verifyToken(["admin"]), async (req, res) => {
      const result = await userCollection
        .find({ role: { $in: ["Buyer", "Worker"] } })
        .toArray();
      res.send(result);
    });

    // Admin-only route: Delete user
    app.delete("/user/delete/:id", verifyToken(["admin"]), async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // Admin-only route: Update user role
    app.patch("/user/role/:email", verifyToken(["admin"]), async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const updatedDoc = { $set: { ...user } };
      const result = await userCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // get user info by email from db:for custom useUserHook

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    // for worker

    app.get("/all-task", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await taskCollection
        .find({ required_workers: { $gt: 0 } })
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // for admin

    app.get("/admin-task", verifyToken(["admin"]), async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });

    // for admin

    app.delete(
      "/admin-task-delete/:id",
      verifyToken(["admin"]),
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await taskCollection.deleteOne(query);
        res.send(result);
      }
    );
    //for buyer:

    app.post("/add-task", verifyToken(["Buyer"]), async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    // get all task by user email:for buyer to get her task
    app.get("/all-task/:email", verifyToken(["Buyer"]), async (req, res) => {
      const email = req.params.email;
      const query = { "user.email": email };
      const options = {
        sort: { "user.post_time": -1 },
      };
      const result = await taskCollection.find(query, options).toArray();
      res.send(result);
    });

    // get single task by id:
    app.get("/my-task/:id", verifyToken(["Buyer"]), async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    // update single task by id:buyer

    app.patch("/my-task/:id", verifyToken(["Buyer"]), async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = { $set: { ...data } };
      const result = await taskCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete single task by id: for buyer

    app.delete("/all-task/:id", verifyToken(["Buyer"]), async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // decrease user coin:

    app.patch(
      "/decrease-coin/:email",
      verifyToken(["Buyer"]),
      async (req, res) => {
        const email = req.params.email;

        const query = { email: email };

        const value = req.body;

        const decrease = parseFloat(value.value);

        const updateDoc = {
          $inc: { coins: -decrease },
        };

        const result = await userCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );
    // increase user coin:

    app.patch(
      "/increase-coin/:email",
      verifyToken(["admin", "Buyer"]),
      async (req, res) => {
        const email = req.params.email;

        const query = { email: email };

        const value = req.body;

        const increase = parseFloat(value.value);

        const updateDoc = {
          $inc: { coins: increase },
        };

        const result = await userCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );

    // submission collection:
    //for worker
    app.get("/work-submission/:email", async (req, res) => {
      const email = req.params.email;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = { worker_email: email };
      const result = await submissionCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.patch("/task/reject/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const status = req.body;

      // Update the submission status
      const updatedDoc = { $set: { ...status } };
      const result = await submissionCollection.updateOne(query, updatedDoc);

      // Get worker email, task title, and buyer email to send the notification
      const submission = await submissionCollection.findOne(query);
      const workerEmail = submission.worker_email;
      const taskTitle = submission.task_title;
      const buyerEmail = submission.buyer_email;

      // Create a notification for the worker
      const notification = {
        message: `Your submission for ${taskTitle} has been rejected by ${buyerEmail}`,
        toEmail: workerEmail,
        actionRoute: "/dashboard/worker-home",
        time: new Date(),
        status: "unread", // New notification should be unread initially
      };

      await notificationCollection.insertOne(notification); // Add the notification to the DB

      res.send(result); // Send response back
    });

    app.patch("/task/approve/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const status = req.body;

      // Update the submission status
      const updatedDoc = { $set: { ...status } };
      const result = await submissionCollection.updateOne(query, updatedDoc);

      // Get worker email, task title, and buyer email to send the notification
      const submission = await submissionCollection.findOne(query);
      const workerEmail = submission.worker_email;
      const taskTitle = submission.task_title;
      const buyerEmail = submission.buyer_email;
      const payableAmount = submission.payable_amount;

      // Create a notification for the worker
      const notification = {
        message: `You have earned ${payableAmount} from ${buyerEmail} for completing ${taskTitle}`,
        toEmail: workerEmail,
        actionRoute: "/dashboard/worker-home",
        time: new Date(),
        status: "unread", // New notification should be unread initially
      };

      // await notificationCollection.insertOne(notification); // Add the notification to the DB

      res.send(result); // Send response back
    });

    // update user coin when buyer accept task:
    app.patch("/update-user-coin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const value = req.body;
      const increase = parseFloat(value.coins);

      const updateDoc = {
        $inc: { coins: increase },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.post("/worker-submission", async (req, res) => {
      const submissionData = req.body;
      const result = await submissionCollection.insertOne(submissionData);
      res.send(result);
    });

    // get data for stat [buyer]

    app.get("/buyer-state/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const { coins } = await userCollection.findOne(query, {
        projection: {
          _id: 0,
          coins: 1,
        },
      });

      const query2 = {
        status: "Pending",
        buyer_email: email,
      };
      const pendingTask = await submissionCollection.countDocuments(query2);

      const paymentPaid = await paymentConfirm.find(query).toArray();

      const total = paymentPaid.reduce((acc, cr) => {
        return acc + cr.dollars;
      }, 0);

      res.send({ pendingTask, coins, total });
    });

    app.get("/worker-state/:email", async (req, res) => {
      const email = req.params.email;
      const { coins } = await userCollection.findOne(
        { email: email },
        {
          projection: {
            _id: 0,
            coins: 1,
          },
        }
      );

      const total_submission = await submissionCollection.countDocuments({
        worker_email: email,
      });

      const total_earning = await submissionCollection
        .find({ worker_email: email, status: "Approve" })
        .toArray();
      const total = total_earning.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.payable_amount;
      }, 0);

      res.send({ coins, total_submission, total });
    });
    // get for buyer:
    app.get("/task-submission/:email", async (req, res) => {
      const email = req.params.email;
      const query = { buyer_email: email, status: "Pending" };
      const result = await submissionCollection.find(query).toArray();
      res.send(result);
    });

    // get for worker:
    app.get("/worker-submission/:email", async (req, res) => {
      const email = req.params.email;
      const query = { worker_email: email, status: "Approved" };
      const result = await submissionCollection.find(query).toArray();
      // const workerEmail = email; // This is the worker who made the withdrawal
      // const message = `Your submission has been approved.`;

      // const notification = {
      //   message: message,
      //   toEmail: workerEmail,
      //   actionRoute: "/dashboard/worker-home",
      //   time: new Date(),
      //   status: "unread"
      // };

      // await notificationCollection.insertOne(notification);

      res.send(result); // Send response back
    });

    app.get("/single-task/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    app.get("/taskCount", async (req, res) => {
      const count = await taskCollection.countDocuments();
      res.send({ count });
    });

    //submission count

    app.get("/submissionCount", async (req, res) => {
      const count = await submissionCollection.countDocuments();
      res.send({ count });
    });

    // for home section
    app.get("/users-coin", async (req, res) => {
      const result = await userCollection
        .find()
        .sort({ coins: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // save withdraw for worker in withdrawCollection
    app.post("/withdraw-coin", async (req, res) => {
      const data = req.body;
      const result = await withdrawCollection.insertOne(data);
      res.send(result);
    });

    // for admin
    app.get("/admin-home-request", async (req, res) => {
      const result = await withdrawCollection.find().toArray();
      res.send(result);
    });

    app.patch("/user-coin-deducted/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const data = req.body;
      const increase = parseInt(data.withdraw);
      const updateDoc = {
        $inc: { coins: -increase },
      };
      const result = await userCollection.updateOne(query, updateDoc);

      // Create a notification for the worker (to notify them about the approval)
      const workerEmail = email;
      const message = `Your withdrawal request of ${increase} has been approved.`;

      const notification = {
        message: message,
        toEmail: workerEmail,
        actionRoute: "/dashboard/worker-home",
        time: new Date(),
        status: "unread",
      };

      await notificationCollection.insertOne(notification); // Add the notification to the DB

      res.send(result);
    });

    // make it for admin for after approve payment delete specific data in withdrawCollection
    app.delete("/withdraw-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await withdrawCollection.deleteOne(query);
      res.send(result);
    });

    // ---------------------
    // Everything for buyer payment:

    app.get("/payment-offer", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    app.get("/payment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await paymentCollection.findOne(query);
      res.send(result);
    });

    //create-payment-intent

    app.post("/create-payment-intent", async (req, res) => {
      const price = req.body.price;
      const priceInCent = parseFloat(price) * 100;

      if (!price || priceInCent < 1) return;
      //generate client secret
      const { client_secret } = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      //send client secret response
      res.send({ clientSecret: client_secret });
    });

    // working on confirm payment store in database:
    app.post("/confirm-payment", async (req, res) => {
      const confirmData = req.body;
      const result = await paymentConfirm.insertOne(confirmData);
      res.send(result);
    });

    app.patch("/payment-success/coin-update/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const data = req.body;
      const increase = parseInt(data.coins);
      const updateDoc = {
        $inc: { coins: increase },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // for buyer show all success payment of her
    app.get("/all-success-payment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const options = {
        sort: { time: -1 },
      };
      const result = await paymentConfirm.find(query, options).toArray();
      res.send(result);
    });

    // for admin

    app.get("/admin/state", async (req, res) => {
      const totalUser = await userCollection.countDocuments();

      // Count users by role
      const totalBuyers = await userCollection.countDocuments({
        role: "Buyer",
      });
      const totalWorkers = await userCollection.countDocuments({
        role: "Worker",
      });

      const result2 = await userCollection.find().toArray();

      const totalCoin = result2.reduce((acc, cr) => {
        return parseInt(acc) + parseInt(cr.coins);
      }, 0);

      const paymentPaid = await paymentConfirm.find().toArray();
      const totalPay = paymentPaid.reduce((acc, cr) => {
        return parseInt(acc) + parseInt(cr.coins);
      }, 0);

      res.send({ totalBuyers, totalWorkers, totalCoin, totalPay });
    });

    // post by Buyer for worker notification : task approved
    app.post("/notification", async (req, res) => {
      const notify = req.body;
      const result = await notificationCollection.insertOne(notify);
      res.send(result);
    });

    app.get("/notification/:email", async (req, res) => {
      const email = req.params.email;
      const query = { toEmail: email };

      // Aggregation with custom sort order
      const result = await notificationCollection
        .aggregate([
          { $match: query },
          {
            $addFields: {
              sortOrder: {
                $cond: { if: { $eq: ["$status", "unread"] }, then: 1, else: 2 },
              },
            },
          },
          { $sort: { sortOrder: 1, time: -1 } },
          { $project: { sortOrder: 0 } },
        ])
        .toArray();

      res.send(result);
    });

    app.patch("/notification/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const status = req.body;
      const updateDoc = {
        $set: {
          ...status,
        },
      };
      const result = await notificationCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get("/notification-count/new/:email", async (req, res) => {
      const email = req.params.email;
      const query = { toEmail: email, status: "unread" };
      const count = await notificationCollection.countDocuments(query);

      res.send({ count });
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("taskhive is runnig");
});

app.listen(port, () => {
  console.log(`taskhive is running on ${port}`);
});

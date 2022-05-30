const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();

app.use(cors({ origin : "https://car-manufacturer-dd339.web.app/"  }))
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n9qnp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run (){
    try {
        await client.connect()
    const productCollection =client.db("car").collection("manufacturee");
    const userCollection = client.db('car').collection('users');
    const reviewCollection = client
      .db("car")
      .collection("reviews");

    function verifyJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send({ message: 'UnAuthorized access' });
        }
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            req.decoded = decoded;
            next();
        });
        
    }

    // get all reviews
    app.get("/review", async (req, res) => {
        const query = {};
        const cursor = reviewCollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
    });

    //add review
    app.post('/review', async (req, res) => {
      const newreview = req.body;
      const result = await reviewCollection.insertOne(newreview);
      res.send(result);
  });


    app.get('/product', async(req,res) =>{
        const query={};
        const cursor =productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
    })

    app.get('/product/:id', async(req,res)=>{
        const id = req.params.id;
        const query ={_id:ObjectId(id)};
        const product = await productCollection.findOne(query);
        res.send(product);
    })
    // Add New Items 
    app.post('/addmyitem', async (req, res) => {
        const newitem = req.body;
        const result = await productCollection.insertOne(newitem);
        res.send(result);
    });
    // Delete products 
    app.delete('/product/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const product = await productCollection.deleteOne(query);
        res.send(product)
    });

    
     //load all  user
    //  app.get('/user', verifyJWT, async (req, res) => {
     app.get('/user', verifyJWT,async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
    });

    app.put('/user/admin/:email',verifyJWT,async (req, res) => {
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAccount = await userCollection.findOne({email: requester})
        if (requesterAccount.role ==='admin') {
            const filter = { email: email };
        const updateDoc = {
            $set: {role:'admin'},
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send( result );
        }
        else{
            res.status(403).send({message:'forbidden'})
        }
        
    });
    // user information connect database 

    app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
            $set:user,
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ result, token });
    });


    // admin access verify from db

    app.get('/admin/:email', async (req, res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        const isAdmin = user.role === 'admin';
        res.send({ admin: isAdmin })
    })

    }
    finally{

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('running Car Manufacturer server');
});

app.listen(port, ()=> {
    console.log('Car Manufacturer listening on port ${port}');
});
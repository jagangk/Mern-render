//declarations
const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const app = express();
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10); 
const jwt = require('jsonwebtoken'); 
const secret = 'hello';
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const Post = require('./models/post');
//const Contact = require('./models/contact');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const url = 'mongodb+srv://blog:vhUWIEuOKLl1tVOE@cluster0.hrwjeaz.mongodb.net/?retryWrites=true&w=majority';

app.use(cors({credentials:true, origin:'https://blogstera.tech'}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads',express.static(__dirname + '/uploads'));
 
//database connection
mongoose.set('strictQuery', false);
mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true }); 

app.get('/',(req,res) => {
 res.json('server working');
});

//register page connection to database function
app.post('/test', async (req,res) => {
    const {username,password} = req.body;
   
    try{
        if(password.length < 4) {
            res.status(400);
            throw new e('Password must be at least 8 characters long');
            }    
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password,salt), 
        });
        res.json(userDoc);

    } catch(e) {
        console.log(e);
        res.status(400).json(e);

    }
});

//login page end point connection to database function
app.post('/login', async(req,res) => {
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) =>{
            if (err) throw err;
            res.cookie('token',token).json({
                id:userDoc._id,
                username,

            });
        });
    } else{
        res.status(400).json('wrong credentials');
    }
  
});

app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req,res) =>{
    res.cookie('token','').json('ok');

});

app.post('/post',uploadMiddleware.single('file'),async (req,res) =>{
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length -1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
    
    const {token} = req.cookies;
    jwt.verify(token, secret, {},async (err,info) => {
        if (err) throw err;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id, 
    });
    res.json(postDoc);
    });
    
});

app.get('/post', async (req,res) =>{
    res.json(await Post.find()
     .populate('author',['username'])
    .sort({createdAt: -1})
    .limit(20)
    );
});

app.put('/post',uploadMiddleware.single('file'), async (req,res) => {
    let newPath = null;
    if (req.file) {
      const {originalname,path} = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path+'.'+ext;
      fs.renameSync(path, newPath);
    }
  
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {id,title,summary,content} = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json('you are not the author');
      }
      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });
  
      res.json(postDoc);
    });
  });


app.get('/post/:id', async(req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
})



app.post('/contact', async (req, res) => {
    try {
        const { name, email, query } = req.body;
        //const newContact = new Contact({ name, email, query });
        //await newContact.save();


        // Send notification email to the admin
        const adminTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'blogsteratech@gmail.com',
                pass: 'jvqo vxmh ojlu uqtk'
            }
        });

        const adminMailOptions = {
            from: 'blogsteratech@gmail.com',
            to: 'blogsteratech@gmail.com',
            subject: 'Customer contact',
            text: `Customer Name: ${name}\nCustomer Email: ${email}\n\n${query}`
        };

        adminTransporter.sendMail(adminMailOptions, function (error, info) {
            if (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            } else {
                console.log('Notification Email sent: ' + info.response);
                res.status(200).send('Emails sent successfully');
            }
        });

        //user acknowledgement mail

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'blogsteratech@gmail.com',
                pass: 'jvqo vxmh ojlu uqtk'
            }
        });

        const mailOptions = {
            from: 'blogsteratech@gmail.com',
            to: email,
            subject: 'Thank you for contacting us',
            html: `
                <p>Dear ${name},</p>
                <p>Thank you for contacting us. We have received your inquiry and will get back to you as soon as possible.</p>
                <p>Best regards,<br>Blogstera team</p>
                `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).send('Ack-Email sent successfully');
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }

});

app.listen(4000);

module.exports = app;

 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const mongo_store = require('connect-mongo');
const body_parser = require('body-parser');
const { query, body, validationResult } = require('express-validator');

const User = require("./models/user");
const Location = require("./models/location");

const port = 3030;
const connection_string = 'mongodb://127.0.0.1:27017/Debug-API';

const app = express();

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: false}));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}));
app.use(session({
    secret: 'debug-api',
    saveUninitialized: false,
    resave: false,
    store: mongo_store.create({
        mongoUrl: connection_string,
    }),
}));

mongoose.connect(connection_string)
    .then(r => {
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    })
    .catch(e => {
        console.log(e)
    });

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/session', (req, res) => {
    res.send(JSON.stringify(req.session));
});

app.get('/Add-User', (req, res) => {
    // res.send('not authorized');
    // return false;

    const user = new User({
        email: 'super-admin@email.com',
        password: 'password1234',
        role: 'super_admin',
    });

    user.save()
        .then(r => {
            res.send(r);
        })
        .catch(e => {
            console.log(e)
        });
});

app.post('/Get-User', body('email').isEmail(), body('password').isLength({ min: 5 }), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ 'error': true, 'message':'invalid email or password', })
        // return res.status(400).json({ errors: errors.array() });
    }

    User.findOne({
        email: req.body.email.toLowerCase(),
        password: req.body.password,
    })
        .then(r => {
            if (r && Object.keys(r).length > 0) {
                req.session.email = r.email;
                req.session.role = r.role;
                res.send({'error':false, 'message':'user found', 'email':r.email, 'role':r.role});
            }
            else {
                req.session.destroy();
                res.send({'error':true, 'message':'incorrect email or password'});
            }
        })
        .catch(e => {
            console.log(e)
        });
});

app.get('/Authenticate-User', (req, res) => {
    if ('role' in req.session)
        res.send({'role':req.session.role, 'email':req.session.email});
    else
        res.send(false);
});

app.get('/Log-Out', (req, res) => {
    req.session.destroy();
    res.send(true);
});

app.get('/Add-Location', query('name').isLength({min:1}), query('location').isLength({min:1}), query('type').isLength({min:1}), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ 'error': true, 'message':'invalid location or type', })
        // return res.status(400).json({ errors: errors.array() });
    }

    if ('role' in req.session && req.session.role == 'super_admin') {
        Location.find(
            { $or:[
                    { name: req.query.name },
                    { location: req.query.location },
                ]
            }
        )
            .then(r => {
                if (r && Object.keys(r).length > 0)
                    res.send({'error':true, 'message':'name or location already exist'});
                else {
                    const location = new Location({
                        name: req.query.name,
                        location: req.query.location,
                        type: req.query.type,
                    });

                    location.save()
                        .then(r => {
                            res.send(r);
                        })
                        .catch(e => {
                            console.log(e)
                        });
                }
            })
            .catch(e => {
                console.log(e)
            });
    }
    else
        res.send({'error':true, 'message':'not authorized'});
});

app.get('/Update-Location', query('_id').isLength({min:1}), query('name').isLength({min:1}), query('location').isLength({min:1}), query('type').isLength({min:1}), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ 'error': true, 'message':'invalid location or type', })
        // return res.status(400).json({ errors: errors.array() });
    }

    if ('role' in req.session && req.session.role == 'super_admin') {
        Location.find(
            {
                $and:[
                    {$or:[
                            { name: req.query.name },
                            { location: req.query.location },
                        ]},
                    {_id: { $ne: req.query._id }}
                ]
            }
        )
            .then(r => {
                if (r && Object.keys(r).length > 0)
                    res.send({'error':true, 'message':'name or location already exist'});
                else {
                    Location.findOneAndUpdate(
                        {
                            '_id': req.query._id
                        },
                        {
                            name: req.query.name,
                            location: req.query.location,
                            type: req.query.type,
                        }
                    )
                        .then(r => {
                            res.send(r);
                        })
                        .catch(e => {
                            console.log(e)
                        });
                }
            })
            .catch(e => {
                console.log(e)
            });
    }
    else
        res.send({'error':true, 'message':'not authorized'});
});

app.get('/Delete-Location', query('_id').isLength({min:1}), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if ('role' in req.session && req.session.role == 'super_admin') {
        Location.findByIdAndDelete(req.query._id)
            .then(r => {
                res.send(r);
            })
            .catch(e => {
                console.log(e)
            });
    }
    else
        res.send({'error':true, 'message':'not authorized'});
});

app.get('/Get-Locations', (req, res) => {
    Location.find()
        .then(r => {
            if (r && Object.keys(r).length > 0)
                res.send({'error':false, 'message':'locations found', locations:r});
            else
                res.send({'error':true, 'message':'locations not found'});
        })
        .catch(e => {
            console.log(e)
        });
});


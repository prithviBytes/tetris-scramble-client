//main
require('dotenv').config();

const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const http = require('http').createServer(app);
const cors = require('cors');
const path = require('path');
const io = require('socket.io')(http, {
  cors: {
    origin: process.env.REACT_CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});
const socketGame = require('./gameConnection/publicConnection/publicConnection');
const bodyParser = require('body-parser');
const passport = require('./routes/authorization/passport');
const registration = require('./routes/registration');
const login = require('./routes/login');
const user = require('./routes/user');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL); // Example for postgres

//app.use(express.static(path.join(__dirname, 'client/build')));

try {
    sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    });
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

const port = process.env.PORT || 8079;
app.use(cors({origin: process.env.REACT_CLIENT_ORIGIN, credentials: false}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({type: ['application/json', 'text/plain']}));
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: [process.env.KEY1 + ''],
    maxAge: 1000 * 60 * 24 * 10,
}))

// Instantiates passport settings.
app.use(passport.initialize());
app.use(passport.session());

socketGame.socketConnection(io); //global socketio object with all data carried by it

// app.get('/', (req, res) => {
//     console.log(req.user);
//     if (!req.user) {
//         respUser = 'none'
//     } else {
//         respUser = req.user.username;                        //if user is deserialized successfuly, it is returned to the client
//     }
//     res.json({ message: 'ok', code: 200, user: respUser });
// })

// Base route for the initial version of endpoints. 
// If extension is evere needed into v2, this will smoothly allow phasing over.
const baseRoute = '/api/v1';

app.use(`${baseRoute}/auth`,registration);
app.use(`${baseRoute}/auth`, login);

// Routes below require token authorization.
// Without providing a token an Unauthorized response is given.
app.use(`${baseRoute}/user`, passport.authenticate('jwt', {session: false}), user);

http.listen(port, () => {
    console.log(`listening on port ${port}`);
});

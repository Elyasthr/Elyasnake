//HTTP
//Serveur Express pour la partie http (sert juste a servir les pages du site)
const express = require('express');
const app = express();
const path = require('path');
const port = 3030;

//Requis pour les session utilisateur
const session = require('express-session');

//Requis pour ce connecter à la base de donnée Mongo
const MongoClient = require('mongodb').MongoClient;
const urlDB = 'mongodb://localhost:27017';
const nameDB = 'game';
const MongoStore = require('connect-mongo')(session);

//middleware
app.set('view engine', 'pug');
app.use('/js', express.static(path.join(__dirname, 'assets/js')));
app.use('/css', express.static(path.join(__dirname, 'assets/css')));
app.use('/img', express.static(path.join(__dirname, 'src/img')));
app.use(express.urlencoded({extended: false}));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 's3cur3',
    store: new MongoStore({
        url: 'mongodb://localhost:27017'
    })
}));

//routes
app.get("/",(req,res)=>{
    res.render('index')
})

app.get("/login",(req,res)=>{
    res.render('login')
})

app.post("/login-verif",(req,res)=>{
    //si un des 2 champs n'est pas renseigné
    if(!req.body.password || !req.body.pseudo){
        console.log('il faut renseigner chaque champs');
        //Faire une redirection avec un message d'erreur
        res.render('login');
    }
    //sinon verifier s'il l'utilisateur existe
    else{
        console.log('tout les champs sont renseiné');
        //Connexion a la base de donnée
        MongoClient.connect(urlDB, { useUnifiedTopology: true }, (err, client) => {
            if (err) return;

            const collection = client.db(nameDB).collection('users');

            collection.findOne({pseudo: req.body.pseudo}, (error, result) => {
                if(!result){
                    //si il n'existe pas le rediriger vers le login  
                    console.log("L'utilisateur existe pas");
                    //Rediriger vers le login
                    res.render('login');

                }
                else{
                  if ( req.body.password === result.password ) {
                    // Couple login / mot de passe valide
                    req.session._id = result._id;
                    req.session.pseudo = result.pseudo;
                    console.log('Utilisateur correct');
                    //Rediriger vers le login
                    res.render('game',{ pseudo: req.session.pseudo, id: req.session._id });
                  }else {
                    console.log('mauvaise authentification');
                    res.render('login');
                  }
                }
            });
        })
    }
})

app.get("/register",(req,res)=>{
    res.render('register')
})

app.post("/register-verif",(req,res)=>{
    //si un des 3 champs n'est pas renseigné
    if(!req.body.password || !req.body.email || !req.body.pseudo){
        console.log('il faut renseigner chaque champs');
        //Faire une redirection avec un message d'erreur
        res.render('register');
    }
    //sinon verifier s'il l'utilisateur n'esxiste pas deja sinon le creer
    else{
        console.log('tout les champs sont renseiné');
        //Connexion a la base de donnée
        MongoClient.connect(urlDB, { useUnifiedTopology: true }, (err, client) => {
            if (err) return;
            const collection = client.db(nameDB).collection('users');

            //Verifier si l'utilisateur existe
            collection.findOne( { $or: [ { pseudo: req.body.pseudo }, { email: req.body.email } ] } ,(err, result) => {
                if(!result){
                    //si il n'existe pas deja le creer puis rediriger vers le login  avec un message de confirmation disant que lutilisateur et creer et quil peut se connecter ou bien rediriger directement vers le jeu
                    collection.insertOne({pseudo: req.body.pseudo, email: req.body.email, password: req.body.password}, function(err, result){
                        if (err) throw err;
                        console.log("L'utilisateur a été creer correctement");
                        req.session._id = result.ops[0]._id;
                        req.session.pseudo = result.ops[0].pseudo;
                        res.render('game');
                    });
                }
                else{
                    console.log('Cet utilisateur a deja ete creer');
                    //Rediriger vers le login
                    res.render('login');
                }
            });
        })
    }  
})

app.get('/perdu',(req,res)=>{
    res.render('perdu');
})


app.get('/logout', (req, res) => {
    // Méthode destroy de session pour supprimer la session
    req.session.destroy((err) => {
        // Nous stockons dans la propriété la message un texte avec une coloration pour une class bootstrap qui seront utilisés dans le pug qui sera appelé dans la route correspondant à la page d'accueil
        // res.redirect('/') permet d'appeler la route correspondant à la page d'accueil
        res.redirect('/');
    });
});

//Ecoute du port
const server = app.listen(port,()=>{
     console.log('le server est lancé');
 })


//WEBSOCKET
//Socket.io

const ioServer = require('socket.io');
const io = new ioServer(server);
const _ = require('lodash');

const Snake = require('./assets/js/snake');
const Pomme = require('./assets/js/pomme');

const GRILLE_JEU = 40;
let joueurs = [];
let pommes = [];


io.on('connection',(socket)=>{
    console.log('connexion server etablie');
    
    let joueur;

    //Recuperation des données du joueur
    socket.on('identite',(res)=>{

        //J'initialise mon nouveau joueur
        joueur = new Snake(_.assign({
            id: res.id,
            pseudo: res.pseudo,
            direction: 'droite',
            grilleJeu: GRILLE_JEU,
            snakes: joueurs,
            pommes
        }));

        //Je met mon joueur dans la liste des joueurs connectés
        joueurs.push(joueur);

    })

    //On ecoute les touches du clavier
    socket.on('key',(key)=>{
        //Si notre joueur existe appeler la fonction qui permet de lui faire changer de direction
        if(joueur){
            joueur.changementDirection(key);
        }
    })

    socket.on('mort',(joueur)=>{
        _.remove(joueurs,joueur);
        var destination = 'http://localhost:3030/perdu';
        socket.emit('redirect', destination);

    })
    //Si le joueur se deconnecte ou quitte la partie
    socket.on('disconnect',(reason)=>{
        //On retire notre joueur du tableau de joueur actif
        _.remove(joueurs,joueur);
        console.log('deconnexion');
    })
})

//On initialise des pommes dans la grille de jeu
for(let i = 0; i < 3; i++){
    pommes.push(new Pomme({
        grilleJeu: GRILLE_JEU,
        snakes: joueurs,
        pommes
    }));
}

//Boucle du jeu
//var partie = 
setInterval(()=>{

    joueurs.forEach(joueur => {
        joueur.mouvement();
    })

    io.emit('modification',{
        //On remplace le tableau avec un nouveau qui les valeur mis a jour
        joueurs: joueurs.map(joueur => ({
            x: joueur.x,
            y: joueur.y,
            id: joueur.id,
            alive: joueur.alive,
            pseudo: joueur.pseudo,
            points: joueur.points,
            queues: joueur.queues
        })),
        //pareil pour le tableau de pomme
        pommes: pommes.map(pomme => ({
            x: pomme.x,
            y: pomme.y
        }))
    });
},100);

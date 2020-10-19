window.addEventListener('DOMContentLoaded',()=>{
    const pseudo = document.getElementById('pseudo').innerText;
    const monId = document.getElementById('id').innerText;

    //Class Canvas (pas reussi a l'exporter)
    GameCanvas = (function(){
        //Constructeur
        function GameCanvas(canvas){
            var ratio = window.innerWidth < window.innerHeight ?
            window.innerWidth : window.innerHeight;
    
            this.canvas = canvas;
            this.canvas.width = this.canvas.height = ratio;
            this.context = this.canvas.getContext('2d');
            this.grilleTaille = 40;
            this.caseTaille = ratio / this.grilleTaille;
        }
    
        //Dessin du Canvas et de ce qu'il contient
        GameCanvas.prototype.draw = function(joueurs,pommes){
            var context = this.context;
            var caseTaille = this.caseTaille;
    
            //Canvas
            this.context.fillStyle = "black";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
            //Reset autre joueurs
            $('#autreJoueurs').text('');
    
            //Affichage des scores pour chaque joueurs
            joueurs.forEach(joueur => {
                //J'affiche mon score
                if(joueur.id === monId){
                    $('#monJoueur').text(joueur.pseudo + ': ' + joueur.points).append($('<br>'));
                }
                //Et celui des autres joueurs
                else{
                    $('#autreJoueurs').append($('<span>').text(joueur.pseudo + ': ' + joueur.points)).append($('<br>'));
                }
                
                if(joueur.id === monId){
                    //J'affiche mon joueur en blanc pour le differancier des autres joueurs
                    context.fillStyle = "white";
                }else{
                    //Les ennemis sont affiche en bleue
                    context.fillStyle = "blue";
                }
    
                //Je dessine un carré pour la tête de mon serpent
                context.fillRect(joueur.x * caseTaille, joueur.y * caseTaille, caseTaille, caseTaille);
    
                //Puis je dessine la queue du joueur
                joueur.queues.forEach((queue) =>{
                    context.fillRect(queue.x * caseTaille, queue.y * caseTaille, caseTaille, caseTaille);
                });
    
            });
    
            //Afficher les pommes
            pommes.forEach(pomme =>{
                context.fillStyle = "green";
                context.fillRect(pomme.x * caseTaille, pomme.y* caseTaille, caseTaille, caseTaille);
            });
        }
    
        return GameCanvas;
    })();

    //lien socket avec le server
    const socket = io('http://localhost:3030');

    socket.on('connect',()=>{
        console.log('connexion client etablie');

        //J'envoie l'identite du joueur
        socket.emit('identite', {pseudo: pseudo, id: monId});

        //Creer puis inserer le canvas dans le document
        var canvas = document.createElement("canvas");
        document.body.appendChild(canvas);

        //Creer un nouveau jeu avec la class Canvas creer plus tôt
        var game = new GameCanvas(canvas);

        //Listenner du clavier lorsqu'on appuie sur une touche
        document.onkeydown = (e) =>{
            //Je renvoie la touche appuié
            socket.emit('key', e.keyCode);
        }

        //A chaque modification apporter au jeu je redessine le canvas
        socket.on('modification',(maj)=>{
            maj.joueurs.forEach(joueur=>{
                if(joueur.id === monId && joueur.alive == false){
                    socket.emit('mort',joueur);
                }
            })
            game.draw(maj.joueurs,maj.pommes);
        });

        socket.on('redirect', function(destination) {
            window.location.href = destination;
        });

    })
})
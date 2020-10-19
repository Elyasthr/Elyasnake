const _ = require('lodash');

const TOUCHE = {
    haut: 38,
    droite: 39,
    bas: 40,
    gauche: 37
  };

class Snake {
    constructor(parametres){
        _.assign(this, parametres);
        this.renitialiser();
    }

    changementDirection(touche){
        switch(touche) {
            case TOUCHE.haut:
              if (this.direction !== 'bas')
                this.direction = 'haut'; break;
            case TOUCHE.droite:
              if (this.direction !== 'gauche')
                this.direction = 'droite'; break;
            case TOUCHE.bas:
              if (this.direction !== 'haut')
                this.direction = 'bas'; break;
            case TOUCHE.gauche:
              if (this.direction !== 'droite')
                this.direction = 'gauche'; break;
          }
    }

    mouvement(){
        //Mise à jour de la queues
        for(let i = this.queues.length - 1; i >= 0; i--){
            this.queues[i].x = (i === 0) ? this.x : this.queues[i-1].x;
            this.queues[i].y = (i === 0) ? this.y : this.queues[i-1].y;
        }

        //Direction du serpent
        switch(this.direction) {
            case 'droite':
              this.x++; break;
            case 'gauche':
              this.x--; break;
            case 'haut':
              this.y--; break;
            case 'bas':
              this.y++; break;
          }

        //Limite du terrain
        if(this.x > this.grilleJeu-1) this.alive = false;
        if(this.x < 0) this.alive = false;
        if(this.y > this.grilleJeu-1) this.alive = false;
        if(this.y < 0) this.alive = false;

        //Detection des collisions
        this.detectionCollision();
    }

    detectionCollision(){
        //Pour tout les serpent
        this.snakes.forEach(snake => {
            //Collision des têtes
            if(snake !== this){
                //Si la tête des deux serpent ont les même coordonnées
                if(snake.x === this.x && snake.y === this.y){
                    //Le serpent le plus petit meurt 
                    if(snake !== this && this.queues.length < snake.queues.length){
                        this.alive = false;
                    }else{
                        snake.alive = false;
                    }
                }
            }

            

            //Collision des queues même concept que pour les tête
            snake.queues.forEach(queue =>{
                if(queue.x === this.x && queue.y === this.y){
                    if(snake !== this && this.queues.length < snake.queues.length){
                        this.alive = false;
                    }else{
                        snake.alive = false;
                    }
                }
            });
        });

        //Pour les pommes
        this.pommes.forEach(pomme =>{
            if(pomme.x === this.x && pomme.y === this.y){
                this.ajoutPoint();
                this.ajoutQueue();
                pomme.renitialiser();
            }
        });
    }

    renitialiser(){
        this.queues = [];
        this.alive = true;
        this.points = 0;
        this.x = Math.random() * this.grilleJeu | 0;
        this.y = Math.random() * this.grilleJeu | 0;
    }

    ajoutPoint(){
        this.points++;
    }

    ajoutQueue(){
        this.queues.push({x: this.x, y: this.y});
    }
}

module.exports = Snake;
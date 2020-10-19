const _ = require('lodash');

class Pomme {
    constructor(parametres){
        _.assign(this, parametres);
        this.renitialiser();
    }

    //Fait apparaitre la pomme aleatoirement
    renitialiser(){
        this.x = Math.random() * this.grilleJeu | 0;
        this.y = Math.random() * this.grilleJeu | 0;
    
        this.detectionCollision();
    
        return this;
    }

    detectionCollision(){
        //Avec les serpents
        this.snakes.forEach(snake => {
            if(snake.x === this.x && snake.y === this.y){
                this.renitialiser();
            }

            //Avec la queue des serpents
            snake.queues.forEach(queue =>{
                if(queue.x === this.x && queue.y === this.y){
                    this.renitialiser();
                }
            });
        });

        //Avec les pommes
        this.pommes.forEach(pomme =>{
            //Sauf elle-même
            if(this !== pomme){
                if(pomme.x === this.x && pomme.y === this.y){
                    this.renitialiser();
                }
            }
        });
    }
}

module.exports = Pomme;
Crafty.c('Goal', {
    init:function(){
        this.requires('Actor, 2D, DOM, Color, Collision');
        
        x = parseInt(Math.random()*game.width*0.8+game.width*0.1);
        y = parseInt(Math.random()*game.height*0.8);
        this.attr({x:x, y:y, w:20, h:20});
        this.color('#ffffff');
        this.bind('EnterFrame', function(){
            // Dropping Down
            this.update();
            
            // Regeneration when it falls
            if(this.hit('Lava')){
                Crafty.e('Goal');
                this.destroy();
            }
        });
    },
    
    impact:function(){
        game.player.score += 2;
        game.score.update();

        /**
        game.player.weapon += 1;
        game.player.weapon %= game.weapons.length;
        **/

        game.tags.push(Crafty.e('2D, DOM, Color, Text')
        .attr({x:this.x, y:this.y-10})
        .textFont({size:'20px'})
        .textColor('#ffffff')
        .text(game.weapons[game.player.weapon].slice(11)));
        
        setTimeout(function(){
            game.tags[0].destroy();
            game.tags=game.tags.slice(1);
        }, 300);
        
        Crafty.e('Goal');
        this.destroy();
    }
});

Crafty.c('Projectile', {
    init:function(){
        this.requires('2D, DOM, Color, Collision');
        this.speed = 0;
        this.dist = 0;
        
        this.damage = 0;
        this.dir = 0;
        this.time = 0;
    },
   
    at:function(x, y, dir){
        this.attr({x:x+game.player.w/2, y:y+game.player.h/2-this.h/2});
        this.dir = dir;
    },
    
    update:function(dt){
        this.x += this.speed * this.dir * dt;
        if(this.x < 0 || this.x > game.width-this.w) this.impact();
    }
});

Crafty.c('Projectile_Bullet', {
    init:function(){
        this.requires('Projectile');
        this.color('#ffffff');
        this.attr({w:10, h:10});
        
        this.speed = 450;
        this.damage = 1;
        this.time = 200;
        
        this.bind('EnterFrame', function(data){
            dt = data.dt/1000;
            
            //Movement
            this.update(dt);
        });
    },
    
    impact:function(){
        this.destroy();
    }
});

Crafty.c('Projectile_Rocket', {
    init:function(){
        this.requires('Projectile');
        this.color('#ffffff');
        this.attr({w:20, h:10});
        
        this.speed = 400;
        this.damage = 1;
        this.time = 1000;
        
        this.bind('EnterFrame', function(data){
            dt = data.dt/1000;
            
            //Movement
            this.update(dt);
        });
    },
    
    impact:function(){
        big = 100;
        if(this.w==big && this.h==big) return 0;
            
        this.x -= big/2-10; this.y -= big/2-5;
        this.w = big; this.h = big;
        this.speed = 0;
        this.color(255,255,255,0.5);
        
        this.timeout(function(){this.destroy();}, 1000);
    }
});

Crafty.c('Actor', {
    init:function(){
        this.requires('2D, DOM, Color, Collision');
        this.landed = false;
        this.dy = 0;
    },
   
    update:function(){
        if(!this.landed) this.dy += game.gravity * dt;
        this.y += this.dy;
       
        floors = this.hit('Floor');
        if(floors){
            obj = floors[0].obj;
            if(this.dy > 0 || this.y > obj.y+this.h*0.8){
                this.y = obj.y - this.h;
                this.dy = 0;
                this.landed = true;
            }else{
                this.dy = 0;
                this.y = obj.y + this.h;
            }
        }else{
            this.landed = false;
        }
    }
});

Crafty.c('Enemy', {
    init:function(){
        this.requires('Collision, Circle');
        this.health = 1;
        this.dead = false;
    },
    
    checkHit:function(){
        p = this.hit('Projectile');
        if(p){
            for(i=0;i<p.length;i++){
                this.health -= p[i].damage;
            }
            if(this.health>0) return 0;
            
            this.dead = true;
            
            p[0].obj.impact();
            this.dir = 0;
            
            time = 50;
            this.swapColor('#FFA500');
            this.timeout(function(){this.swapColor('#FEEDC8')}, time*2);
            this.timeout(function(){this.swapColor('#FFA500')}, time*3);
            this.timeout(function(){this.destroy();}, time*3.5);
        }
    },
    
    swapColor:function(clr){
        this.color(clr);
    }
});

Crafty.c('Enemy_Med', {
    init:function(){
        this.requires('Actor, Enemy');
        this.attr({w:30, h:30});
        this.attr({x:game.width/2-this.w/2, y:-1*this.h});
        this.color('#0000FF');
       
        this.speed = 200;
        this.dir = (Math.random()>0.5)*2 - 1;
       
        this.health = 1;
       
        this.bind('EnterFrame', function(data){
            dt = data.dt/1000;
           
            // Enemy Die
            if(this.hit('Lava')) this.dy += 10;
            if(this.y > game.height+game.buffer) this.destroy();
           
            // Enemy Shot
            this.checkHit();
           
            // Movement
            if(this.y > game.buffer){
                this.x += this.speed * this.dir * dt;
                if(this.x > game.width-game.buffer-this.w){
                    this.dir *= -1;
                    this.x = game.width-game.buffer-this.w;
                }
                if(this.x < game.buffer){
                    this.dir *= -1;
                    this.x = game.buffer;
                }
            }
           
            // Gravity
            this.update();
        });
    }
});

Crafty.c('Player', {
    init:function(){
        this.requires('Actor, Keyboard');
        this.attr({x:50, y:50, w:40, h:40});
        this.color('#FFFFFF');
        this.speed = 350;
        this.height = 12;
       
        this.left = false;
        this.right = false;
        this.jump = false;
        this.dir = 1;
        
        this.shoot = false;
        this.shot = false;
        this.timer = false;
        
        this.score = 10;
        this.weapon = 0;
       
        // Movement and direction
        keys = Crafty.keys;
        this.bind('KeyDown', function(e){
            if(e.key == keys.W) this.jump = true;
            if(e.key == keys.A) {this.left = true; this.dir = -1;}
            if(e.key == keys.D) {this.right = true; this.dir = 1;}
            if(e.key == keys.SPACE) this.shoot = true;
        });
       
        this.bind('KeyUp', function(e){
            if(e.key == keys.W) this.jump = false;
            if(e.key == keys.A) this.left = false;
            if(e.key == keys.D) this.right = false;
            if(e.key == keys.SPACE) this.shoot = false;
        });
        
        // Direction indicator
        this.t = Crafty.e('2D, DOM, Color, Text')
        .attr({x:this.x+this.w/2, y:this.y-this.h/2})
        .textFont({size:'30px'})
        .textColor('#ffffff')
        .text('>');
       
        this.bind('EnterFrame', function(data){
            dt = data.dt/1000;
           
            // Game Over conditions
            if(this.hit('Lava')){
                this.dy += 20;
                game.gameOver();
            }
            
            e = this.hit('Enemy');
            if(e){
                for(i=0; i<e.length; i++){
                    if(!e[i].obj.dead) game.gameOver();
                }
            }
            
            // Scoring
            g = this.hit('Goal');
            if(g) g[0].obj.impact();
           
            // Movement
            dir = (this.left)*-1 + (this.right)*1;
            this.x += this.speed * dir * dt;
            this.x = Math.min(this.x, game.width-game.buffer-this.w);
            this.x = Math.max(game.buffer, this.x);
           
            // Gravity
            this.update();
           
            // Jumping
            if(this.landed && this.jump){
                this.dy = -1 * this.height;
                this.landed = false;
            }
            
            // Shooting
            if(this.shoot && !this.shot && this.score>0){
                this.shot = true;
                p = Crafty.e(game.weapons[this.weapon]);
                p.at(this.x, this.y, this.dir);
                this.score -= 1;
                game.score.update();
                this.timeout(function(){this.shot = false;}, p.time);
            }
            
            // Direction on head
            if(this.dir>0) this.t.text('>');
            else this.t.text('<');
            
            this.t.attr({x:this.x+this.w/2-10, y:this.y-this.h/2});
        })
    }
});

Crafty.c('Floor', {
    init:function(){
        this.requires('2D, DOM, Color');
        this.attr({h:10});
        this.color('#00FF00');
    },
   
    at:function(x, y, w){
        this.attr({x:x, y:game.height-this.h-y, w:w});
    }
});

Crafty.c('Lava', {
    init:function(){
        this.requires('2D, DOM, Color');
        this.attr({h:10});
        this.color('#FF0000');
    },
   
    at:function(x, y, w){
        this.attr({x:x, y:game.height-this.h-y, w:w});
    }
});

Crafty.defineScene('Stage1', function(){
    game.player = Crafty.e('Player').attr({x:50, y:50});
    game.player.init();
    game.tags = [];
   
    Crafty.background('black');
   
    opening = 100;
    Crafty.e('Floor').at(0, 0, game.width/2-opening/2);
    Crafty.e('Floor').at(game.width/2+opening/2, 0, game.width/2-opening/2)
    Crafty.e('Lava').at(game.width/2-opening/2, 0, opening);
   
    Crafty.e('Floor').at(game.width*0.2, game.height/4, game.width*0.6);
   
    Crafty.e('Floor').at(0, game.height/2, game.width/5);
    Crafty.e('Floor').at(game.width*0.8, game.height/2, game.width/5);
   
    Crafty.e('Floor').at(game.width*0.2, game.height*0.75, game.width*0.6);
   
    // Crafty.e('Floor').at(0, game.height, game.width);

    game.generateEnemy();
     
    Crafty.e('Goal');
    game.score = Crafty.e('2D, DOM, Color, Text')
    .attr({x:game.width/2-20, y:10})
    .textFont({size:'40px', weight:'bold'})
    .textColor('#ffffff')
    .text(game.player.score);

    game.score.update = function(){
        s = game.player.score;
        game.score.text(s);
        game.score.x = game.width/2 - 15*s.toString().length;
    };
});

var game = {
    init:function(){
        this.gravity = 25;
        this.width = 600;
        this.height = 450;
        this.buffer = 10;
        Crafty.init(this.width, this.height, document.getElementById('game'));
        
        this.weapons = ['Projectile_Bullet'];
        // this.weapons = ['Projectile_Bullet', 'Projectile_Rocket'];
        this.tags = [];
        
        this.timer = false;
        this.paused = false;
        Crafty.enterScene('Stage1');
    },
   
    generateEnemy:function(){        
        for(i=0; i<3; i++){
            e = Crafty.e('Enemy_Med');
            e.y -= i*e.h*4;
        }
        this.timer = setTimeout('game.generateEnemy();', 4000);
    },
    
    gameOver:function(){
        clearTimeout(this.timer);
        this.timer = false;
        
        Crafty.e('2D, DOM, Color')
        .attr({x:0, y:0, w:game.width, h:game.height})
        .color(0,0,0,0.8);
        
        Crafty.pause();
        
        Crafty.e('2D, DOM, Color, Text, Keyboard')
        .attr({x:game.width/2-110, y:game.height/2-60})
        .textFont({size:'40px', weight:'bold'})
        .textColor('#ffffff')
        .text('Game.Over')
        .bind('KeyDown', function(e){
            if(e.key == Crafty.keys.ESC){
                Crafty.scene('Stage1');
                Crafty.pause();
            }
        });
        
        Crafty.e('2D, DOM, Color, Text')
        .attr({x:game.width/2-110, y:game.height/2+30})
        .textFont({size:'30px'})
        .textColor('#ffffff')
        .text('ESC.to.continue');
    },
    
    // TODO: pause game
    pause:function(){
        if(this.paused){
            this.paused = false;
            Crafty('Overlay').destroy();
        }else{
            this.paused = true;
            Crafty.e('Overlay, 2D, DOM, Color')
            .color(0,0,0,0.8)
            .attr({x:0, y:0, w:this.width, h:this.height});
        }
        
        Crafty.pause();
    }
};

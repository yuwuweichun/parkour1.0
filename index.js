//获取html元素
const playArea = document.getElementById('playArea');
const gameOver = document.getElementById('gameOver');
const scoreElement = document.getElementById('score');
//
var playAreaCanvas = document.getElementById('playAreaCanvas');
const playAreaCtx = playAreaCanvas.getContext('2d');

//创建image对象
var backgroundImg = new Image();
backgroundImg.src = 'background.webp';

var characterImg = new Image();
characterImg.src = 'pingzewei.webp';

var characterLieImg = new Image();
characterLieImg.src = 'pingzeweiLie.png';

var lowObstacleImg = new Image();
lowObstacleImg.src = 'lowObstacle.webp';

var highObstacleImg = new Image();
highObstacleImg.src = 'highObstacle.webp';

//让playAreaCanvas的宽高与playArea客户端的宽高一致
playAreaCanvas.width = playArea.clientWidth;
playAreaCanvas.height = playArea.clientHeight;




backgroundImg.onload = function () {
    playAreaCtx.drawImage(backgroundImg, 0, 0, playAreaCanvas.width * 3, playAreaCanvas.height);
}

characterImg.onload = function () {
    playAreaCtx.drawImage(characterImg, 0, playAreaCanvas.height / 3 * 2, playAreaCanvas.width / 20, playAreaCanvas.height / 3);
}

// 常量部分
const CHARACTER_WIDTH_RATIO = 1 / 20;
const CHARACTER_HEIGHT_RATIO = 1 / 3;
const OBSTACLE_WIDTH_RATIO = 1 / 20;
const OBSTACLE_HEIGHT_RATIO = 1 / 6;
const HIGH_OBSTACLE_WIDTH_RATIO = 1 / 3
const HIGH_OBSTACLE_HEIGHT_RATIO = 1 / 15;
const GROUND_HEIGHT_RATIO = 2 / 3;
const GRAVITY = 0.2;//重力加速度→滞空时间
const JUMP_SPEED_INITIAL = -10;//初始跳跃速度

// 变量部分
let obstacleSpeed = -3;//障碍物移动速度，随游戏进行，速度加快
let backgroundSpeed = -1;//背景移动速度，随游戏进行，速度加快
let lastObstacleTime = Date.now();
const obstacles = [];
let isJumping = false;
let isLying = false;
let isGameOver =false;
let jumpSpeed = JUMP_SPEED_INITIAL;
let characterY = playAreaCanvas.height * GROUND_HEIGHT_RATIO;
let score = 0;//初始得分


// 角色对象
class Character {
    //constructor
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    //方法
    draw() {
        playAreaCtx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    jump() {
        if (isJumping || isLying) return;
        isJumping = true;
        const initialY = this.y;

        const updateJump = () => {
            jumpSpeed += GRAVITY;
            this.y += jumpSpeed;
            if (this.y > initialY) {
                this.y = initialY;
                isJumping = false;
                jumpSpeed = JUMP_SPEED_INITIAL;
            }
            if (isJumping) {
                requestAnimationFrame(updateJump);
            }
        };

        updateJump();
    }

    lieDown() {
        if (isJumping || isLying) return;
        isLying = true;

        // 调整宽高
        this.image = characterLieImg;
        this.width = playAreaCanvas.height / 3;
        this.height = playAreaCanvas.width / 20;
        this.y = playAreaCanvas.height - this.height;
        //恢复站立的事件
        setTimeout(() => {
            this.standUp();
        }, 1500);

    }

    standUp() {
        isLying = false;
        this.image = characterImg;
        this.width = playAreaCanvas.width * CHARACTER_WIDTH_RATIO;
        this.height = playAreaCanvas.height * CHARACTER_HEIGHT_RATIO;
        this.y = characterY;
    }
}


// 事件监听
document.addEventListener('keydown', function(event) {
    if (event.key === 'j') {
        
        character.jump();
    } else if (event.key === 's') {
        
        character.lieDown();
    }
    else if (event.key === 'v') {
       
        location.reload();
        
    }
});

// 初始化角色
var character = new Character(characterImg, 0, characterY, playAreaCanvas.width * CHARACTER_WIDTH_RATIO, playAreaCanvas.height * CHARACTER_HEIGHT_RATIO);

// 障碍物对象
class Obstacle {
    constructor(x, type) {
        this.x = x;
        this.type = type;
        this.image = type === 'low' ? lowObstacleImg : highObstacleImg;
        this.width = type === 'low' ? playAreaCanvas.width * OBSTACLE_WIDTH_RATIO : playAreaCanvas.height * HIGH_OBSTACLE_WIDTH_RATIO;
        this.height = type === 'low' ? playAreaCanvas.height * OBSTACLE_HEIGHT_RATIO : playAreaCanvas.width * HIGH_OBSTACLE_HEIGHT_RATIO;
        this.y = type === 'low' ? playAreaCanvas.height / 6 * 5 : playAreaCanvas.height / 3 * 2;
    }

    draw() {
        playAreaCtx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += obstacleSpeed;
    }
}

// 函数部分

//创建障碍物
function createObstacle() {
    const type = Math.random() < 0.5 ? 'low' : 'high';
    const obstacle = new Obstacle(playAreaCanvas.width, type);
    obstacles.push(obstacle);
}

//更新障碍物
function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        if (obstacle.x + obstacle.width < 0) { //障碍物移出画布
            obstacles.splice(index, 1);
        }
    });
}

//背景循环滚动
let backgroundX = 0;

function updateBackground() {
    
    playAreaCtx.clearRect(0, 0, playAreaCanvas.width, playAreaCanvas.height);

    
    backgroundX += backgroundSpeed;

    
    if (backgroundX < -playAreaCanvas.width * 3) {
        backgroundX = 0;
    }

    
    playAreaCtx.drawImage(backgroundImg, backgroundX, 0, playAreaCanvas.width * 3, playAreaCanvas.height);
    playAreaCtx.drawImage(backgroundImg, backgroundX + playAreaCanvas.width *3, 0, playAreaCanvas.width * 3, playAreaCanvas.height);
}


// 游戏循环
function gameLoop() {
    playAreaCtx.clearRect(0, 0, playAreaCanvas.width, playAreaCanvas.height);

    updateBackground();
    character.draw();
    updateObstacles();
    
    
    //检测是否发生碰撞
    obstacles.forEach((obstacle) => {
        if (isColliding(character, obstacle)) {
            // 发生碰撞后的处理
            isGameOver = true;
            
        }
    });


    // 一定时间生成新的障碍物
    if (Date.now() - lastObstacleTime > 3000) { 
        createObstacle();
        lastObstacleTime = Date.now();
    }


    if(!isGameOver){requestAnimationFrame(gameLoop);}
    else{gameOver.style.display = "flex";}
    
}

// 开始游戏
gameLoop();
//碰撞检测
//实现一个碰撞检测函数，然后在游戏循环中调用
//如果发生碰撞，该函数返回true
function isColliding(objA,objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;   
}


//得分
setInterval(function() {
    if(!isGameOver){
        score += 100;
        scoreElement.innerHTML = "得分：" + score;
    }
    
},3000);


$(document).ready(function(){
    var size = document.getElementById("sizeOfGrid").selectedOptions[0].value;
    size = parseInt(size);

    $( "#tableContainer" ).append( generateGrid(size, size) );
    $("#rewardBtnSubmit").click(function(){
        generateMovement(parseFloat($("#rewardVal").val()));
    })

    var start = document.getElementById("play").rows[2].cells[0];  
    var goal = document.getElementById("play").rows[0].cells[3];  
    var terminal = document.getElementById("play").rows[1].cells[3];  
    

    start.style.backgroundColor = "gold";
    goal.style.backgroundColor = "blue";
    terminal.style.backgroundColor = "red";

    var dragging = false;
    $( "td" ).mousedown(function(){
        dragging = true;
    })
    .mousemove(function() {
        if(dragging == true){
            var index = $( "td" ).index( this );
            var row = Math.floor( ( index ) / 4) + 1;
            var col = ( index % 4 ) + 1;
            if((row != 3 || col != 1) && (row != 2 || col != 4) && (row != 1 || col != 4)){
                $( this ).css( 'background-color', 'black' );
            }
        }
    })
    .mouseup(function(){
        dragging = false;
    })


});

var model = [
    [0, 0, 0, 1],
    [0, 0, 0, -1],
    [Number.NEGATIVE_INFINITY, 0, 0, 0]
];


var probMovement = {
    "intended": .6,
    "left": .1,
    "right": .1,
    "still": .2
};

var dir = {
    "intended": 0,
    "left": 1,
    "right": -1
};

var time;


function generateGrid( rows, cols ) {
      var grid = "<table id='play'>";
      for ( row = 1; row <= rows; row++ ) {
          grid += "<tr>"; 
          for ( col = 1; col <= cols; col++ ) {      
              grid += "<td></td>";
          }
          grid += "</tr>"; 
      }

      
      return grid;
}

function generateMovement(reward){
    alert(typeof(reward));

    for(let row = 0; row < 3; ++row){
        for(let col = 0; col < 4; ++col){
            if(document.getElementById("play").rows[row].cells[col].style.backgroundColor == 'black'){
                console.log(row, col);
                model[row][col] = null;
            }

        }
    }

    var convergence = 0;
    var previousModel = JSON.stringify(model);

    // value iteration
    counter = 0;
    while(convergence == 0){
        for(let row = 0; row < 3; ++row){
            for(let col = 3; col > -1; --col){
                if(model[row][col] == 1 || model[row][col] == -1 || model[row][col] == null){
                    continue;
                }
                // calculate utility
                let possibleMoves = [];
                for(let i = 0; i < 4; ++i){
                    let ans = 0;
                    for(move in dir){
                        // right
                        if((dir[move] + i) % 4 == 0){
                            if(col + 1 < 5 && model[row][col+1] != null){
                                ans += probMovement[move]*model[row][col+1];
                            }
                            else{
                                ans += probMovement[move]*model[row][col];
                            }
                        }
                        // up
                        else if((dir[move] + i) % 4== 1){
                            if(row - 1 > -1 && model[row - 1][col] != null){
                                ans += probMovement[move]*model[row - 1][col];
                            }
                            else{
                                ans += probMovement[move]*model[row][col];
                            }
                        }
                        // left
                        else if((dir[move] + i) % 4 == 2){
                            if(col - 1 > -1 && model[row][col - 1] != null){
                                ans += probMovement[move]*model[row][col - 1];
                            }
                            else{
                                ans += probMovement[move]*model[row][col];
                            }
                        }
                        // down
                        else if((dir[move] + i) % 4 == 3){
                            if(row + 1 < 3 && model[row + 1][col] != null){
                                ans += probMovement[move]*model[row + 1][col];
                            }
                            else{
                                ans += probMovement[move]*model[row][col];
                            }
                        }
                    }
                    // take care of still
                    possibleMoves.push(ans += probMovement["still"]*model[row][col]);
                }
                model[row][col] = reward + Math.max(...possibleMoves);
            }
        }

        if(JSON.stringify(model) === previousModel){
            convergence = 1;
        }
        previousModel = JSON.stringify(model);
        ++counter;
    }
    console.log(model);
    // agent movement
    // based on random movement, will always look for next best
    // in their immediate environment
    let currLoc = [2,0];
    time = setInterval(function(){
        let intendedMove = findNextMove(currLoc);
        let actualMove = sampleProb(intendedMove, currLoc);

        if(JSON.stringify(currLoc) != JSON.stringify(actualMove)){
            var player = document.getElementById("play").rows[actualMove[0]].cells[actualMove[1]];
            player.style.backgroundColor = "gold";

            var player = document.getElementById("play").rows[currLoc[0]].cells[currLoc[1]]; 
            player.style.backgroundColor = "white";

            currLoc = actualMove;
        }

        if((currLoc[0] == 0 || currLoc[0] == 1) && currLoc[1] == 3){
            stopTime();
            if(currLoc[0] == 0 && currLoc[1] == 3){
                alert("Goal");
            }
            else{
                alert("Terminal");
            }
        }
    }, 50);
    
}

function stopTime(){
    clearInterval(time);
}

function sampleProb(intendedMove, currLoc){
    let prob = Math.floor(Math.random()*10);
    if(prob > 3){
        return intendedMove;
    }
    else if(prob >= 2){
        return currLoc;
    }
    else if(prob == 1){
        //move right of intendedMove
        ans = currLoc.slice();
        var result = currLoc.map(function(item, index){
            return item - intendedMove[index];
        });
        //intended up
        if(result[0] == 1){
            if(currLoc[1] + 1 < 4 && model[currLoc[0]][currLoc[1] + 1] != null){
                ans[1] += 1;
            }
        }
        //intended down
        else if(result[0] == -1){
            if(currLoc[1] - 1 > -1 && model[currLoc[0]][currLoc[1] - 1] != null){
                ans[1] -= 1;
            }
        }
        //intended left
        else if(result[1] == 1){
            if(currLoc[0] - 1 > -1 && model[currLoc[0] - 1][currLoc[1]] != null){
                ans[0] -= 1;
            }
        }
        //intended right
        else if(result[1] == -1){
            if(currLoc[0] + 1 < 3 && model[currLoc[0] + 1][currLoc[1]] != null){
                ans[0] += 1;
            }
        }
        else{
            console.log("here")
            if(currLoc[1] + 1 < 4 && model[currLoc[0]][currLoc[1] + 1] != null){
                ans[1] += 1;
            }
        }

        return ans;
    }
    else{
        ans = currLoc.slice();
        //move left of intendedMove
        var result = currLoc.map(function(item, index){
            return item - intendedMove[index];
        });
        //intended up
        if(result[0] == 1){
            if(currLoc[1] - 1 > -1 && model[currLoc[0]][currLoc[1] - 1] != null){
                ans[1] -= 1;
            }
        }
        //intended down
        else if(result[0] == -1){
            if(currLoc[1] + 1 < 4 && model[currLoc[0]][currLoc[1] + 1] != null){
                ans[1] += 1;
            }
        }
        //intended left
        else if(result[1] == 1 ){
            if(currLoc[0] + 1 < 3 && model[currLoc[0] + 1][currLoc[1]] != null){
                ans[0] += 1;
            }
        }
        //intended right
        else if(result[1] == -1){
            if(currLoc[0] - 1 > -1 && model[currLoc[0] - 1][currLoc[1]] != null){
                ans[0] -= 1;
            }
        }
        else{
            if(currLoc[1] - 1 > -1 && model[currLoc[0]][currLoc[1] - 1] != null){
                ans[1] -= 1;
            }
        }

        return ans;
    }
}

function findNextMove(currLoc){
    let ans = model[currLoc[0]][currLoc[1]];
    nextBlock = currLoc;
    
    // up
    if(currLoc[0] - 1 > -1 && model[currLoc[0] - 1][currLoc[1]] != null){
        if(ans < model[currLoc[0] - 1][currLoc[1]]){
            ans = (model[currLoc[0]-1][currLoc[1]]);
            nextBlock = [currLoc[0]-1, currLoc[1]];
        }
    }else{
        if(ans < model[currLoc[0]][currLoc[1]]){
            ans = (model[currLoc[0]][currLoc[1]]);
            nextBlock = [currLoc[0], currLoc[1]];
        }
    }
    // left
    if(currLoc[1] - 1 > -1 && model[currLoc[0]][currLoc[1] - 1] != null){
        if(ans < model[currLoc[0]][currLoc[1] - 1]){
            ans = (model[currLoc[0]][currLoc[1]-1]);
            nextBlock = [currLoc[0], currLoc[1]-1];
        }
    }else{
        if(ans < model[currLoc[0]][currLoc[1]]){
            ans = (model[currLoc[0]][currLoc[1]]);
            nextBlock = [currLoc[0], currLoc[1]];
        }
    }
    // right
    if(currLoc[1] + 1 < 4 && model[currLoc[0]][currLoc[1] + 1] != null){
        if(ans < model[currLoc[0]][currLoc[1] + 1]){
            ans = (model[currLoc[0]][currLoc[1]+1]);
            nextBlock = [currLoc[0], currLoc[1]+1];
        }
    }else{
        if(ans < model[currLoc[0]][currLoc[1]]){
            ans = (model[currLoc[0]][currLoc[1]]);
            nextBlock = [currLoc[0], currLoc[1]];
        }
    }
    // down
    if(currLoc[0] + 1 < 3 && model[currLoc[0] + 1][currLoc[1]] != null){
        if(ans < model[currLoc[0] + 1][currLoc[1]]){
            ans = (model[currLoc[0]+1][currLoc[1]]);
            nextBlock = [currLoc[0]+1, currLoc[1]];
        }
    }else{
        if(ans < model[currLoc[0]][currLoc[1]]){
            ans = (model[currLoc[0]][currLoc[1]]);
            nextBlock = [currLoc[0], currLoc[1]];
        }
    }

    return nextBlock;
}
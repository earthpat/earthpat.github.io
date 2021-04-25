var model = new Array(30).fill(0).map(()=>new Array(30).fill(0));
var positions = []
$(document).ready(function(){

    $( "#tableContainer" ).append( generateGrid(30, 30) );

    $("#rewardBtnSubmit").click(function(){
        generateMovement(parseFloat($("#rewardVal").val()));
    })

    var fulfilled = false;
    var placed_start = false;
    var placed_goal = false;
    var placed_terminal = false;

    var start = document.getElementById("play");  
    var goal = document.getElementById("play");
    var terminal = document.getElementById("play");  

    var dragging = false;

    $( "td" ).mousedown(function(){
        if (!fulfilled){
            if (!placed_start){
                var index = $( "td" ).index( this );
                var row = Math.floor( ( index ) / 30);
                var col = ( index % 30 );
                start = document.getElementById("play").rows[row].cells[col];
                start.style.backgroundColor = "gold";
                document.getElementById("picker").innerHTML = "Select Goal.";
                placed_start = true
                model[row][col] = Number.NEGATIVE_INFINITY
                positions.push([row, col])
            }
            else if (!placed_goal){
                var index = $( "td" ).index( this );
                var row = Math.floor( ( index ) / 30);
                var col = ( index % 30 );
                goal = document.getElementById("play").rows[row].cells[col];
                goal.style.backgroundColor = "blue";
                document.getElementById("picker").innerHTML = "Select Terminal.";
                placed_goal = true
                model[row][col] = 1
                positions.push([row,col])
            }
            else if (!placed_terminal){
                var index = $( "td" ).index( this );
                var row = Math.floor( ( index ) / 30);
                var col = ( index % 30 );
                terminal = document.getElementById("play").rows[row].cells[col];
                terminal.style.backgroundColor = "red";
                document.getElementById("picker").innerHTML = "Select Reward.";
                document.getElementById("rewardVal").hidden = false;
                document.getElementById("rewardBtnSubmit").hidden = false;
                placed_terminal = true
                fulfilled = true
                model[row][col] = -1
                positions.push([row,col])
            }
        }
        else{
            dragging = true;
        }
    })
    .mousemove(function() {
        if(dragging == true){
            var index = $( "td" ).index( this );
            var row = Math.floor( ( index ) / 30) + 1;
            var col = ( index % 30 ) + 1;
            if((row != 3 || col != 1) && (row != 2 || col != 4) && (row != 1 || col != 4)){
                $( this ).css( 'background-color', 'black' );
            }
        }
    })
    .mouseup(function(){
        dragging = false;
    })


});

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

    for(let row = 0; row < 30; ++row){
        for(let col = 0; col < 30; ++col){
            if(document.getElementById("play").rows[row].cells[col].style.backgroundColor == 'black'){
                model[row][col] = null;
            }

        }
    }

    var convergence = 0;
    var previousModel = JSON.stringify(model);

    // value iteration
    counter = 0;
    while(convergence == 0){
        for(let row = 0; row < 30; ++row){
            for(let col = 29; col > -1; --col){
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
                            if(col + 1 < 30 && model[row][col+1] != null){
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
                            if(row + 1 < 30 && model[row + 1][col] != null){
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
    callModel(model)
    // agent movement
    // based on random movement, will always look for next best
    // in their immediate environment
    let currLoc = positions[0];
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
        if((currLoc[0] == positions[1][0] && currLoc[1] == positions[1][1]) || (currLoc[0] == positions[2][0] && currLoc[0] == positions[2][1])){
            stopTime();
            if(currLoc[0] == positions[1][0] && currLoc[1] == positions[1][1]){
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
            if(currLoc[1] + 1 < 30 && model[currLoc[0]][currLoc[1] + 1] != null){
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
            if(currLoc[0] + 1 < 30 && model[currLoc[0] + 1][currLoc[1]] != null){
                ans[0] += 1;
            }
        }
        else{
            if(currLoc[1] + 1 < 30 && model[currLoc[0]][currLoc[1] + 1] != null){
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

function callModel(model){
    console.log(model)

    var table = document.getElementById("play");
    for (var i = 0, row; row = table.rows[i]; i++) {
        for (var j = 0, col; col = row.cells[j]; j++) {
            table.rows[i].cells[j].innerHTML = model[i][j]
        }  
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
    if(currLoc[1] + 1 < 30 && model[currLoc[0]][currLoc[1] + 1] != null){
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
    if(currLoc[0] + 1 < 30 && model[currLoc[0] + 1][currLoc[1]] != null){
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
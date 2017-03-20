


var load_game = function() {
	var canvas = document.createElement("canvas");
	canvas.setAttribute("id","game_canvas");
	canvas.setAttribute("width","640");
	canvas.setAttribute("height","480");
	canvas.setAttribute("style","border:1px solid #d3d3d3;");
	canvas.innerHTML = "Your browser does not support the HTML5 canvas tag.";
	document.body.appendChild(canvas);


	var game_script = document.createElement("script");
	game_script.setAttribute("src","game.js");
	document.body.appendChild(game_script);
	
	btn.parentNode.removeChild(btn);
};




var table = document.createElement("table");
table.setAttribute("class","map_table");

var w = 5;
var h = 5;

for (var x = 0;x < w;++x)
{
	var row = document.createElement("tr");
	for (var y = 0;y < h;++y)
	{
		var data = document.createElement("td");
		data.innerHTML = "<button class='map_btn'><p class='map_btn_text'>" + (y+x*w+1) + "</p></button>";
		row.appendChild(data);
	}
	table.appendChild(row);
}

document.body.appendChild(table);





var btn = document.createElement("button");
btn.setAttribute("onclick","load_game();");
btn.innerHTML = "Play";
document.body.appendChild(btn);

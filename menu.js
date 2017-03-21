
var table = null;
var canvas = null;
var game_script = null;

var load_game = function() {
	safe_del(table);
	
	canvas = document.createElement("canvas");
	canvas.setAttribute("id","game_canvas");
	canvas.setAttribute("width",window.innerWidth - 32);
	canvas.setAttribute("height",window.innerHeight - 32);
	canvas.setAttribute("position","absolute");
	canvas.setAttribute("style","border:1px solid #d3d3d3;");
	canvas.innerHTML = "Your browser does not support the HTML5 canvas tag.";
	document.body.appendChild(canvas);
	
	game_script = document.createElement("script");
	game_script.setAttribute("src","game.js");
	document.body.appendChild(game_script);
};

var safe_del = function(e) {
	if (e != null) {
		e.parentNode.removeChild(e);
	}
};

var gen_table = function() {
	table = document.createElement("table");
	table.setAttribute("class","map_table");

	var w = 5;
	var h = 5;

	for (var x = 0;x < w;++x)
	{
		var row = document.createElement("tr");
		for (var y = 0;y < h;++y)
		{
			var data = document.createElement("td");
			data.innerHTML = "<button class='map_btn' onclick='load_map(" + (y+x*w) + ")'><p class='map_btn_text'>" + (y+x*w+1) + "</p></button>";
			row.appendChild(data);
		}
		table.appendChild(row);
	}

	document.body.appendChild(table);
};

var load_map = function(m) {
	document.getElementById("game_map").innerHTML = levels[m];
	load_game();
};

gen_table();

var levels = [`
	5,3;
	1,  0,1,1;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	6, 90,1,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	8,  0,1,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	1;
	6;
`,`
	8,8;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	0,  0,0,0;
	16;
	1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8;
`];
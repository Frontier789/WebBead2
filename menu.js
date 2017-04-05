
var title = null;
var table = null;
var canvas = null;
var game_script = null;

var map_states = [];
var act_map = 0;

var map_done = function() {
	map_states[act_map] = 2;
	localStorage.setItem("map_"+act_map,2);
	update_map_states();
}

var update_map_states = function() {
	var poss_found = 0;
	for (s in map_states) {
		if (poss_found < 2 && map_states[s] != 2) {
			poss_found++;
			map_states[s] = 1;
			localStorage.setItem("map_"+s,1);
		}
	}
}

var load_game = function() {
	safe_del(table);
	safe_del(title);
	
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
	title = document.createElement("h1");
	title.setAttribute("class","game_title");
	title.innerHTML = "DAT GAME 01"
	document.body.appendChild(title);
	
	window.onkeydown = function(e) {};
	window.onkeyup   = function(e) {};
	
	table = document.createElement("table");
	table.setAttribute("class","map_table");

	var w = 5;
	var h = 5;
	
	while (map_states.length < w*h) {
		if (localStorage.getItem("map_"+map_states.length) != null) {
			map_states.push(localStorage.getItem("map_"+map_states.length));
		} else {
			map_states.push(0);
		}
	}
	update_map_states();
	
	var map_names = ["A","","B","","C"];
	
	var btn_i = 0;
	
	for (var x = 0;x < w;++x)
	{
		var row = document.createElement("tr");
		row.setAttribute("class","button_tr");
		for (var y = 0;y < h;++y)
		{
			if (x == 0 && (y == 1 || y == 3))
			{
				var data = document.createElement("td");
				data.setAttribute("class","button_td");
				row.appendChild(data);
				continue;
			}
			
			var data = document.createElement("td");
			data.setAttribute("class","button_td");
			
			var btn_name = (y+x*w+1-map_names.length);
			
			if (y+x*w < map_names.length) {
				btn_name = map_names[(y+x*w)];
			}
			
			if (map_states[btn_i] == 0) {
				data.innerHTML = "<button class='map_btn_red'><p class='map_btn_text'>" + btn_name + "</p></button>";
			} else if (map_states[btn_i] == 1) {
				data.innerHTML = "<button class='map_btn_avail' onclick='load_map(" + btn_i + ")'><p class='map_btn_text'>" + btn_name + "</p></button>";
			} else if (map_states[btn_i] == 2) {
				data.innerHTML = "<button class='map_btn_done' onclick='load_map(" + btn_i + ")'><p class='map_btn_text'>" + btn_name + "</p></button>";
			}
			
			btn_i++;
			
			row.appendChild(data);
		}
		table.appendChild(row);
	}
	
	var desc_row = document.createElement("tr");
	var desc_dat = document.createElement("td");
	
	desc_dat.setAttribute("colspan","5");
	desc_row.setAttribute("class","desc_text");
	desc_dat.innerHTML = `<p><img src='btns/btn_bckg_white.png' class='scaled_img' alt='white'></img> : feloldott pályák</p>
						  <p><img src='btns/btn_bckg_green.png' class='scaled_img' alt='white'></img> : teljesített pályák</p>
						  <p><img src='btns/btn_bckg_red.png' class='scaled_img' alt='white'></img> : nem feloldott pályák</p>`;
	
	desc_row.appendChild(desc_dat);
	table.appendChild(desc_row);
	
	safe_del(canvas);
	safe_del(game_script);
	safe_del(document.getElementById("gen_text"));

	document.body.appendChild(table);
};

var load_map = function(m) {
	act_map = m;
	document.getElementById("game_map").innerHTML = document.getElementById("maps_div").childNodes[2*m + 1].innerHTML;
	load_game();
};

gen_table();

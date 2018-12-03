<html lang="hu">
	<head>
		<title>Gimme dat main site</title>
		<meta charset="UTF-8">
		<link rel="stylesheet" type="text/css" href="main.css">
	</head>
    <body>
		<div class="tab">
			<button class="tablinks leftlink" onclick="openTab(event, 'tab0')" id="defaultOpen">PHPLasor</button>
			<button class="tablinks leftlink" onclick="openTab(event, 'tab1')">Játék elemek</button>
			<button class="tablinks rightmost" onclick="openTab(event, 'tab2')">Ki csinálna ilyet?</button>
		</div>

		<div id="tab0" class="tabcontent">
			<h2>
				PHPLasor 
				<img src="logo.png" style="width: 20px;"></img> <?php /* Dat logo */ ?>
			</h2>
			<p>Igen, lasor, nem írtam el</p>
			<p>Nagyon izgi, nagyon játék</p>
			<table id="opts_table">
				<tr id="opts_tr">
					<td><a href="register.php">Regisztráció</a></td>
					<td><a href="game.php">Játék regisztríció nélkül</a></td>
					<td><a href="login.php">Bejelentkezés</a></td>
				</tr>
			</table>
		</div>

		<div id="tab1" class="tabcontent">
			<h3>Játék elemek</h3>
			<div class="spr_img" id="spr0" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr1" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr2" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr3" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr4" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr5" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr6" onclick="set_active(event,this);"></div>
			<div class="spr_img" id="spr7" onclick="set_active(event,this);"></div>
			<p id="spr0_p" style="display:none;">Mozgatni nem lehet, a lézer útját azonban nem akadályozza</p>
			<p id="spr1_p" style="display:none;">Kapu, amin kötelezően át kell haladjon lézer fentről lefelé</p>
			<p id="spr2_p" style="display:none;">Két oldali tükör, adott oldaláról a lézer kilncven fokban pattan le</p>
			<p id="spr3_p" style="display:none;">Lézer emitter, lézert lő ki a nyíl irányában</p>
			<p id="spr4_p" style="display:none;">Áteresztő kétoldali tükör, a lézer nem csak lepattan róla, de egyben folytatja is útját keresztül rajta</p>
			<p id="spr5_p" style="display:none;">Egy oldali tükör, a tükör sötét oldala opcionális célpontként is szolgát</p>
			<p id="spr6_p" style="display:none;">Egy oldali célpontos tükör, a piros pötty kötelező célpontot jelöl</p>
			<p id="spr7_p" style="display:none;">Célpont, kötelező eltalálni.</p>
		</div>

		<div id="tab2" class="tabcontent">
			<p>név: Komáromi Mátyás</p>
			<p>nk: T0P3KW</p>
		</div>
		
		<p style="position: absolute; right: 10px; bottom: 0px; font-size: 0.8em; color: #cdcdcd;">by: Frontier</p>
		<script>
			
			var offsets = ["0px 0px","-55px 0px","-110px 0px","-165px 0px","0px -55px","-55px -55px","-110px -55px","0px -110px"];
			
			for (var i in offsets) {
				document.getElementById("spr" + i).style.backgroundPosition = offsets[i];
			}
			
			var set_active = function(event,div) {
				for (var i in offsets) {
					var cur_spr = document.getElementById("spr" + i);
					document.getElementById("spr" + i + "_p").style.display = "none";
					cur_spr.classList.remove("active_spr");
					cur_spr.style.margin = "6px";
				}
				
				document.getElementById(div.getAttribute("id") + "_p").style.display = "block";
				div.classList.add("active_spr");
				div.style.margin = "4px";
			};
			
			function openTab(evt, name) {
				var i, tabcontent, tablinks;

				tabcontent = document.getElementsByClassName("tabcontent");
				for (i = 0; i < tabcontent.length; i++) {
					tabcontent[i].style.display = "none";
				}

				tablinks = document.getElementsByClassName("tablinks");
				for (i = 0; i < tablinks.length; i++) {
					tablinks[i].className = tablinks[i].className.replace(" active", "");
				}

				document.getElementById(name).style.display = "block";
				evt.currentTarget.className += " active";
			}
			
			document.getElementById("defaultOpen").click();
			
		</script>
		
    </body>
</html>



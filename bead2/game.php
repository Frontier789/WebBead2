<?php
	$username = "";
	$password = "";
	
	session_start();
	
	if (isset($_SESSION['username'])){ $username = $_SESSION['username']; }
	if (isset($_SESSION['password'])){ $password = $_SESSION['password']; }
	
	$login_data = json_decode(file_get_contents("login.json"),true);
	
	if ($username == "" || !array_key_exists($username,$login_data) || !isset($login_data[$username]["password"]) || $login_data[$username]["password"] != $password)
	{
		$username = "guest";
		$password = "guest";
	}
?>


<html lang="hu">
	<head>
		<title>Omg játék</title>
		<meta charset="UTF-8">
		<link rel="stylesheet" type="text/css" href="game.css">
	</head>
    <body>
		<img src="sprite_sheet.png" id="sprite_sheet" style="display:none;" alt="missing sprite sheet">
		<img src="lock.png" id="lock_img" style="display:none;" alt="missing lock image">
		<img src="lock_rot.png" id="lock_rot_img" style="display:none;" alt="missing lock_rot image">
		<p style="display:none;" id="game_map">
			1,1;0,  0,0,0;1;6;
		</p>
		
		<p id="logged_inas_p">
			<font id="logged_in_txt">
				Bejelentkezve mint:
			</font>
			<font id="logged_in_user">
				<?php echo $username; ?> 
			</font>
			<?php if ($username == "guest") echo " <font id='logged_in_warning'> (a megoldások nem kerülnek mentésre) </font>"; ?> 
			<a href="main.php" id="logouta">
				Kijelentkezés
			</a>
		</p>
		
		<table cellspacing="10" id="map_select_table">
			
		</table>
		
		<form id="upload_from" action="" method="post">
			<label><b>Pálya készítője:</b></label>
			<input type="text" placeholder="készítő" name="maker" value="<?php echo $username; ?>" id="in_maker" required>
			</br>
			
			<label><b>Pálya Neve:</b></label>
			<input type="text" placeholder="név" name="newmap_name" value="" id="in_map_name" required>

			<select id="in_dif">
			  <option value="0">Könnyű</option>
			  <option value="1">Közepes</option>
			  <option value="2">Nehéz</option>
			  <option value="3">Lehetetlen</option>
			</select>
			
			<input type="button" id="upload_btn" class="uploadbtn" value="Feltöltés"></input>
			<input type="button" id="cancel_btn" class="cancelbtn" value="Szerkesztés"></input>
		</form>
		
		<p style="position: absolute; right: 10px; bottom: 0px; font-size: 0.8em; color: #cdcdcd;">by: Frontier</p>
		<script>
			
			document.getElementById("upload_from").style.display = "none";
			
			var canvas;
			var game_script;
			
			var safe_del = function(e) {
				if (e != null) {
					e.parentNode.removeChild(e);
				}
			};
			
			var curmap;
			
			var sure_del = function(button,mapname) {
				
				button.innerHTML = "tutika?";
				button.onclick = function() {
					del_map(mapname);
				};
				button.onmouseleave = function() {
					this.innerHTML = "törlés";
					this.onclick = function() {
						sure_del(this,mapname);
					};
					this.onmouseleave = function() {};
				};
			};
			
			var php_username = "<?php echo $username; ?>";
			var php_password = "<?php echo $password; ?>";
			
			var del_map = function(mapname) {
				xmlhttp = new XMLHttpRequest();
				
				xmlhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						
						update_table();
					}
				};

				
				xmlhttp.open("POST","bckgexec.php",true);
				xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xmlhttp.send( "username=" + "<?php echo $username; ?>" + 
							 "&password=" + "<?php echo $password; ?>" + 
							 "&map_to_del="  + mapname +
							 "&cmd=del_map");
			}
			
			var load_map = function(mapname) {
				
				curmap = mapname;
				
				document.getElementById("map_select_table").style.display = "none";
				
				canvas = document.createElement("canvas");
				canvas.setAttribute("id","game_canvas");
				canvas.setAttribute("width",window.innerWidth - 32);
				canvas.setAttribute("height",window.innerHeight - 32);
				canvas.setAttribute("position","absolute");
				canvas.setAttribute("style","border:1px solid #d3d3d3;");
				canvas.innerHTML = "Your browser does not support the HTML5 canvas tag.";
				document.body.appendChild(canvas);
				
				document.getElementById("game_map").innerHTML = document.getElementById("map_" + mapname).innerHTML;
				
				game_script = document.createElement("script");
				game_script.setAttribute("src","game.js?version=REDVÁSANYÁDATHOGYMAGADTÓLNEMTÖLTÖDÚJRA");
				document.body.appendChild(game_script);
			};
			
			var gen_table = function() {
				
				document.getElementById("map_select_table").style.display = "";
				
				safe_del(canvas);
				safe_del(game_script);
				safe_del(document.getElementById("gen_text"));
			}
			
			var map_done = function() {
				xmlhttp = new XMLHttpRequest();
				
				xmlhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						
						update_table();
					}
				};

				
				xmlhttp.open("POST","bckgexec.php",true);
				xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xmlhttp.send( "username=" + "<?php echo $username; ?>" + 
							 "&password=" + "<?php echo $password; ?>" + 
							 "&mapname="  + curmap +
							 "&cmd=reg_solve");
			}
			
			var update_table = function() {
				xmlhttp = new XMLHttpRequest();
				
				xmlhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						
						document.getElementById("map_select_table").innerHTML = this.responseText;
					}
				};

				
				xmlhttp.open("POST","bckgexec.php",true);
				xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xmlhttp.send( "username=" + "<?php echo $username; ?>" + 
							 "&password=" + "<?php echo $password; ?>" + 
							 "&cmd=gen_map");
			}
			
			update_table();
		
		</script>
    </body>
</html>



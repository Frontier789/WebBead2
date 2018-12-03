<?php
	$submited = true;
	$username = "";
	$email = "";
	
	if(isset($_POST['username'])){ $username = $_POST['username']; } else {$submited = false;}
    if(isset($_POST['password'])){ $password = $_POST['password']; } else {$submited = false;}
	if(isset($_POST['email'])){    $email    = $_POST['email'];    } else {$submited = false;}
    
	if ($submited)
	{
		$login_data = json_decode(file_get_contents("login.json"),true);
		
		if (array_key_exists($username,$login_data))
		{
			echo "username in use";
		}
		else
		{
			if (array_key_exists($email,$login_data))
			{
				echo "email in use";
			}
			else
			{
				$login_data = array_merge(array($username => array("password" => $password, "is_email" => false, "can_del" => false, "can_make" => false)),$login_data);
				$login_data = array_merge(array($email => array("username" => $username, "is_email" => true)),$login_data);
				
				$fp = fopen('login.json', 'w');
				fwrite($fp, json_encode($login_data));
				fclose($fp);
				
				session_start();
				
				$_SESSION['username'] = $username;
				$_SESSION['password'] = $password;
				
				header("Location: game.php"); /* Redirect browser */
				exit;				
			}
		}
	}
?>



<html lang="hu">
	<head>
		<title>Regisztrálj, egyszer kell csak :)</title>
		<meta charset="UTF-8">
		<link rel="stylesheet" type="text/css" href="style.css">
	</head>
    <body>
		<a href="main.php" class="back_to_main">Vissza a főoldalra</a>
		<form name="theform" action="" method="post">
			<input type="text" value="op0" name="lstclass" style="display: none;">
			<label><b>Felhasználónév</b></label>
			<input type="text" placeholder="Felhasználónév" name="username" value="<?php echo $username; ?>" id="in_name" required>
			<p id="usernameinuse" class="op0t">A felhasználói név foglalt</p>
			
			<label><b>Email</b></label>
			<input type="email" placeholder="myemail@gmail.com" name="email" value="<?php echo $email; ?>" id="in_email" required>
			<p id="emailinuse" class="op0t">Az emailcím foglalt</p>
			
			<label><b>Jelszó</b></label>
			<input id="in_pass1" type="password" placeholder="Jelszó" name="password" class="passwfield" autocomplete="new-password" onblur="this.setAttribute('readonly', 'readonly');" onfocus="this.removeAttribute('readonly');" readonly required>
			</br>
			
			<input type="submit" id="submit_btn" value="Regisztració"></input>
			</br>
			
			<p class="reg_vs_login"> <a href="login.php">Bejelentkezés ►</p>
		</form>
		
		<p style="position: absolute; right: 10px; bottom: 0px; font-size: 0.8em; color: #cdcdcd;">by: Frontier</p>
		<script>
			
			var in_name = document.getElementById("in_name");
			var in_email = document.getElementById("in_email");
			
			in_name.focus();
			
			in_name.onpaste = function(e) {
				var clipboardData, pastedData;

				e.stopPropagation();
				e.preventDefault();
			}
			
			in_name.onkeypress = function(e) {
				var c = String.fromCharCode(e.which);
				
				if (e.charCode == 0) return true; /// avoid F keys and bck space
				
				if (in_name.value.length > 25) return false;
				
				if ("0123456789_-$[](){}<>\\/=%!:;'\"+^~?".indexOf(c) < 0 && c.toLowerCase() == c.toUpperCase())
					return false;
				
				return true;
			};
			
			in_email.onkeypress = function(e) {
				var c = String.fromCharCode(e.which);
				
				if (e.charCode == 0) return true; /// avoid F keys and bck space
				
				if (in_email.value.length > 42) return false;
				
				if ("0123456789_-.@".indexOf(c) < 0 && c.toLowerCase() == c.toUpperCase())
					return false;
				
				return true;
			};
			
			xmlhttp = new XMLHttpRequest();
			
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					
					var name_used = false;
					var mail_used = false;
					
					if (this.responseText.charAt(0) == '1') name_used = true;
					if (this.responseText.charAt(1) == '1') mail_used = true;
					
					var in_name = document.getElementById("in_name").value;
					var in_email = document.getElementById("in_email").value;
					
					var submit_btn = document.getElementById("submit_btn");
					var emailinuse = document.getElementById("emailinuse");
					var usernameinuse = document.getElementById("usernameinuse");
					
					if (name_used)
					{
						usernameinuse.style.display = "block";
						usernameinuse.classList.remove("op0t");
						usernameinuse.classList.add("op1t");
					}
					else
					{
						usernameinuse.classList.remove("op1t");
						usernameinuse.classList.add("op0t");
					}
					
					if (mail_used)
					{
						emailinuse.classList.remove("op0t");
						emailinuse.classList.add("op1t");
					}
					else
					{
						emailinuse.classList.remove("op1t");
						emailinuse.classList.add("op0t");
					}
					
					if (name_used || mail_used)
					{
						submit_btn.disabled = true;
					}
					else
					{
						submit_btn.disabled = false;
					}
				}
			};

			
			in_name.addEventListener("change",check_name);
			in_name.addEventListener("keydown",check_name);
			in_name.addEventListener("paste",check_name);
			in_name.addEventListener("input",check_name);
			
			in_email.addEventListener("change",check_name);
			in_email.addEventListener("keydown",check_name);
			in_email.addEventListener("paste",check_name);
			in_email.addEventListener("input",check_name);
			
			function check_name() {
				xmlhttp.open("POST","bckgexec.php",true);
				xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xmlhttp.send( "username=" + in_name.value + 
							 "&email="  + in_email.value +
							 "&cmd=check_avail");
			}
			
			
			check_name();
		</script>
    </body>
</html>



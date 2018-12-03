<?php
	$submited = true;
	$username = "";
	$wrongpass = "passok";

	session_start();
	if (isset($_SESSION['username']) && isset($_SESSION['password']))
	{ 
		unset($_SESSION['username']); 
		unset($_SESSION['password']);
	}
	
	if(isset($_POST['email'])){ $username = $_POST['email']; } else {$submited = false;}
    if(isset($_POST['password'])){ $password = $_POST['password']; } else {$submited = false;}
    
	if ($submited)
	{
		$login_data = json_decode(file_get_contents("login.json"),true);
		
		$user_exist = array_key_exists($username,$login_data);
		
		if ($user_exist)
		{
			if ($login_data[$username]["is_email"])
			{
				$realuser = $login_data[$username]["username"];
				
				// echo "login w/ email";
			}
			else
			{
				$realuser = $username;
			}
			
			$passtotest = $login_data[$realuser]["password"];
			
			if ($passtotest == $password)
			{
				// echo "Logged in alright";
				$_SESSION['username'] = $realuser;
				$_SESSION['password'] = $passtotest;
				$_SESSION['remember'] = true;
				
				header("Location: game.php"); /* Redirect browser */
				exit();
			}
			else
			{
				$wrongpass = "passwrong";
				// echo "Error: invalid password</br>";
			}				
		}
		else
		{
			// echo "Error: no such user";
		}
	}
?>



<html lang="hu">
	<head>
		<title>Gyorsan, jelentkezz be 😀</title>
		<meta charset="UTF-8">
		<link rel="stylesheet" type="text/css" href="style.css">
	</head>
    <body>
		<a href="main.php" class="back_to_main">Vissza a főoldalra</a>
		<form name="theform" action="" method="post">
			<label><b>Email cím</b></label>
			<input type="email" placeholder="myemail@gmail.com" name="email" value="<?php echo $username; ?>" id="in_email" required>
			
			<label><b>Jelszó</b></label>
			<input type="password" placeholder="Jelszó" name="password" class="passwfield" id="in_pass" autocomplete="new-password" onblur="this.setAttribute('readonly', 'readonly');" onfocus="this.removeAttribute('readonly');" readonly required>
			<p id="wrongpassp" class="<?php echo $wrongpass; ?>">Helytelen email vagy jelszó</p>

			<input type="submit" id="submit_btn" value="Login"></input>
			
			<input type="checkbox" checked="checked" id="remember_me"/> 
			<label for="remember_me" id="azt ne hidd hogy ez csinál valamit">Emlékezzen rám</label>
			</br>
			
			<p class="reg_vs_login"> <a class="reg_vs_login" href="register.php">Regisztráció ►</a> </p>
		</form>
		
		<p style="position: absolute; right: 10px; bottom: 0px; font-size: 0.8em; color: #cdcdcd;">by: Frontier</p>
		<script>
			
			var rem_wrong = function() {
				
				var wrongpassp = document.getElementById("wrongpassp");
				
				wrongpassp.classList.remove("passwrong");
				wrongpassp.classList.add("passok");
			}
			
			var in_email = document.getElementById("in_email");
			in_email.addEventListener("change",rem_wrong);
			in_email.addEventListener("keydown",rem_wrong);
			in_email.addEventListener("paste",rem_wrong);
			in_email.addEventListener("input",rem_wrong);
			
			var in_pass = document.getElementById("in_pass");
			in_pass.addEventListener("change",rem_wrong);
			in_pass.addEventListener("keydown",rem_wrong);
			in_pass.addEventListener("paste",rem_wrong);
			in_pass.addEventListener("input",rem_wrong);
		</script>
    </body>
</html>



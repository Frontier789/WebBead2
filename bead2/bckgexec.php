<?php 
	$login_data = json_decode(file_get_contents("login.json"),true);
	$map_data = json_decode(file_get_contents("gamestate.json"),true);
	
	// echo json_encode($login_data);
	
	// print_r($map_data);
	
	if (isset($_POST['cmd']) && isset($_POST['username']))
	{
		$cmd = $_POST['cmd'];
		$username = $_POST['username'];
		
		$user_exist = array_key_exists($username,$login_data);

		if ($cmd == "check_avail")
		{
			if ($user_exist)
			{
				echo "1";
			}
			else
			{
				echo "0";
			}

			if (isset($_POST['email']))
			{
				$email = $_POST['email'];
								
				if (array_key_exists($email,$login_data) && $login_data[$email]["is_email"])
				{
					echo "1";
				}
				else
				{
					echo "0";
				}
			}
			
			exit;
		}
		
		if ($user_exist)
		{
			if (isset($_POST['password']))
			{
				$password = $_POST['password'];
				
				$passtotest = $login_data[$username]["password"];
				
				if ($passtotest == $password)
				{
					if ($cmd == "del_map")
					{
						if ($login_data[$username]["can_del"])
						{
							if (isset($_POST['map_to_del']))
							{
								$todel = $_POST['map_to_del'];
								
								if (isset($map_data[$todel]))
								{
									unset($map_data[$todel]);
									
									$fp = fopen('gamestate.json', 'w');
									fwrite($fp, json_encode($map_data));
									fclose($fp);
								}
								else
								{
									echo "bad map name";
								}
							}
							else
							{
								echo "map_to_del is not set";
							}
						}
						else
						{
							echo "Szeretnéd, mi?";
						}
					}
					
					if ($cmd == "new_map")
					{
						if ($login_data[$username]["can_make"])
						{
							$creator = $username;
							if (isset($_POST['creator'])) { $creator = $_POST['creator']; }
							
							$map_name = "newmap" + count($map_data);
							if (isset($_POST['map_name'])) { $map_name = $_POST['map_name']; }
							
							$difficulty = 0;
							if (isset($_POST['difficulty'])) { $difficulty = $_POST['difficulty']; }
							
							if (isset($_POST['map_code']))
							{ 
								$map_code = $_POST['map_code'];
								
								$map_data = array_merge($map_data,array($map_name => array("difficulty" => $difficulty,
																						   "solved_by"  => array(),
																						   "data"       => $map_code,
																						   "created_by" => $creator)));
								
								$fp = fopen('gamestate.json', 'w');
								fwrite($fp, json_encode($map_data));
								fclose($fp);
							}
							else 
							{
								echo "error: no map_code";
							}
						}
						else
						{
							echo "Szeretnéd mi?";
						}
					}
					
					if ($cmd == "list_users")
					{
						if ($username == "admin")
						{
							print_r($login_data);
						}
						else
						{
							echo "Szeretnéd, mi?";
						}
					}
					
					if ($cmd == "get_maps")
					{
						echo json_encode($map_data);
					}
					
					if ($cmd == "reg_solve")
					{
						if(isset($_POST['mapname']))
						{
							if ($username != "guest")
							{
								$mapname = $_POST['mapname'];
								if (!in_array($username,$map_data[$mapname]["solved_by"]))
								{
									$map_data[$mapname]["solved_by"] = array_merge(array($username),$map_data[$mapname]["solved_by"]);
									
									$fp = fopen('gamestate.json', 'w');
									fwrite($fp, json_encode($map_data));
									fclose($fp);
								}								
							}
						}
						else
						{
							echo "mapname is not set";
						}
					}
					
					if ($cmd == "gen_map")
					{
						$rowCount  = 6;
						$mapPerRow = round(count($map_data) / $rowCount + 0.5);
						
						$mapsTable = array();
						
						$i = 0;
						foreach ($map_data as $name => $data)
						{
							$i++;
							$mapsTable[] = $name;
						}
						
						foreach ($map_data as $name => $data)
						{
							echo "<p style=\"display:none;\" id=\"map_";
							echo $name;
							echo "\">", $data["data"];
							echo "</p>";
						}
						
						$i = 0;
						for ($x = 0; $x < $mapPerRow; $x++) {
							echo "<tr>";
							for ($y = 0; $y < $rowCount; $y++) {
								
								if ($y * $mapPerRow + $x < count($map_data)) {
									
									$curName = $mapsTable[$y * $mapPerRow + $x];
									$cur = $map_data[$curName];
									$solved = in_array($username,$cur["solved_by"]);
									
									if (strpos($cur["data"], "su") === false || $login_data[$username]["can_make"])
									{
										echo "<td>";
										
										if ($login_data[$username]["can_del"])
										{
											if (strpos($cur["data"], "su") === false)
											{
												echo "<button class=\"del_btn\" onclick=\"sure_del(this,'", $curName, "')\">törlés</button></br>";
											}
											else
											{
												echo "<button class=\"del_btn_dis\" disabled>törlés</button></br>";
											}
										}
										
										echo "<button class=\"map_btn ";
										
										if ($solved) echo "solved_map ";
										
										echo "map_difficulty_", $cur["difficulty"], " ";
										
										echo "\" onclick=\"load_map('",$curName,"')\"/>";
										
										echo $curName, "(", $cur["difficulty"], ")";
										
										echo "<p class=\"solved_p\"";
										
										if (!$solved) echo " style=\"display:none;\"";
										
										echo ">SOLVED!</p>";
										
										echo "<div class=\"float_by\">by: ", $cur["created_by"], "</div>";
										
										echo "</button><div class=\"solvedc_p tooltip\">megoldások: <font id=\"", $curName, "_doneCount\">", count($cur["solved_by"]), "</font>";
										
										if (count($cur["solved_by"]) > 0)
										{
											echo "<span class=\"tooltiptext\">";
											$had = false;
											foreach($cur["solved_by"] as $user) {
												if ($had) echo ", ";
												echo $user;
												$had = true;
											}
											echo "</span>";
										}
										
										echo "</div></td>";
									}
								}
								
							}
							echo "</tr>";
						}
					}
				}
				else
				{
					echo "Wrong pass";
				}
			}			
		}
		else
		{
			echo "No such user";
		}
	}
	else
	{
		echo "Forbidden";
	}
?>


<?php

include_once 'config/config.php';
require 'Slim2/Slim/Slim.php';

\Slim\Slim::registerAutoloader();
 
$app = new \Slim\Slim();

/*Create the database object*/
$db = new PDO("pgsql:dbname=" . PSQL_DB . ";host=" . PSQL_HOST, PSQL_USERNAME, PSQL_PASSWORD); 

$app->get('/lga/:lgaid', function ($lgaid) use ($app, $db) {
	$q = $db->query("SELECT gid, state_code, lga_code11 AS code, lga_name11, ST_AsGeoJson(ST_Simplify(geom,0.001)) AS geom FROM lga_900913 WHERE gid = '" . $lgaid . "'");
	if($q->rowCount()>0){
	    $data = array();
		foreach($q as $row) {		    
			$result_Row = new stdClass();
		    $result_Row->gid = $row["gid"];
		    $result_Row->state_code = $row["state_code"];
		    $result_Row->code = $row["code"];
		    $result_Row->lga_name11 = $row["lga_name11"];
		    $result_Row->geom = $row["geom"];
			array_push($data, $result_Row);
		}
		
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';

		$response->body(json_encode($data));
    }
	else
	{
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';
		$rsp = new stdClass();
		$rsp->msg = "No LGA returned";
		$response->body(json_encode($rsp));	
	}
});

$app->get('/gccsa/:gccsaid', function ($gccsaid) use ($app, $db) {
	$q = $db->query("SELECT gid, gcc_code11 AS code, gcc_name11, ste_code11, ste_name11, ST_AsGeoJson(ST_Simplify(geom,0.001)) AS geom FROM gccsa_900913 WHERE gid = '" . $gccsaid . "'");
	if($q->rowCount()>0){
	    $data = array();
		foreach($q as $row) {		    
			$result_Row = new stdClass();
		    $result_Row->gid = $row["gid"];
		    $result_Row->code = $row["code"];
		    $result_Row->gcc_name11 = $row["gcc_name11"];
		    $result_Row->ste_code11 = $row["ste_code11"];
		    $result_Row->ste_name11 = $row["ste_name11"];					
		    $result_Row->geom = $row["geom"];
			array_push($data, $result_Row);
		}
		
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';

		$response->body(json_encode($data));
    }
	else
	{
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';
		$rsp = new stdClass();
		$rsp->msg = "No GCCSA returned";
		$response->body(json_encode($rsp));	
	}
});

$app->get('/suburb/:suburbid', function ($suburbid) use ($app, $db) {
	$q = $db->query("SELECT gid, ssc_code AS code, ssc_name, ST_AsGeoJson(ST_Simplify(geom,0.001)) AS geom FROM suburbs_900913 WHERE gid = '" . $suburbid . "'");
	if($q->rowCount()>0){
	    $data = array();
		foreach($q as $row) {		    
			$result_Row = new stdClass();
		    $result_Row->gid = $row["gid"];
		    $result_Row->code = $row["code"];
			$result_Row->ssc_name = $row["ssc_name"];
		    $result_Row->geom = $row["geom"];
			array_push($data, $result_Row);
		}
		
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';

		$response->body(json_encode($data));
    }
	else
	{
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';
		$rsp = new stdClass();
		$rsp->msg = "No suburb returned";
		$response->body(json_encode($rsp));	
	}
});

$app->get('/radius/:params', function($params) use ($app, $db){
    $parameter_bits = explode("&", $params);
    $parameters = new stdClass();
	foreach($parameter_bits as $bit){
        $param = explode("=", $bit);
		if($param[0] == "geocode"){
		    if(strpos($param[1], ",")>-1){
		        $parameters->{$param[0]} = explode(",", $param[1]); 
		    }		
		}
		else
		{
		
		    switch($param[1]){
			    case "lga":
				    $parameters->{$param[0]} = "lga_900913";
				break;
				case "sub":
				    $parameters->{$param[0]} = "suburbs_900913";
				break;
				case "gccsa":
				    $parameters->{$param[0]} = "gccsa_900913";
				break;
				default:
			        $parameters->{$param[0]} = $param[1];	
			}
		}	
	}
	
    switch($parameters->layer){
		case "lga_900913":
		    $sql = "SELECT gid, lga_name11 AS name, lga_code11 AS code, ST_AsGeojson(ST_Simplify(geom,0.001)) AS geom FROM " . $parameters->layer . " WHERE ST_Intersects(geom,ST_Buffer(ST_MakePoint(" . $parameters->geocode[1] . "," . $parameters->geocode[0] . ")::geography," . $parameters->radius . ")::geometry)";
		break;
		case "suburbs_900913":
		    $sql = "SELECT gid, ssc_name AS name, ssc_code AS code, ST_AsGeojson(ST_Simplify(geom,0.001)) AS geom FROM " . $parameters->layer . " WHERE ST_Intersects(geom,ST_Buffer(ST_MakePoint(" . $parameters->geocode[1] . "," . $parameters->geocode[0] . ")::geography," . $parameters->radius . ")::geometry)";
		break;
		case "gccsa_900913":
		    $sql = "SELECT gid, gcc_name11 AS name, gcc_code11 AS code, ST_AsGeojson(ST_Simplify(geom,0.001)) AS geom FROM " . $parameters->layer . " WHERE ST_Intersects(geom,ST_Buffer(ST_MakePoint(" . $parameters->geocode[1] . "," . $parameters->geocode[0] . ")::geography," . $parameters->radius . ")::geometry)";
		break;	
	}	
	
	//$q = $db->query("SELECT * FROM " . $parameters->layer . " WHERE ST_Intersects(geom, ST_Buffer(ST_MakePoint(" . $parameters->geocode[1] . "," . $parameters->geocode[0] . ")::geography, " . $parameters->radius . ")::geometry)");
	$q = $db->query($sql);	
	if($q->rowCount()>0){
		$data = array();
		foreach($q as $row) {		    
			$result_Row = new stdClass();
		    $result_Row->gid = $row["gid"];	
            $result_Row->name = $row["name"];
            $result_Row->code = $row["code"];			
			$result_Row->geom = $row["geom"];	
			array_push($data, $result_Row);
		}
		
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';

		$response->body(json_encode($data));		
    }
    else
    {
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';
		$rsp = new stdClass();
		$rsp->msg = "No areas within selected radius";
		$response->body(json_encode($rsp));		
    }	
});

$app->get('/aggregate/:comparison/:target', function ($comparison, $target) use ($app, $db) {
		
		$reply = new stdClass();
		$reply->stats = new stdClass();
		$reply->stats->comparison = calculateStats($comparison, $db);
		$reply->stats->target = calculateStats($target, $db);
		
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';

		$response->body(json_encode($reply, JSON_PRETTY_PRINT));
});

$app->get('/comparison/aggregate/:codes', function ($codes) use ($app, $db) {
		$responseData = new stdClass();
		$responseData->population = null;
		$responseData->householdnum = null;
		$responseData->householdsizeavg = null;
		
		$responseData->age = null;
		$responseData->pbedroom = null;

		$responseData->age04 = null;
		$responseData->age514 = null;
		$responseData->age1519 = null;
		$responseData->age2024 = null;
		$responseData->age2534 = null;
		$responseData->age3544 = null;
		$responseData->age4554 = null;
		$responseData->age5564 = null;
		$responseData->age6574 = null;
		$responseData->age7584 = null;
		$responseData->age85 = null;

		$responseData->age04percpop = null;
		$responseData->age514percpop = null;
		$responseData->age1519percpop = null;
		$responseData->age2024percpop = null;
		$responseData->age2534percpop = null;
		$responseData->age3544percpop = null;
		$responseData->age4554percpop = null;
		$responseData->age5564percpop = null;
		$responseData->age6574percpop = null;
		$responseData->age7584percpop = null;
		$responseData->age85percpop = null;		
		
		$regionids = json_decode($codes);
		$regionids_parsed = array();
		
		foreach($regionids as $area){
		    switch(strtolower($area->type)){
			    case "lga":
				    array_push($regionids_parsed, "'LGA" . $area->code . "'");
				break;
				case "aac":
				    array_push($regionids_parsed, "'SSC" . $area->code . "'");
				break;
				default:
				    array_push($regionids_parsed, "'" . $area->code . "'");				
			}
			
		}

		$q = $db->query("SELECT  * FROM tda_stat_demo WHERE regionid IN (" . implode(",", $regionids_parsed) . ")");
		
		if($q->rowCount()>0){
		    
			$sum_couplefamwochildren = null;
			$sum_couplefamwchildren = null;
			$sum_onepfamily = null;
			$sum_otherfamily = null;
			$sum_lphousehold = null;
			
			$sumproduct_avghousehold = null;
			$sumproduct_age = null;
			$sumproduct_pbedroom = null;
			$sumproduct_pincome = null;
			$sumproduct_fincome = null;
			$sumproduct_hhincome = null;
			$sumproduct_mgpaymt = null;
			$sumproduct_rent = null;
			
			foreach($q as $row){
			    $responseData->population += intval($row["B3"]);
                $responseData->householdnum += intval($row["B5109"]);
				$responseData->age04 += intval($row["B6"]);
				$responseData->age514 += intval($row["B9"]);
				$responseData->age1519 += intval($row["B12"]);
				$responseData->age2024 += intval($row["B15"]);
				$responseData->age2534 += intval($row["B18"]);
				$responseData->age3544 += intval($row["B21"]);
				$responseData->age4554 += intval($row["B24"]);
				$responseData->age5564 += intval($row["B27"]);
				$responseData->age6574 += intval($row["B30"]);
				$responseData->age7584 += intval($row["B33"]);
				$responseData->age85 += intval($row["B36"]);					
				
				/*Calculating avg household size*/				
				$sumproduct_avghousehold += floatval((floatval($row["B116"]) * floatval($row["B5109"])));
				$sumproduct_age += floatval((intval($row["B3"]) * floatval($row["B109"])));
				$sumproduct_pbedroom += floatval((floatval($row["B114"]) * floatval($row["B5109"])));
				$sumproduct_pincome += floatval((floatval($row["B111"]) * floatval($row["B5109"])));
				$sumproduct_fincome += floatval((floatval($row["B113"]) * floatval($row["B5109"])));
				$sumproduct_hhincome += floatval((floatval($row["B115"]) * floatval($row["B5109"])));
				$sumproduct_mgpaymt += floatval((floatval($row["B110"]) * floatval($row["B5109"])));
				$sumproduct_rent += floatval((floatval($row["B112"]) * floatval($row["B5109"])));
				
				$sum_couplefamwochildren += floatval($row["B4822"]);
				$sum_couplefamwchildren += floatval($row["B4842"]);
				$sum_onepfamily += floatval($row["B4862"]);
				$sum_otherfamily += floatval($row["B4864"]);
				$sum_lphousehold  += floatval($row["B4657"]);
				
			}	
			
			$responseData->householdsizeavg = floatval($sumproduct_avghousehold/$responseData->householdnum);
			$responseData->age = floatval(floatval($sumproduct_age) / $responseData->population);
			$responseData->pbedroom = floatval(floatval($sumproduct_pbedroom) / $responseData->householdnum);
			$responseData->pincome = floatval(floatval($sumproduct_pincome) / $responseData->householdnum);
			$responseData->fincome = floatval(floatval($sumproduct_fincome) / $responseData->householdnum);
			$responseData->hhincome = floatval(floatval($sumproduct_hhincome) / $responseData->householdnum);
			$responseData->mgpaymt = ((floatval(floatval($sumproduct_mgpaymt) / $responseData->householdnum))*12)/52;
			$responseData->mgpaymt_hhperc = $responseData->mgpaymt/$responseData->hhincome;
			$responseData->rent = floatval(floatval($sumproduct_rent) / $responseData->householdnum);
			$responseData->rent_hhperc =  $responseData->rent/$responseData->hhincome;
			
			$responseData->age04percpop = ($responseData->age04 / $responseData->population)*100;
			$responseData->age514percpop = ($responseData->age514 / $responseData->population)*100;
			$responseData->age1519percpop = ($responseData->age1519 / $responseData->population)*100;
			$responseData->age2024percpop = ($responseData->age2024 / $responseData->population)*100;
			$responseData->age2534percpop = ($responseData->age2534 / $responseData->population)*100;
			$responseData->age3544percpop = ($responseData->age3544 / $responseData->population)*100;
			$responseData->age4554percpop = ($responseData->age4554 / $responseData->population)*100;
			$responseData->age5564percpop = ($responseData->age5564 / $responseData->population)*100;
			$responseData->age6574percpop = ($responseData->age6574 / $responseData->population)*100;
			$responseData->age7584percpop = ($responseData->age7584 / $responseData->population)*100;
			$responseData->age85percpop = ($responseData->age85 / $responseData->population)*100;
			
			$responseData->coupleFamilyWoChildren = $sum_couplefamwochildren / $responseData->householdnum;
			$responseData->coupleFamilyWChildren = $sum_couplefamwchildren / $responseData->householdnum;
			$responseData->oneParentFamily = $sum_onepfamily / $responseData->householdnum;
			$responseData->lonePersonHousehold = $sum_lphousehold / $responseData->householdnum;
			
		}		
		
		$response = $app->response();
		$response->setStatus(200);
		$response['Content-Type'] = 'application/json';

		$response->body(json_encode($responseData, JSON_PRETTY_PRINT));
});

$app->run();
 
 
function calculateStats($codes, $db){
		$responseData = new stdClass();
		$responseData->population = new stdClass();
		$responseData->population->text = "Population";
		$responseData->population->amt = null;		
		
		$responseData->householdnum = new stdClass();
		$responseData->householdnum->amt = null;
		$responseData->householdnum->text = "Number of households";
		
		$responseData->householdsizeavg = new stdClass();
		$responseData->householdsizeavg->amt = null;
		$responseData->householdsizeavg->text = "Average household size";
		
		
		$responseData->age = new stdClass();
		$responseData->age->amt = null;
		$responseData->age->text = "Age";
		
		$responseData->pbedroom = new stdClass();
		$responseData->pbedroom->amt = null;
		$responseData->pbedroom->text = "Persons per bedroom";
		
		$responseData->pincome = new stdClass();
		$responseData->pincome->amt = null;;
		$responseData->pincome->text = "Personal income";
		
        $responseData->fincome = new stdClass();
		$responseData->fincome->amt = null;
		$responseData->fincome->text = "Family income";
		
		$responseData->hhincome = new stdClass();
		$responseData->hhincome->amt = null;
		$responseData->hhincome->text = "Household income";
		
		
		$responseData->mgpaymt = new stdClass();
		$responseData->mgpaymt->amt = null;
		$responseData->mgpaymt->text = "Mortgage payment";
		
		$responseData->mgpaymt_hhperc = new stdClass();
		$responseData->mgpaymt_hhperc->amt = null;
		$responseData->mgpaymt_hhperc->text = "Mortgage payment as % of household income";
		
		$responseData->rent = new stdClass();
		$responseData->rent->amt = null;
		$responseData->rent->text = "Rent";
		
		$responseData->rent_hhperc = new stdClass();		
		$responseData->rent_hhperc->amt = null;		
		$responseData->rent_hhperc->text = "Rent as % of household income";		

		$responseData->age04 = new stdClass();
		$responseData->age04->amt = null;
		$responseData->age04->text = "Age 0-4";
		
		$responseData->age514 = new stdClass();
		$responseData->age514->amt = null;
		$responseData->age514->text = "Age 5-14";
		
		$responseData->age1519 = new stdClass();
		$responseData->age1519->amt = null;
		$responseData->age1519->text = "Age 15-19";
		
		$responseData->age2024 = new stdClass();
		$responseData->age2024->amt = null;
		$responseData->age2024->text = "Age 20-24";
		
		$responseData->age2534 = new stdClass();
		$responseData->age2534->amt = null;
		$responseData->age2534->text = "Age 25-34";
		
		$responseData->age3544 = new stdClass();
		$responseData->age3544->amt = null;
		$responseData->age3544->text = "Afe 35-44";
		
		$responseData->age4554 = new stdClass();
		$responseData->age4554->amt = null;
		$responseData->age4554->text = "Age 45-54";
		
		$responseData->age5564 = new stdClass();
		$responseData->age5564->amt = null;
		$responseData->age5564->text = "Age 55-64";
		
		$responseData->age6574 = new stdClass();
		$responseData->age6574->amt = null;
		$responseData->age6574->text = "Age 65-74";
		
		$responseData->age7584 = new stdClass();
		$responseData->age7584->amt = null;
		$responseData->age7584->text = "Age 75-84";
		
		$responseData->age85 = new stdClass();
		$responseData->age85->amt = null;
		$responseData->age85->text = "Age >85";
		

		$responseData->age04percpop = new stdClass();
		$responseData->age04percpop->amt = null;
		$responseData->age04percpop->text = "as % of total population Age 0-4";
		
		$responseData->age514percpop = new stdClass();
		$responseData->age514percpop->amt = null;
		$responseData->age514percpop->text = "as % of total population Age 5-14";
		
		$responseData->age1519percpop = new stdClass();
		$responseData->age1519percpop->amt = null;
		$responseData->age1519percpop->text = "as % of total population Age 15-19";
		
		$responseData->age2024percpop = new stdClass();
		$responseData->age2024percpop->amt = null;
		$responseData->age2024percpop->text = "as % of total population Age 20-24";
		
		$responseData->age2534percpop = new stdClass();
		$responseData->age2534percpop->amt = null;
		$responseData->age2534percpop->text = "as % of total population Age 25-34";
		
		$responseData->age3544percpop = new stdClass();
		$responseData->age3544percpop->amt = null;
		$responseData->age3544percpop->text = "as % of total population Age 35-44";
		
		$responseData->age4554percpop = new stdClass();
		$responseData->age4554percpop->amt = null;
		$responseData->age4554percpop->text = "as % of total population Age 45-54";
		
		$responseData->age5564percpop = new stdClass();
		$responseData->age5564percpop->amt = null;
		$responseData->age5564percpop->text = "as % of total population Age 55-64";
		
		$responseData->age6574percpop = new stdClass();
		$responseData->age6574percpop->amt = null;
		$responseData->age6574percpop->text = "as % of total population Age 65-74";
		
		$responseData->age7584percpop = new stdClass();
		$responseData->age7584percpop->amt = null;
		$responseData->age7584percpop->text = "as % of total population Age 75-84";
		
		$responseData->age85percpop = new stdClass();
		$responseData->age85percpop->amt = null;		
		$responseData->age85percpop->text = "as % of total population Age >85";	
		
		
		$regionids = json_decode($codes);
		$regionids_parsed = array();
		
		foreach($regionids as $area){
		    switch(strtolower($area->type)){
			    case "lga":
				    array_push($regionids_parsed, "'LGA" . $area->code . "'");
				break;
				case "ssc":
				    array_push($regionids_parsed, "'SSC" . $area->code . "'");
				break;
				default:
				    array_push($regionids_parsed, "'" . $area->code . "'");				
			}
			
		}

		$q = $db->query("SELECT  * FROM tda_stat_demo WHERE regionid IN (" . implode(",", $regionids_parsed) . ")");

		if($q->rowCount()>0){
		    
			$sum_couplefamwochildren = null;
			$sum_couplefamwchildren = null;
			$sum_onepfamily = null;
			$sum_otherfamily = null;
			$sum_lphousehold = null;
			
			$sumproduct_avghousehold = null;
			$sumproduct_age = null;
			$sumproduct_pbedroom = null;
			$sumproduct_pincome = null;
			$sumproduct_fincome = null;
			$sumproduct_hhincome = null;
			$sumproduct_mgpaymt = null;
			$sumproduct_rent = null;
			
			foreach($q as $row){
			    $responseData->population->amt += intval($row["B3"]);
                $responseData->householdnum->amt += intval($row["B5109"]);
				$responseData->age04->amt += intval($row["B6"]);
				$responseData->age514->amt += intval($row["B9"]);
				$responseData->age1519->amt += intval($row["B12"]);
				$responseData->age2024->amt += intval($row["B15"]);
				$responseData->age2534->amt += intval($row["B18"]);
				$responseData->age3544->amt += intval($row["B21"]);
				$responseData->age4554->amt += intval($row["B24"]);
				$responseData->age5564->amt += intval($row["B27"]);
				$responseData->age6574->amt += intval($row["B30"]);
				$responseData->age7584->amt += intval($row["B33"]);
				$responseData->age85->amt += intval($row["B36"]);					
				
				/*Calculating avg household size*/				
				$sumproduct_avghousehold += floatval((floatval($row["B116"]) * floatval($row["B5109"])));
				$sumproduct_age += floatval((intval($row["B3"]) * floatval($row["B109"])));
				$sumproduct_pbedroom += floatval((floatval($row["B114"]) * floatval($row["B5109"])));
				$sumproduct_pincome += floatval((floatval($row["B111"]) * floatval($row["B5109"])));
				$sumproduct_fincome += floatval((floatval($row["B113"]) * floatval($row["B5109"])));
				$sumproduct_hhincome += floatval((floatval($row["B115"]) * floatval($row["B5109"])));
				$sumproduct_mgpaymt += floatval((floatval($row["B110"]) * floatval($row["B5109"])));
				$sumproduct_rent += floatval((floatval($row["B112"]) * floatval($row["B5109"])));
				
				$sum_couplefamwochildren += floatval($row["B4822"]);
				$sum_couplefamwchildren += floatval($row["B4842"]);
				$sum_onepfamily += floatval($row["B4862"]);
				$sum_otherfamily += floatval($row["B4864"]);
				$sum_lphousehold  += floatval($row["B4657"]);
				
			}	
			
			$responseData->householdsizeavg->amt = floatval($sumproduct_avghousehold/$responseData->householdnum->amt);
			$responseData->age->amt = floatval(floatval($sumproduct_age) / $responseData->population->amt);
			$responseData->pbedroom->amt = floatval(floatval($sumproduct_pbedroom) / $responseData->householdnum->amt);
			$responseData->pincome->amt = floatval(floatval($sumproduct_pincome) / $responseData->householdnum->amt);
			$responseData->fincome->amt = floatval(floatval($sumproduct_fincome) / $responseData->householdnum->amt);
			$responseData->hhincome->amt = floatval(floatval($sumproduct_hhincome) / $responseData->householdnum->amt);
			$responseData->mgpaymt->amt = ((floatval(floatval($sumproduct_mgpaymt) / $responseData->householdnum->amt))*12)/52;
			$responseData->mgpaymt_hhperc->amt = $responseData->mgpaymt->amt/$responseData->hhincome->amt;
			$responseData->rent->amt = floatval(floatval($sumproduct_rent) / $responseData->householdnum->amt);
			$responseData->rent_hhperc->amt =  $responseData->rent->amt/$responseData->hhincome->amt;
			
			$responseData->age04percpop->amt = ($responseData->age04->amt / $responseData->population->amt)*100;
			$responseData->age514percpop->amt = ($responseData->age514->amt / $responseData->population->amt)*100;
			$responseData->age1519percpop->amt = ($responseData->age1519->amt / $responseData->population->amt)*100;
			$responseData->age2024percpop->amt = ($responseData->age2024->amt / $responseData->population->amt)*100;
			$responseData->age2534percpop->amt = ($responseData->age2534->amt / $responseData->population->amt)*100;
			$responseData->age3544percpop->amt = ($responseData->age3544->amt / $responseData->population->amt)*100;
			$responseData->age4554percpop->amt = ($responseData->age4554->amt / $responseData->population->amt)*100;
			$responseData->age5564percpop->amt = ($responseData->age5564->amt / $responseData->population->amt)*100;
			$responseData->age6574percpop->amt = ($responseData->age6574->amt / $responseData->population->amt)*100;
			$responseData->age7584percpop->amt = ($responseData->age7584->amt / $responseData->population->amt)*100;
			$responseData->age85percpop->amt = ($responseData->age85->amt / $responseData->population->amt)*100;
			
			$responseData->coupleFamilyWoChildren = new stdClass();
			$responseData->coupleFamilyWoChildren->amt = $sum_couplefamwochildren / $responseData->householdnum->amt;
			$responseData->coupleFamilyWoChildren->text = "Couple family without children";
			
			$responseData->coupleFamilyWChildren = new stdClass();
			$responseData->coupleFamilyWChildren->amt = $sum_couplefamwchildren / $responseData->householdnum->amt;
			$responseData->coupleFamilyWChildren->text = "Couple family with children";
			
			$responseData->oneParentFamily = new stdClass();
			$responseData->oneParentFamily->amt = $sum_onepfamily / $responseData->householdnum->amt;
			$responseData->oneParentFamily->text = "One parent family";
			
			
			$responseData->lonePersonHousehold = new stdClass();
			$responseData->lonePersonHousehold->amt = $sum_lphousehold / $responseData->householdnum->amt;
            $responseData->lonePersonHousehold->text = "Lone person household";
			
			return $responseData;
		}
		else
		{
		    return new stdClass();
		}
} 
 
?>
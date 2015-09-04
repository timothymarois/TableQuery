<?php

// lets declare our header as JSON
header('content-type: application/json');

// required for sorting (default using _GET)
$sort            = (isset($_GET['sort']) && $_GET['sort']) ? $_GET['sort'] : array();
$sortcol         = (isset($sort['col']) && $sort['col']!='') ? $sort['col'] : '';
$sortby          = (isset($sort['dir']) && $sort['dir']!='') ? $sort['dir'] : 'asc';

// optional use (for filtering and limiting results)
$limit           = (isset($_GET['limit']) && $_GET['limit']!='') ? $_GET['limit'] : 10;
$search          = (isset($_GET['search']) && $_GET['search']!='') ? $_GET['search'] : '';

// initialize the total counters
$total_items = 0;
$total_items_filtered = 0;
$total_items_displayed = 0;
// are we filtering the results? 
// filtered results should declare true, otherwise declare false
$results_filtered = false;


// our data array (normally this will be given by a database)
$data = array();
$data[] = array('name'=>'Car Loan','monthly'=>160);
$data[] = array('name'=>'Car Insurance','monthly'=>66);
$data[] = array('name'=>'Rent','monthly'=>800);
$data[] = array('name'=>'Healthcare','monthly'=>140);
$data[] = array('name'=>'Credit Card','monthly'=>70);
$data[] = array('name'=>'Gym Membership','monthly'=>16);
foreach($data as $d) {

	// count how many items we have in total
	$total_items++;

	$d['daily']  = round($d['monthly']/30.4368,2);
	$d['yearly'] = round($d['monthly']*12,2);

	// how many items we have after being filtered
	$total_items_filtered++;

	// create each row (after being filtered)
  $rows[] = $d;
}

$display_rows = array();
if (count($rows) > 0) {

	if (isset($sortcol) && $sortcol!='') {
		$sortc = array();
		foreach($rows as $sortarray) {
			if (!isset($sortarray[ $sortcol ])) continue;
		  // lets remove common symbols
		  $sortc[] = str_replace(array('$',',','%'),'',$sortarray[ $sortcol ]);
		}

		// choose our sorting. ASC/DESC and do we need to sort natrually.
	  array_multisort(($sortc), (($sortby==='asc') ? SORT_ASC : SORT_DESC), SORT_NATURAL, $rows);
  	unset($sortc);
  }

  foreach($rows as $p=>$k) {
  	// how many items are we sending to the display
  	$total_items_displayed++;
  	$display_rows[] = $k;

  	// stop once we hit our limit of items
  	if ($limit == $total_items_displayed) break;
  }
}

$output = array(
	"itemsTotal"      => intval($total_items),
	"itemsFiltered"   => intval($total_items_filtered),
	"itemsDisplayed"  => intval($total_items_displayed),
	"resultsFiltered" => $results_filtered,
	"filteredTotal"   => (isset($filtered_total) ? $filtered_total : array()),
	"filteredItems"   => array(),
	"rows"            => (isset($display_rows) && is_array($display_rows)) ? $display_rows : array());


// send our json output
print json_encode($output);

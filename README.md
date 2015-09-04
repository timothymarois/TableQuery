TableQuery
==========

a jQuery plugin that communicates with the server and displays table content. 
This provides the table frame work to sort and filter the data.

Current Example of API features. I will complete this readme once I have some extra time. 
This jQuery plug-in is built for AJAX (server-side) data loading. 
TableQuery does not do the actual sorting of columns. The server sends the proper order that will be displayed. 
It is built for speed, and simplistic coding for efficiency.

JSON (return)
--
TableQuery needs the server to respond with JSON request, format as follows.

"row" being the most important array for TableQuery to create the content of each row
followed by each Column name. (must match the column attributes, the order doesn't matter, the names do)

```json

{
  "itemsTotal":2,
  "itemsFiltered":2,
  "itemsDisplayed":2,
  "rows":[
    {"first_name":"John","last_name":"Smith","date":"05-22-88"},
    {"first_name":"Mike","last_name":"Bay","date":"03-10-78"}
  ]
}

```

HTML Table
--

```html

<!-- COLUMN HEADER ATTRIBUTES (all are optional except "colname")
     ============================
   "colname"        = name of the column (must match json array)
   "colclass"       = default:empty add a CSS class to the whole column
   "colsort"        = default:asc sort this column by (ASC) or (DESC) [sets the default sortby] or "false" to disable sorting
   "colsortdefault" = default:false - sort this column by default on load (if no column specified, sort first available column.)
   "coldefault"     = default:empty - value if missing from server return like "$0.00" 
   "colvisible"     = default:true - false to hide column on load.
-->

<table id="example">
 <thead>
  <tr>
   <th colname="first_name" colsort="asc">First Name</th>
   <th colname="last_name"  colsort="asc"     colsortdefault="true">last Name</th>
   <th colname="date"       colclass="aright" colvisible="false">Date of Birth</th>
  </tr>
 </thead>
</table>
      
```

Javascript
--

```javascript

var tableQuery = $('#example').tableQuery({
  // file to request JSON data
  url:'/server-request.php',
  // POST (form) or GET (url param) request
  type:'POST',
  // everything sent in the filter, is sent to server as POST or GET filter[] array
  // such as filter['limit'] (how many results to return) 
  filter:{
    limit:50,
    search:''
  },
  beforeSend: function() {
    // if you want to do anything before the server is complete
    // such as start a loading bar?
  },
  success : function (d) {
    // any extra javascript you want to fire after table is loaded
  },
  error : function (xhr,error,thrown) {
    // if server request fails, error is thrown here
  }
});

  ```
  
  
TableQuery Javascript API
---
```javascript

  // reloads the table (sends ajax request and updates the data)
  tableQuery.reload();
  
  // abort current request. This allows you to cancel long requests, 
  // and is used when reloading or requesting a new table
  tableQuery.abort();
  
  // send filter changes using this function
  // it does not reload the table, so after you change all filters,
  // request a reload
  tableQuery.filter({test:123});
  
  // returns all filters as an object
  // when accessing all filters, be sure to send {} as the param since we are not "setting" a new filter.
  tableQuery.filter({}).name_of_filter_value
  
  
  // Show / Hide Columns
  // you can add as many columns as you wish within the array,
  // the names must match the column names "colname"
  
  // displays the column in view
  tableQuery.show(['date']);
  // hides the column in view
  tableQuery.hide(['last_name']);
  
  
  // if something isn't right, redraw the table. 
  // if changes in the html have changed from your own application,
  // you may need to tell tableQuery to draw up new columns
  // this does not request server, it only restructures the html.
  tableQuery.redraw();

```


PHP Example (the POST variables) 
---
```PHP

  // sorting variables
  $sort         = (isset($_POST['sort'])) ? $_POST['sort'] : array();
  // column to sort
  $sortcol      = (isset($sort['col']) && $sort['col']!='') ? $sort['col'] : '';
  // direction to sort (ASC or DESC)
  $sortby       = (isset($sort['dir']) && $sort['dir']!='') ? $sort['dir'] : 'asc';

  // how many results to display
  $limit        = (isset($_POST['limit']) && $_POST['limit']!='') ? $_POST['limit'] : 50;
  // custom search... and any other custom filters I want to send
  $search       = (isset($_POST['search']) && $_POST['search']!='') ? strtolower($_POST['search']) : '';

```
  
  

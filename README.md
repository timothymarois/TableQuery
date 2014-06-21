TableQuery
==========

a jQuery plugin that communicates with the server and displays sortable table data.


Current Example of API features. I will complete this readme once I have some extra time. 
This jQuery plug-in is built for AJAX (server-side) data loading. 
TableQuery does not do the actual sorting of columns. The server sends the proper order that will be displayed. 
It is built for speed, and simplistic coding for efficiency.


JSON
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
    {"first_name":"John","last_name":"Smith","birth":"05-22-88"},
    {"first_name":"Mike","last_name":"Bay","birth":"03-10-78"}, 
  ]
}

```

HTML Table
--

```html

<!-- COLUMN HEADER ATTRIBUTES
     ============================

   "colname"    = name of the column (must match json array)
   "colclass"   = add a class to the "whole" column
   "colsort"    = sort this column by (ASC) or (DESC) [sets the default sortby] or (false) disable sorting
   "coldefault" = (true) sort this column by default on load
   "colvisible" = (false) to hide column on load
-->

<table id="example">
 <thead>
  <tr>
   <th colname="first_name" colsort="asc">First Name</th>
   <th colname="last_name" colsort="asc" coldefault="true">last Name</th>
   <th colname="birth" colclass="aright" colvisible="false">Date of Birth</th>
  </tr>
 </thead>
</table>
      
```

Javascript
--

```javascript

var qtable = $('#example').tableQuery({
  // file to request JSON data
  url:'/myfile.php',
  // POST (form) or GET (url param) request
  type:'POST',
  // everything sent in the filter, is sent to server as POST or GET filter[] array
  // such as filter['limit'] (how many results to return) 
  filter:{
    limit:50,
    search:''
  },
  addons : {
    // fixed header keeps the table <THEAD> always fixed and never scrolls off screen
    fixedHeader: true
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
  
  
TableQuery API
---
```javascript

  // reloads the table (sends ajax request and updates the data)
  qtable.reload();
  
  // send filter changes using this function
  // it does not reload the table, so after you change all filters,
  // request a reload
  qtable.filter({test:123});
  
  // Show / Hide Columns
  // you can add as many columns as you wish within the array,
  // the names must match the column names .show() and .hide() 
  
  // displays the column instantly
  qtable.show(['birth']);
  // hides the column instantly
  qtable.hide(['last_name']);
  
  // if something isn't right, redraw the table. 
  // if changes in the html have changed from your own application,
  // you may need to tell tableQuery to draw up new columns
  // this does not request server
  qtable.draw();

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
  
  // filter array
  $filter       = (isset($_POST['filter'])) ? $_POST['filter'] : array();
  // how many results to display
  $limit        = (isset($filter['limit']) && $filter['limit']!='') ? $filter['limit'] : 10;
  // custom search... and any other custom filters I want to send
  $search       = (isset($filter['search']) && $filter['search']!='') ? strtolower($filter['search']) : '';

```
  
  

TableQuery v1.0.0
==========

a jQuery plugin that communicates with the server and displays sortable table data.


Current Example of API features. I will complete this readme once I have some extra time. 
This jQuery plug-in is built for AJAX (server-side) data loading. 
TableQuery does not do the actual sorting of columns. The server sends the proper order that will be displayed. 
It is built for speed, and simplistic coding for efficiency.


JSON
--

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

<!--COLUMN HEADER ATTRIBUTES

   "colname"    = name of the column (must match json array)
   "colclass"   = add a class to the "whole" column
   "colsort"    = sort this column by (ASC) or (DESC) [sets the default sortby] or (false) disable sorting
   "coldefault" = (true) sort this column by default on load
   "colvisible" = (false) to hide column on load

  -->

<table id="example" cellspacing="0" style="margin-top:30px">
        <thead>
          <tr>
            <th colname="first_name" colsort="asc">First Name</th>
            <th colname="last_name" colsort="asc" coldefault="true">last Name</th>
            <th colname="birth" colclass="aright" colvisible="false">Date of Birth</th>
            </tr>
          </thead>
        </table>
      </div>
```

Javascript
--

```javascript

var qtable = $('#example').tableQuery({
    url:'/myfile.php',
    type:'POST',
    filter:{
      limit:50,
      search:''
    },
    addons : {
      fixedHeader: true
    },
    success : function (d) {
      
    },
    error : function (xhr,error,thrown) {
      
    }
  });

  ```
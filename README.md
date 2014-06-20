TableQuery
==========

a jQuery plugin that communicates with the server and displays sortable table data.



Current Example of API features. I will complete this readme once I have some extra time. 


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
            <th colname="last_name" colclass="aright" colvisible="false">Date of Birth</th>
            </tr>
          </thead>
        </table>
      </div>
```

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
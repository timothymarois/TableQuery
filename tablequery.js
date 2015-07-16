/* 

@project: tableQuery < tablequery.com >
@version: 1.1.4
@author: Timothy Marois < timothymarois.com >

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

(function($){


  /**
   * createColumnContent()
   * - create columns (on rows)
   *
   * @param o : column in which the table is 
   * @param d : data of td column 
   * @param c : Class to add to each td column
   */
  function _createColumns(o,d,c,n,h,ty) {
    var td = document.createElement(ty);
    if (n!='') td.setAttribute('colname',n); 
    if (c!='') td.className = c;
    if (h===true) td.style.display = 'none';
    td.innerHTML = d;
    o.appendChild(td);
  };



  /**
   * createColumnContent()
   * - create columns (on rows)
   *
   * @param o : column in which the table is 
   * @param d : data of td column 
   * @param c : Class to add to each td column
   */
  function _createTableBody(sel,table) {
    // remove the total bar if exists
    if ($('.thtotalrow')) $(".thtotalrow").remove();
    // find the table body
    var rtbody = table.getElementsByTagName('TBODY')[0];
    // remove existing tbody (for a clean build)
    if (rtbody) $(sel+" tbody").remove();
    // create the tbody
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
  };



  /**
   * createTableContent()
   * - create all the rows in the table
   *
   * @param : sel (table selector)
   * @param : table (table selector) 
   * @param : thead (header column properties)
   * @param : json (the table content)
   */
  function _createRows(sel,table,thead,settings) {

    if (settings.json===undefined) return false;

    var rtbody = table.getElementsByTagName('TBODY')[0];
    var rthead = table.getElementsByTagName('THEAD')[0];

    if (settings.json.filteredTotal!==undefined && Object.keys(settings.json.filteredTotal).length > 0) {
      var hrow = document.createElement('tr');
      hrow.className = 'thtotalrow';

      for (var key in thead) {
        var obj = thead[key];
        if (obj.hasOwnProperty('name')) {
            var h = false;
            if (obj.hasOwnProperty('visible') && obj['visible']==='false') {
              h = true;
            }
            var addClass = "";
            if (obj.hasOwnProperty('class') && obj['class']!==undefined) addClass += obj['class'];
            if (obj.hasOwnProperty('sorting') && obj['sorting']===true) addClass += ' sorting';
            var content = settings.json.filteredTotal[obj['name']];
            if (content===undefined) {
              content = '';
              if (obj.hasOwnProperty('default')) {
                content = obj['default'];
              }
            }

            _createColumns(hrow,content,addClass,obj['name'],h,'th');
          }
        }

      // append each row
      rthead.appendChild(hrow);
    }


    // create rows
    for(i=0; i<settings.json.rows.length; i++){
      var row = document.createElement('tr');
      for (var key in thead) {
        var obj = thead[key];
        if (obj.hasOwnProperty('name')) {
          // column has been hidden (by default)
          // if (obj.hasOwnProperty('visible') && obj['visible']==='false') continue;
          // lets still create hidden rows, but choose to hide them from view
          var h = false;
          if (obj.hasOwnProperty('visible') && obj['visible']==='false') {
            h = true;
          }
          // add class to column
          var addClass = "";
          if (obj.hasOwnProperty('class') && obj['class']!==undefined) addClass += obj['class'];
          if (obj.hasOwnProperty('sorting') && obj['sorting']===true) addClass += ' sorting';

          var content = settings.json.rows[i][obj['name']];
          if (content===undefined) {
            content = '';
            if (obj.hasOwnProperty('default')) {
              content = obj['default'];
            }
          }
          _createColumns(row,content,addClass,obj['name'],h,'td');
        }
      }

      // append each row
      rtbody.appendChild(row);
    }
  };


  var TableQuery;


  /**
   * TableQuery call function
   * $(selector).tableQuery();
   *
   * @param: options
   */
  $.fn.TableQuery = function( options ){
    var self = this;
    var selector = this.selector.replace('#','');
    var table = document.getElementById(selector);

    var settings = {
      complete : {
        sort:false
      },
      request : 0,
      running : false,
      ajax : {},
      filter : {
        limit : 50,
        search : '',
        sort : {
          col:'',
          dir:'asc'
        }
      },
      debug : false,
      inputSearch : '',
      saveSort : true,
      beforeSend : function () { },
      success : function () { },
      error : function () { }
    }

    var settings = $.extend({},settings,options);


    /**
     * Initialize
     * Create Table 
     * Send Server Request
     */
    this.Initialize = function() {
      // add class to table
      $(this.selector).addClass('tableQuery');
      // create the headers
      this.thead(table);
      // we have loaded the header already
      settings.already = 'true';
      // send the ajax request
      this.request();
      // filter helpers are static/built-in filters
      this._privateInternalFilters();
    };


    this.request = function(hide) {
      // fadein loading div
      if (typeof hide === 'undefined') {
        $(".tableQuery_loading").fadeIn();
      }

      // clear out all json until request fills up
      settings.json = undefined;
      // send the ajax request and fill up json
      this.ajaxRequest();
      // if json exist, draw the table, or else wait..
      // wait for request before continuing...
      var rInt = setInterval(function(){
        if (typeof settings.json !== 'undefined') {
          clearInterval(rInt);
          self.draw();

          // fadeout Loading Div
          if (typeof hide === 'undefined') {
            $(".tableQuery_loading").fadeOut();
          }

          // send success function
          settings.success(settings.json); 
        }
      }, 10);
      
    };


    this.filter = function(filters) {
      if (filters!==null) {
        $.extend( settings.filter, filters );
      }
      
      return settings.filter;
    };


    this.ajaxParam = function() {
      var params    = {}
      params.filter = settings.filter;
      params.sort   = settings.params.sort.col;
      params.sort   = settings.params.sort.dir;
      return params
    };


    this.ajaxRequest = function (aparam) {
      // record how many requests
      var requestn = settings.request;

      // if there is a current request running, 
      // destroy it...
      if (settings.running===true) {
        self.abort();
      }

      // add each request 
      settings.request++;
      settings.ajax = $.ajax({
        "url" : settings.url,
        "data": settings.filter,
        "success": function (d) {
          // only run the proper request, otherwise return nothing
          if (requestn+1!=settings.request) return false;
          // complete request
          settings.running = false;
          // return the json for the table
          settings.json = d;
        },
        "beforeSend": function () {
          settings.running = true;
          settings.beforeSend();
        },
        "dataType": "json",
        "cache": false,
        "type": ((typeof settings.type !== undefined) ? settings.type : 'GET'),
        "error": function (xhr, error, thrown) {

          $(".tableQuery_loading").fadeOut();

          settings.error(xhr,error,thrown);

          if (error=='parsererror') {
            var error_message = 'Invalid JSON response';
          }
          else if ( xhr.readyState === 4 ) {
            var error_message = 'Ajax Error';
          }
          else if ( error === 'abort' ) {
            var error_message = 'Request was cancelled';
          }
          else if ( error === 'timeout' ) {
            var error_message = 'Request Timedout';
          }
          else {
            var error_message = 'Unknown Error';
          }

          if (self.debug===true) {
          	console.log(selector+': '+error_message);
          }
        }
      });
      
    };


    this.thead = function(t) {
      settings.complete.sort = false;
      if (settings.saveSort==true) {
        var sd = localStorage.getItem(selector+'_tableQuery');
        var ls = JSON.parse(sd);
      }

      var thead = t.getElementsByTagName('THEAD')[0];
      var trs = thead.getElementsByTagName('TR');
      var heado = [];
      var sortingcomplete = false;
      for (var i = 0; i < trs.length; i++) {
        var cells = trs[i].cells;
        for (var j = 0; j < cells.length; j++) {
          var c = cells[j];
          
          var cname          = $(c).attr('colname');
          var coldefault     = ($(c).attr('coldefault')!==undefined) ? $(c).attr('coldefault') : '';
          var csort          = ($(c).attr('colsort')!==undefined) ? $(c).attr('colsort') : 'true';
          var sortdefault    = ($(c).attr('colsortdefault')!==undefined) ? $(c).attr('colsortdefault') : 'false';

          if ($(c).attr('colsortdefault')===undefined && csort!='false' && sortingcomplete===false) {
            sortingcomplete = true;
            sortdefault = 'true';
          }

          var cvisible = $(c).attr('colvisible');
          var tbindex  = j;
          var sorting  = false;

          // add the tbindex
          $(c).attr('tbindex',tbindex);

          // hide the column header
          if (cvisible==='false') {
            $(c).hide();
            $(this.selector+' th[colname='+cname+']').hide();
          }

          if (csort!=='false' && settings.already!='true' && i<1) {
            $(c).attr('tbrole','columnsort');

            // grab form local storage
            if (settings.saveSort==true && ls) {
              if (ls.col == cname) {
                sortdefault = 'true';
                csort    = ls.dir;
              }
              else {
                sortdefault = 'false';
              } 
            }

            if (sortdefault==='true' && settings.complete.sort===false) {
              settings.complete.sort = true;
              sorting = true;
              if (csort=='asc' || csort=='desc') {
                $(c).attr('tbsort',csort); 
                if (csort=='asc') {
                  self.colsort(c,'asc');
                }
                else {
                  self.colsort(c,'desc');
                }

                settings.filter.sort = {col:cname,dir:csort};
              }
              else {
                self.colsort(c,'asc');
              }
            }
          }
      
          var hm = {
            name:cname,
            sort:csort,
            index:tbindex,
            sortdefault:sortdefault,
            default:coldefault,
            visible:cvisible,
            sorting:sorting,
            class:$(c).attr('colclass')
          };

          if (i < 1) heado.push(hm);
        }
      }

      // append a click listener to the column header
      $(this.selector+' th[tbrole=columnsort]').off().on('click',function(e){
        if (!$(e.target).is('.popover') && !$(e.target).is('.popover-content') && !$(e.target).is('.popover-content a')) {

          var sortby  = 'asc';
          var tbsort  = $(this).attr('tbsort');
          var colsort = $(this).attr('colsort');
          var tbindex = $(this).attr('tbindex');

          if (tbsort=='desc') {
            var sortby = 'asc';
            self.colsort(this,sortby);
          }
          else if (tbsort=='asc') {
            var sortby = 'desc';
            self.colsort(this,sortby);
          }
          else {
            if (colsort=='desc') {
              var sortby = 'desc';
            }

            self.colsort(this,sortby);
          }

          // update the header array with correct sort
          for (var j = 0; j < settings.columns.length; j++) { 
            if (tbindex==j) {
              settings.columns[j].sorting = true;
              settings.columns[j].sort = sortby;
            }
            else {
              settings.columns[j].sorting = false;
            }
          }

          // add new sort options
          settings.filter.sort = {col:$(this).attr('colname'),dir:sortby};

          if (settings.saveSort==true) {
            localStorage.setItem(selector+'_tableQuery',JSON.stringify(settings.filter.sort));
          }

          self.request();
        }
      });

      // almost a return, but this will suffice
      settings.columns = heado;

    };


    this.colsort = function(th,sort) {
      // remove these... but after you've got what we need above
      $(this.selector+' th[tbrole=columnsort]').removeClass('descending').removeClass('ascending').removeAttr( "tbsort" );
      $(th).attr('tbsort',sort).addClass(((sort=='desc') ? 'descending' : 'ascending' ));
    };



    


    this.draw = function (size,fn) {
      if(typeof settings.json !== 'undefined' && settings.json.rows.length > 0){
        if (typeof size==='undefined' || size==='') {
          _createTableBody(this.selector,table);
          _createRows(this.selector,table,settings.columns,settings);
        }
      }
      else{
        _createTableBody(this.selector,table);
        _createRows(this.selector,table,settings.columns,settings);
      } 

      if (typeof fn === 'function') {
        fn();
      }     
    };



    /**
     * PRIVATE
     *
     * _privateInternalFilters()
     * Attach to Built-In Filter Options
     *
     */
    this._privateInternalFilters = function() {
      // automatically attach to search box
      if($(".tableQuery-search").length > 0) {
        $('.tableQuery-search').on('keypress',function(e) {
          if ( e.which == 13 ) {
            self.filter({'search':$(this).val()});
            self.reload();
          }
        });  
      }

      // built-in reload button (also search button)
      if($(".tableQuery-reload").length > 0) {
        $('.tableQuery-reload').on('click',function(e) {
          // built-in search filter (check if there is any content here)
          if($(".tableQuery-search").length > 0) {
            self.filter({'search':$(".tableQuery-search").val()});
          }
          self.reload();
        });  
      }

    };
    


    /**
     * API - 
     *
     * .show()
     * Show Columns
     *
     * @param : columns (array of colname's)
     */
    this.show = function(columns) {
      if(columns.length > 0){
        for (i = 0; i < columns.length; i++) { 

          // current column index
          var tbindex = $(this.selector+' th[colname='+columns[i]+']').attr('tbindex');
          if (typeof tbindex === 'undefined') continue;
          // update the columns array
          settings.columns[tbindex].visible = 'true';

          // remove the colvisible attr and show the column 
          $(this.selector+' td[colname='+columns[i]+']').show();
          $(this.selector+' th[colname='+columns[i]+']').show().removeAttr( "colvisible" );
        }

        // redraw to fill in new columns
        self.draw('true');
      }
    }
 


    /**
     * API -
     *
     * .hide()
     * Hide Columns
     *
     * @param : columns (array of colname's)
     */
    this.hide = function(columns) {
      if(columns.length > 0){
        for (i = 0; i < columns.length; i++) { 

          // current column index
          var tbindex = $(this.selector+' th[colname='+columns[i]+']').attr('tbindex');
          if (typeof tbindex === 'undefined') continue;

          // update the columns array
          settings.columns[tbindex].visible = 'false';

          // add the colvisible attr and hide the column
          $(this.selector+' td[colname='+columns[i]+']').hide();
          $(this.selector+' th[colname='+columns[i]+']').hide().attr('colvisible','false');
        }

        // redraw to fill in new columns
        self.draw('true');
      }
    }



    /**
     * API -
     *
     * .redraw()
     * Redraw Table (only aesthetic changes)
     *
     */
    this.redraw = function() {
      this.draw('true');
    }



    /**
     * API -
     *
     * .reload()
     * Reload Table (requesting server)
     *
     */
    this.reload = function(hide) {
      this.request(hide);
    }



    /**
     * API -  
     *
     * .abort()
     * Cancel an Ajax (XMLHttpRequest) Server Request
     *
     * Beneficial if you want to end a long server request or re-filter 
     * and dont want to run multiple request to the server.
     *
     */
    this.abort = function() {
      settings.ajax.abort();
    }

    this.Initialize();
    return this;
  };

  // all other tableQuery Aliases
  TableQuery = $.fn.TableQuery;
  $.fn.tableQuery = TableQuery;
  $.fn.TableQuery = TableQuery;
  $.fn.tablequery = TableQuery;

})(jQuery);


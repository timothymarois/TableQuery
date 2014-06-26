/* 

@project: tableQuery < tablequery.com >
@version: 1.0.17
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
   * createRowContent()
   * - create columns (on rows)
   *
   * @param o : column in which the table is 
   * @param d : data of td column 
   * @param c : Class to add to each td column
   */
  function createColumnContent(o,d,c,n,h) {
    var td = document.createElement('td');
    if (n!='') td.setAttribute('colname',n);
    if (c!='') td.className = c;
    if (h===true) td.style.display = 'none';
    td.innerHTML = d;
    o.appendChild(td);
  };

  /**
   * createRows()
   * - create all the rows in the table
   *
   * @param : sel (table selector)
   * @param : table (table selector)
   * @param : thead (header column properties)
   * @param : json (the table content)
   */
  function createTableContent(sel,table,thead,json) {
    var rtbody = table.getElementsByTagName('TBODY')[0];
    // remove existing tbody
    if (rtbody) $(sel+" tbody").remove();
    // (IE) doesnt have remove() ~so use jQuery for now
    // if (rtbody) rtbody.remove();

    // create the tbody
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // create rows
    for(i=0; i<json.length; i++){
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
          // create actual column
          createColumnContent(row,json[i][obj['name']],addClass,obj['name'],h);
        }
      }

      // append each row
      tbody.appendChild(row);
    }
  };


  var TableQuery;

  /**
   * TableQuery main function
   * $(selector).tableQuery();
   *
   * @param: options
   */
  $.fn.TableQuery = function( options ){
    var self = this;
    var selector = this.selector.replace('#','');
    var table = document.getElementById(selector);

    var settings = {
      request : 0,
      running : false,
      ajax : {},
      filter : {
        search : '',
        sort : {
          col:'',
          dir:'asc'
        }
      },
      saveSort : true,
      addons : {
        fixedHeader : false
      },
      complete : {
        fixedHeader : false
      },
      beforeSend : function () { },
      success : function () { },
      error : function () { }
    }

    var Measure = {}
    Measure.win = {
      "scrollTop":0,
      "ScrollRight":0,
      "ScrollBottom":0,
      "ScrollLeft":0,
      "Height":0,
      "Width":0
    };

    Measure.doc = {
      "Height": 0,
      "Width": 0
    };

    Measure.table = {
      "Width": 0,
      "Height": 0,
      "Left": 0,
      "Right": 0, 
      "Top": 0,
      "Bottom": 0,
      "thead" : 0,
      "tfoot" : 0,
      "cells" : 0
    };

    Measure.offset = {
      "top": 0
    };

    var settings = $.extend({},settings,options);

    this.Initialize = function() {
      // add class to table
      $(this.selector).addClass('tableQuery');
      // create the headers
      this.thead(table);
      // we have loaded the header already
      settings.already = 'true';
      // send the ajax request
      this.request();
    };


    this.request = function() {
      // fadein loading div
      $(".tableQuery_loading").fadeIn();
      // clear out all json until request fills up
      settings.json = undefined;
      // send the ajax request and fill up json
      this.ajaxRequest();
      // if json exist, draw the table, or else wait..
      if (typeof settings.json !== 'undefined') {
        self.draw();
        // fadeout Loading Div
        $(".tableQuery_loading").fadeOut();

        // send success function
        settings.success(settings.json); 

        // this is one last update, incase success modifies the column headers
        if (settings.addons.fixedHeader===true) {
          $("thead>tr th:visible", document.getElementById(selector)).each( function (i) {
            $("thead>tr th:visible", document.getElementById(selector+'_FixedHeader_Cloned_id')).eq(i).width( $(this).width() );
          });
        }
      }
      else {
        // wait for request before continuing...
        var rInt = setInterval(function(){
          if (typeof settings.json !== 'undefined') {
            clearInterval(rInt);
            self.draw();
            // fadeout Loading Div
            $(".tableQuery_loading").fadeOut();

            // send success function
            settings.success(settings.json); 

            // this is one last update, incase success modifies the column headers
            if (settings.addons.fixedHeader===true) {
              $("thead>tr th:visible", document.getElementById(selector)).each( function (i) {
                $("thead>tr th:visible", document.getElementById(selector+'_FixedHeader_Cloned_id')).eq(i).width( $(this).width() );
              });
            }
          }
        }, 10);
      }
    };


    this.filter = function(filters) {
      $.extend( settings.filter, filters );
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
          settings.error(xhr,error,thrown);

          if (error=='parsererror') {
            var error_message = 'Invalid JSON response';
          }
          else if ( xhr.readyState === 4 ) {
            var error_message = 'Ajax Error';
          }

          console.log(selector+': '+error_message);
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
      for (var i = 0; i < trs.length; i++) {
        var cells = trs[i].cells;
        for (var j = 0; j < cells.length; j++) {
          var c = cells[j];

          var cname    = $(c).attr('colname');
          var cdefault = $(c).attr('coldefault');
          var csort    = $(c).attr('colsort');
          var cvisible = $(c).attr('colvisible');
          var tbindex  = j;
          var sorting  = false;

          // add the tbindex
          $(c).attr('tbindex',tbindex);

          // hide the column header
          if (cvisible==='false') {
            $(c).hide();
            $(this.selector+' th[colname='+cname+']').hide();
            $(this.selector+'_FixedHeader_Cloned_id th[colname='+cname+']').hide();
          }

          if (csort!=='false' && settings.already!='true' && i<1) {
            $(c).attr('tbrole','columnsort');

            // grab form local storage
            if (settings.saveSort==true && ls) {
              if (ls.col == cname) {
                var cdefault = 'true';
                var csort    = ls.dir;
              }
            }

            if (cdefault==='true' && settings.complete.sort===false) {
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
            default:cdefault,
            visible:cvisible,
            sorting:sorting,
            class:$(c).attr('colclass')
          };

          if (i < 1) heado.push(hm);
        }
      }

      // append a click listener to the column header
      $(this.selector+' th[tbrole=columnsort]').off().on('click',function(){
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
        self.request();

      });

      // almost a return, but this will suffice
      settings.columns = heado;
    };


    this.colsort = function(th,sort) {
      // remove these... but after you've got what we need above
      $(this.selector+' th[tbrole=columnsort]').removeClass('descending').removeClass('ascending').removeAttr( "tbsort" );
      
      // do the same for the fixed header
      if (settings.addons.fixedHeader===true) {
        $(this.selector+'_FixedHeader_Cloned_id th[tbrole=columnsort]').removeClass('descending').removeClass('ascending').removeAttr( "tbsort" );
      }

      $(th).attr('tbsort',sort).addClass(((sort=='desc') ? 'descending' : 'ascending' ));

      // save sorting... when changed
      if (settings.saveSort==true) {
        s = {};
        s.col = $(th).attr('colname');
        s.dir = sort;
        localStorage.setItem(selector+'_tableQuery', JSON.stringify(s));
      }
    };


    this.draw = function (size) {
      if(settings.json.rows.length > 0){
        if (typeof size==='undefined') {
          createTableContent(this.selector,table,settings.columns,settings.json.rows);
        }

        // activate fixed header if option is true
        if (settings.addons.fixedHeader===true) {
          this.fixedHeader();
        }
      }
      else{
        $(this.selector).html('No records found!');
      }      
    };


    this.createFixedHeader = function() {
      tableClone = table.cloneNode( false );
      tableClone.removeAttribute( 'id' );

      var hDiv = document.createElement( 'div' );
      hDiv.style.position = "absolute";
      hDiv.style.top = "0px";
      hDiv.style.left = "0px";
      hDiv.className = "FixedHeader_Cloned";
      hDiv.id = selector+"_FixedHeader_Cloned";
      hDiv.style.zIndex = 99;
      // remove margins since we are going to poistion it absolute 
      tableClone.style.margin = "0";

      // Insert the newly cloned table into the DOM, on top of the "real" header 
      // only insert fixedHeader if it does not already exist
      if ($('#'+selector+'_FixedHeader_Cloned').length > 0 ) {
        settings.complete.fixedHeader = true;
        return true;
      }

      hDiv.appendChild( tableClone );
      document.body.appendChild( hDiv );

      $(this.selector+"_FixedHeader_Cloned table").attr('id',selector+'_FixedHeader_Cloned_id');
      $(this.selector+"_FixedHeader_Cloned").append("<div class='stole_shadow'></div>");

      /* Clone the DataTables header */
      var nThead = $('thead',table).clone(true)[0];
      document.getElementById(selector+'_FixedHeader_Cloned_id').appendChild( nThead );

      settings.complete.fixedHeader = true;
    };


    this.fixedHeader = function() {

      // only allow one header to be created
      if (settings.complete.fixedHeader!==true) {
        self.createFixedHeader();
      }

      // Set the wrapper width to match that of the cloned table 
      $('#'+selector+'_FixedHeader_Cloned').width($('#'+selector).outerWidth());

      $("thead>tr th:visible", document.getElementById(selector)).each( function (i) {
        $("thead>tr th:visible", document.getElementById(selector+'_FixedHeader_Cloned_id')).eq(i).width( $(this).width() );
      });

      function adjustFixedHeader() {
        self.measureUp();
        if ( Measure.table.Top > Measure.win.ScrollTop ) {
          $('#'+selector+'_FixedHeader_Cloned').css({'position':'absolute'});
          $('#'+selector+'_FixedHeader_Cloned').css({'top':$(table).offset().top+"px"});
          $('#'+selector+'_FixedHeader_Cloned').css({'left':(Measure.table.Left-Measure.win.ScrollLeft)+"px"});         
        }
        else if ( Measure.win.ScrollTop > Measure.table.Top+Measure.table.cells ) {
          $('#'+selector+'_FixedHeader_Cloned').css({'position':'absolute'});
          $('#'+selector+'_FixedHeader_Cloned').css({'top':(Measure.table.Top+Measure.table.cells)+"px"});
          $('#'+selector+'_FixedHeader_Cloned').css({'left':(Measure.table.Left-Measure.win.ScrollLeft)+"px"});     
        }
        else {
          $('#'+selector+'_FixedHeader_Cloned').css({'position':'fixed'});
          $('#'+selector+'_FixedHeader_Cloned').css({'top':"0px"});
          $('#'+selector+'_FixedHeader_Cloned').css({'left':(Measure.table.Left-Measure.win.ScrollLeft)+"px"});
        }
      };

      $(window).scroll( function () {
        adjustFixedHeader();
      });

      $(window).resize( function () {
        adjustFixedHeader();

        $('#'+selector+'_FixedHeader_Cloned').width($('#'+selector).outerWidth());

        // ~this WAS god awful slow
        // only look at visble columns and change eq() to jquery not selector eq()
        $("thead>tr th:visible", document.getElementById(selector)).each( function (i) {
          $("thead>tr th:visible", document.getElementById(selector+'_FixedHeader_Cloned_id')).eq(i).width( $(this).width() );
        });

        /*
        - horrible...
        $("thead>tr th", document.getElementById(selector)).each( function (i) {
          $("thead>tr th:eq("+i+")", document.getElementById(selector+'_FixedHeader_Cloned_id')).width( $(this).width() );
        });

        */
 
      });
 
      $('#'+selector+'_FixedHeader_Cloned').css({'position':'absolute'});
      $('#'+selector+'_FixedHeader_Cloned').css({'top':$(table).offset().top+"px"});
      $('#'+selector+'_FixedHeader_Cloned').css({'left':(Measure.table.Left-Measure.win.ScrollLeft)+"px"});
      adjustFixedHeader();
    };

    this.measureUp = function() {

      // doc and window measurements
      Measure.doc.Height = $(document).height();
      Measure.doc.Width = $(document).width();
      Measure.win.Height = $(window).height();
      Measure.win.Width = $(window).width();      
      Measure.win.ScrollTop = $(window).scrollTop();      
      Measure.win.ScrollLeft = $(window).scrollLeft();      
      Measure.win.ScrollRight = Measure.doc.Width - Measure.win.ScrollLeft - Measure.win.Width;
      Measure.win.ScrollBottom = Measure.doc.Height - Measure.win.ScrollTop - Measure.win.Height;

      // table measurements
      Measure.table.Width = $(this.selector).outerWidth()
      Measure.table.Height = $(this.selector).outerHeight();
      Measure.table.Left = $(this.selector).offset().left + table.parentNode.scrollLeft;
      Measure.table.Top = $(this.selector).offset().top;
      Measure.table.Right = Measure.table.Left + Measure.table.Width;
      Measure.table.Right = Measure.doc.Width - Measure.table.Left - Measure.table.Width;
      Measure.table.Bottom = Measure.doc.Height - Measure.table.Top - Measure.table.Height;

      Measure.table.thead = $("thead", table).height(),
      Measure.table.tfoot = $("tfoot", table).height(),
      Measure.table.cells = $(table).height();

    };
    

    /**
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
          // update the columns array
          settings.columns[tbindex].visible = 'true';

          // remove the colvisible attr and show the column 
          $(this.selector+' td[colname='+columns[i]+']').show();
          $(this.selector+' th[colname='+columns[i]+']').show().removeAttr( "colvisible" );
          // do the same for the fixed header clone
          if (settings.addons.fixedHeader===true) {
            $(this.selector+'_FixedHeader_Cloned_id th[colname='+columns[i]+']').show().removeAttr( "colvisible" );
          }
        }

        // redraw to fill in new columns
        self.draw('true');
      }
    }
 

    /**
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
          // update the columns array
          settings.columns[tbindex].visible = 'false';

          // add the colvisible attr and hide the column
          $(this.selector+' td[colname='+columns[i]+']').hide();
          $(this.selector+' th[colname='+columns[i]+']').hide().attr('colvisible','false');

          // do the same for the fixed header 
          if (settings.addons.fixedHeader===true) {
            $(this.selector+'_FixedHeader_Cloned_id th[colname='+columns[i]+']').hide().attr('colvisible','false');
          }
        }

        // redraw to fill in new columns
        self.draw('true');
      }
    }


    /**
     * .reload()
     * Reload Table
     * - request a fresh table (server + draw)
     *
     */
    this.reload = function() {
      this.request();
    }


    /**
     * .abort()
     * Cancel a Ajax Server Request
     * - cancels current XMLHttpRequest 
     *
     */
    this.abort = function() {
      settings.ajax.abort();
    }

    // create the wrapper div on our table
    // this includes our position: relative; (for fixed header)
    $(this.selector).wrap( "<div id='"+selector+"_wrapper' class='tableQuery_wrapper' style='position: relative;'></div>" );
    $(this.selector).append( "<div id='"+selector+"_loading' class='tableQuery_loading' style='display:none'></div>" );


   
    // begin table Initialization
    this.Initialize();

    // give outside access
    return this;
  };

  // all other tableQuery Aliases
  TableQuery = $.fn.TableQuery;
  $.fn.tableQuery = TableQuery;
  $.fn.TableQuery = TableQuery;
  $.fn.tablequery = TableQuery;

})(jQuery);


/* 

@project: tableQuery < tablequery.com >
@version: 1.0.0
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
  function createColumnContent(o,d,c) {
    var td = document.createElement('td');
    if (c!='') td.className = c;
    td.appendChild(document.createTextNode(d));
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
          if (obj.hasOwnProperty('visible') && obj['visible']==='false') continue;
          // add class to column
          var addClass = "";
          if (obj.hasOwnProperty('class') && obj['class']!==undefined) addClass += obj['class'];
          if (obj.hasOwnProperty('sorting') && obj['sorting']===true) addClass += ' sorting';
          // create actual column
          createColumnContent(row,json[i][obj['name']],addClass);
        }
      }

      // append each row
      tbody.appendChild(row);
    }
  };



/*var thead = table.getElementsByTagName('TBODY')[0];
        var trs = thead.getElementsByTagName('TR');
        for (var i = 0; i < trs.length; i++) {
          var cells = trs[i].cells[tbindex];
          $(cells).attr('tbsorting','true');
        }*/

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

    settings = {
      filter : {
        search : ''
      },
      addons : {
        fixedHeader : false
      },
      complete : {
        fixedHeader : false
      },
      success : function () { },
      error : function () { }
    }

    var settings = $.extend({},settings,options);

    this.Initialize = function() {
      $(this.selector).addClass('tableQuery');
      settings.params  = this.ajaxParam();
      this.thead(table);
      settings.already = 'true';
      this.request();
    };


    this.request = function() {
      // clear out all json until request fills up
      settings.json = undefined;
      // send the ajax request and fill up json
      this.ajaxRequest();
      // if json exist, draw the table, or else wait..
      if (typeof settings.json !== 'undefined') {
        self.draw();
      }
      else {
        // wait for request before continuing...
        var rInt = setInterval(function(){
          if (typeof settings.json !== 'undefined') {
            clearInterval(rInt);
            self.draw();
          }
        }, 10);
      }
    };


    this.ajaxParam = function() {
      var params    = {}
      params.filter = settings.filter;
      // params.limit  = settings.limit;
      params.sort   = {dir:'asc'};
      return params
    };


    this.ajaxRequest = function (aparam) {
      $.ajax({
        "url" : settings.url,
        "data": settings.params,
        "success": function (d) {
          settings.json = d;
          settings.success(d);
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

          if (cvisible==='false') {
            $(c).hide();
          }

          if (csort!=='false' && settings.already!='true' && i<1) {
            $(c).attr('tbrole','columnsort');

            if (cdefault==='true') {
              sorting = true;
              if (csort=='asc' || csort=='desc') {
                $(c).attr('tbsort',csort);
                if (csort=='ascending') {
                  self.colsort(c,'asc');
                }
                else {
                  self.colsort(c,'desc');
                }

                settings.params.sort.col = cname;
                settings.params.sort.dir = csort;
              }
              else {
                self.colsort(c,'asc');
              }
            }
            else {
              
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
        settings.params.sort.col = $(this).attr('colname');
        settings.params.sort.dir = sortby;
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
    };


    this.draw = function () {
      if(settings.json.rows.length > 0){
        createTableContent(this.selector,table,settings.columns,settings.json.rows);
        
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
      hDiv.style.zIndex = 9999;
      // remove margins since we are going to poistion it absolute 
      tableClone.style.margin = "0";

      // Insert the newly cloned table into the DOM, on top of the "real" header 
      hDiv.appendChild( tableClone );
      document.body.appendChild( hDiv );

      $(this.selector+"_FixedHeader_Cloned table").attr('id',selector+'_FixedHeader_Cloned_id');
      $(this.selector+"_FixedHeader_Cloned").append("<div class='stole_shadow'></div>");

      var otable = document.getElementById(selector+'_FixedHeader_Cloned_id');

      /* Clone the DataTables header */
      var nThead = $('thead',table).clone(true)[0];
      otable.appendChild( nThead );

      settings.complete.fixedHeader = true;
    }


    this.fixedHeader = function() {
      // only allow one header to be created
      if (settings.complete.fixedHeader!==true) {
        self.createFixedHeader();
      }

      var nTable = table;
      var otable = document.getElementById(selector+'_FixedHeader_Cloned_id');

      // Set the wrapper width to match that of the cloned table 
      $(this.selector+'_FixedHeader_Cloned_id').width($(table).outerWidth());

      // keep up with all the column widths (TH)
      $("thead>tr th", table).each( function (i) {
        $("thead>tr th:eq("+i+")", otable).width( $(this).width() );
      });

      var oWin = {"iScrollTop": 0,"iScrollRight": 0,"iScrollBottom": 0,"iScrollLeft": 0,"iHeight": 0,"iWidth": 0};
      var oDoc = {"iHeight": 0,"iWidth": 0};
      var oMes = {"iTableWidth": 0,"iTableHeight": 0,"iTableLeft": 0,"iTableRight": 0, "iTableTop": 0,"iTableBottom": 0 };

      function _fnSumScroll ( n, side ) {
        var i = n[side];
        while ( n = n.parentNode ) {
          if ( n.nodeName == 'HTML' || n.nodeName == 'BODY' ) {
            break;
          }

          i = n[side];
        }

        return i;
      }

      function adjustFixedHeader()
      {
        var jqWin=$(window),jqDoc=$(document)
        oDoc.iHeight = jqDoc.height();
        oDoc.iWidth = jqDoc.width();
        oWin.iHeight = jqWin.height();
        oWin.iWidth = jqWin.width();
        oWin.iScrollTop = jqWin.scrollTop();
        oWin.iScrollLeft = jqWin.scrollLeft();

        var m = oMes,
        jqTable = $(table),
        oOffset = jqTable.offset(),
        iParentScrollTop = _fnSumScroll( table.parentNode, 'scrollTop' ),
        iParentScrollLeft = _fnSumScroll( table.parentNode, 'scrollLeft' );

        m.iTableLeft = oOffset.left + table.parentNode.scrollLeft;
        m.iTableTop = oOffset.top + iParentScrollTop;

        var nTable=selector+'_wrapper',iTbodyHeight=0,anTbodies=table.getElementsByTagName('tbody');
        for (var i = 0; i < anTbodies.length; ++i) {
          iTbodyHeight += anTbodies[i].offsetHeight;
        }

        if ( oMes.iTableTop > oWin.iScrollTop ) {
          // Above the table 
          $('#'+selector+'_FixedHeader_Cloned').css({'position':'absolute'});
          $('#'+selector+'_FixedHeader_Cloned').css({'top':$(table).offset().top+"px"});
          $('#'+selector+'_FixedHeader_Cloned').css({'left':(oMes.iTableLeft-oWin.iScrollLeft)+"px"});         
        }
        else if ( oWin.iScrollTop > oMes.iTableTop+iTbodyHeight ) {
          // below the table 
          $('#'+selector+'_FixedHeader_Cloned').css({'position':'absolute'});
          $('#'+selector+'_FixedHeader_Cloned').css({'top':(oMes.iTableTop+iTbodyHeight)+"px"});
          $('#'+selector+'_FixedHeader_Cloned').css({'left':(oMes.iTableLeft-oWin.iScrollLeft)+"px"});     
        }
        else {
          // In the middle of the table 
          $('#'+selector+'_FixedHeader_Cloned').css({'position':'fixed'});
          $('#'+selector+'_FixedHeader_Cloned').css({'top':"0px"});
          $('#'+selector+'_FixedHeader_Cloned').css({'left':(oMes.iTableLeft-oWin.iScrollLeft)+"px"});
        }
      };


      $(window).scroll( function () {
        adjustFixedHeader();
        $(self.selector+'_FixedHeader_Cloned_id').width($(table).outerWidth());
      });

      $(window).resize( function () {
        adjustFixedHeader();
        $(self.selector+'_FixedHeader_Cloned_id').width($(table).outerWidth());
      });

      $('#'+selector+'_FixedHeader_Cloned').css({'position':'absolute'});
      $('#'+selector+'_FixedHeader_Cloned').css({'top':$(table).offset().top+"px"});
      $('#'+selector+'_FixedHeader_Cloned').css({'left':(oMes.iTableLeft-oWin.iScrollLeft)+"px"});

      adjustFixedHeader();

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
          $(this.selector+' th[colname='+columns[i]+']').show().removeAttr( "colvisible" );
          // do the same for the fixed header clone
          if (settings.addons.fixedHeader===true) {
            $(this.selector+'_FixedHeader_Cloned_id th[colname='+columns[i]+']').show().removeAttr( "colvisible" );
          }
        }

        // redraw to fill in new columns
        self.draw();
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
          $(this.selector+' th[colname='+columns[i]+']').hide().attr('colvisible','false');

          // do the same for the fixed header 
          if (settings.addons.fixedHeader===true) {
            $(this.selector+'_FixedHeader_Cloned_id th[colname='+columns[i]+']').hide().attr('colvisible','false');
          }
        }

        // redraw to fill in new columns
        self.draw();
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

    // create the wrapper div on our table
    // this includes our position: relative; (for fixed header)
    $(this.selector).wrap( "<div id='"+selector+"_wrapper' class='tableQuery_wrapper' style='position: relative;'></div>" );
   
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

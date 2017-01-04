/**
 * [created by isabolic sabolic.ivan@gmail.com]
 */


// workspace
(function(){
   if(window.apex.plugins === undefined){
      window.apex.plugins = {};
   }
}());

(function($, x) {
    var options = {
        $itemValId       : null,
        $itemId          : null,
        dtPconfig        : {},
        htmlTemplate     : {
            item :  "<div class='container date-time-picker' id='cont-#itemId#'>"              +
                       "<div class='row'>"                                                     +
                           "<div>"                                            +
                               "<div class='form-group'>"                                      +
                                   "<div class='t-Form-inputContainer input-group date' id='form-#itemId#'>" +
                                       "<div class='hidden-input'></div>"                      +
                                       "<input type='text' class='form-control' />"            +
                                       "<span class='input-group-addon'>"                      +
                                           "<span class='fa fa-calendar'></span>"              +
                                       "</span>"                                               +
                                   "</div>"                                                    +
                               "</div>"                                                        +
                           "</div>"                                                            +
                       "</div>"                                                                +
                    "</div>",
            overlay : "<div class='ui-widget-overlay ui-front'></div>"
        }
    };

    var OraMomFormatMapping = {
        oracle : {
            date : {
              YEAR : ["RRRR", "RR"],
              YEAR_ISO : ["IYYY", "IYY", "IY"],
              MONTH  : ["MON", "MONTH"],
              WEAK_OF_YEAR : ["WW"],
              WEAK_OF_YEAR_ISO : ["IW"],
              //DAY_OF_WEEK : ["D"],
              NAME_OF_DAY : ["DAY"]
            },
            time : {
              HOUR_OF_DAY_24 : ["HH24"],
              HOUR_OF_DAY_12 : ["HH", "HH12"],
              MINUTE : ["MI"],
              SECONDS : ["SS"],
              MERIDIAN_INDICATOR : ["AM", "A.M.", "PM", "P.M."]
            }
        },
        moment : {
            date : {
              YEAR : ["YYYY", "YY"],
              YEAR_ISO : ["GGGG", "GGGG", "GG"],
              MONTH  : ["MMM", "MMMM"],
              WEAK_OF_YEAR : ["ww"],
              WEAK_OF_YEAR_ISO : ["WW"],
              //DAY_OF_WEEK : ["e"],
              NAME_OF_DAY : ["dddd"]
            },
            time : {
              HOUR_OF_DAY_24 : ["HH"],
              HOUR_OF_DAY_12 : ["hh", "hh"],
              MINUTE : ["mm"],
              SECONDS : ["ss"],
              MERIDIAN_INDICATOR : [" A", " A", " A", " A"]
            }
        }
    }

    /**
     * [xDebug - PRIVATE function for debug]
     * @param  string   functionName  caller function
     * @param  array    params        caller arguments
     */
    var xDebug = function(functionName, params){
        x.debug(this.jsName || " - " || functionName, params, this);
    };

    /**
     * [triggerEvent     - PRIVATE handler fn - trigger apex events]
     * @param String evt - apex event name to trigger
     */
    var triggerEvent = function(evt, evtData) {
        xDebug.call(this, arguments.callee.name, arguments);
        this.options.$itemValId.trigger(evt, [evtData]);
        $(this).trigger(evt + "." + this.apexname, [evtData]);
    };

    /**
     * [setFormats description]
     * @param  String oraFormat    [oracle format string]
     * @param  String momentFormat [momentjs format string]
     */
    var setFormats = function(oraFormat, momentFormat){
        xDebug.call(this, arguments.callee.name, arguments);
        if (oraFormat){
          this.format.oracle = oraFormat;
        }

        if (momentFormat){
          this.format.moment = momentFormat;
        }
    };

    /**
     * [parseToMomentFormat PRIVATE transform oracle format string to moment.js based on OraMomFormatMapping]
     */
    var parseToMomentFormat = function(){
          var format = this.options.dtPconfig.format.toUpperCase(),
              has24H = format.indexOf("HH24") > -1 ? true : false;

          xDebug.call(this, arguments.callee.name, arguments);

          setFormats.call(this, format, undefined);

          $.map(OraMomFormatMapping.oracle.date, function(values, key){
             $.each(values, function(idx, val){
               format = (format.replace(val, OraMomFormatMapping.moment.date[key][idx]));
            });
          }.bind(this));

          $.map(OraMomFormatMapping.oracle.time, function(values, key){
             $.each(values, function(idx, val){
                if ( (has24H === true && key ===  "HOUR_OF_DAY_24")
                      || (has24H === true && key.indexOf("HOUR") === -1)
                      || has24H === false){
                  format = (format.replace(val, OraMomFormatMapping.moment.time[key][idx]));
                }
            });
          }.bind(this));

          setFormats.call(this, undefined, format);

          this.options.dtPconfig.format = format;
    };

    /**
     * [calculatePosition Private set position of container for dropdown after the element is visible]
     */
    var calculatePosition = function(){
      var ele  = this.options.$formItem,
          left = ele.offset().left - ele.width(),
          top  = ele.offset().top;

      xDebug.call(this, arguments.callee.name, arguments);

      if (ele.is(":visible") === true) {
        this.widgetCont.css({top: top, left: left, width:"0px"});
        this.isRendered = true;
      }
    }

    /**
     * [hideHandler hide event handler]
     * @param  {[type]} ev [$.event]
     */
    var hideHandler = function(ev){
        xDebug.call(this, arguments.callee.name, arguments);
        // overlay
        if($.fn.isMobile()){
          this.$overlayDiv.remove();
        }

        if (this.options.dtPconfig.inline !== true){
          calculatePosition.call(this);
          this.widgetCont.hide();
        }

        triggerEvent.call(this, this.events[0], {event : ev, _this : this});
    };

    /**
     * [showHandler show event handler]
     * @param  {[type]} ev [$.event]
     */
    var showHandler = function(ev){
        xDebug.call(this, arguments.callee.name, arguments);
        //overlay
        if($.fn.isMobile()){
          $("body").append(this.$overlayDiv);
        }

        this.isRendered = false;

        if (this.options.dtPconfig.inline !== true){
          calculatePosition.call(this);
          this.widgetCont.show();
        }

        triggerEvent.call(this, this.events[1], {event : ev, _this : this});
    };

    /**
     * [changeHandler change event handler]
     * @param  {[type]} ev [$.event]
     */
    var changeHandler = function(ev){
        var ele  = this.widgetCont.find(".dropdown-menu"), date;

        xDebug.call(this, arguments.callee.name, arguments);

        if (ele.is(":visible") === true) {
          triggerEvent.call(
              this,
              this.events[2],
              { event : ev,
                _this : this,
                value : ev.date.toDate()
              }
            );
        }
    };

    /**
     * [intervalFlag call passed function repeatedly "fnIntervat", stop only when flagForClear is set to true ]
     * @param  {[type]} fnIntervat   [function for repeatedly call]
     * @param  {[type]} flagForClear [key prop. on this scope]
     * @param  {[type]} timer        [timer, def. 200]
     */
    var intervalFlag = function (fnIntervat, flagForClear, timer){
      var interval;

      xDebug.call(this, arguments.callee.name, arguments);

      interval = setInterval(function(){
                    fnIntervat.call(this);

                    if (this[flagForClear]){
                      clearInterval(interval);
                    }
                  }.bind(this), (timer || 200));
    }

    apex.plugins.dateTimePicker = function(opts) {
        this.apexname = "DATE_TIME_PICKER";
        this.jsName = "apex.plugins.dateTimePicker";
        this.container = null;
        this.widgetCont = $("<div>", {"class" :"date-time-picker-wg"});
        this.$overlayDiv = null;
        this.options = {};
        this.events = ["datetimepicker-hide",
                       "datetimepicker-show",
                       "datetimepicker-change"];
        this.format = {oracle:null, moment:null}
        this.isRendered = false;
        this.init = function() {
            var itemTemplate, lDate;

            xDebug.call(this, arguments.callee.name, arguments);

            if (window.moment === undefined){
                throw this.jsName || ": requires moment.js (http://momentjs.com/)";
            }

            if ($.fn.datetimepicker === undefined){
                throw this.jsName || ": requires bootstrap-datetimepicker.js (eonasdan.github.io/bootstrap-datetimepicker/)";
            }

            if ($.isPlainObject(opts)) {
                this.options = $.extend(true, {}, this.options, options, opts);
            } else {
                throw this.jsName || ": Invalid options passed.";
            }

            itemTemplate = this.options.htmlTemplate.item;
            itemTemplate = itemTemplate.replace(/\#itemId#/g, this.options.itemId);

            this.options.$itemValId = $("#" + this.options.itemValId);

            if (this.options.$itemValId === null) {
                throw this.jsName || ": itemValId is required.";
            }

            this.options.$itemValId.wrap(itemTemplate);
            this.options.$formItem = $("#form-" + this.options.itemId);
            this.container         = $("#cont-" + this.options.itemId);

            if ($.parseJSON(this.options.dtPconfig).inline !== true){
              this.widgetCont.attr("id", "wg-cont-" + this.options.itemId)
              $("body").prepend(this.widgetCont);
            }else{
              this.widgetCont = this.container;
            }

            this.options.dtPconfig =
                $.extend(
                  true,
                  $.parseJSON(this.options.dtPconfig),
                  {widgetParent : this.widgetCont});


            if (this.options.dtPconfig.momentFormat === undefined){
              parseToMomentFormat.call(this);
            } else {
              setFormats(this.options
                             .dtPconfig.format,
                         this.options
                             .dtPconfig.momentFormat);

              this.options
                  .dtPconfig
                  .format = this.options
                                .dtPconfig
                                .momentFormat;
            }

            //defaultDate
            if (this.options.dtPconfig.defaultDate){
               lDate =  moment.unix(this.options.dtPconfig.defaultDate).toDate();

                this.options
                    .dtPconfig
                    .defaultDate = new Date(lDate.valueOf() +
                                            lDate.getTimezoneOffset()
                                            * 60000);
            }

            // current value
            if (this.options.dtPconfig.value){
                lDate =  moment.unix(this.options.dtPconfig.value).toDate();

                this.options
                    .dtPconfig
                    .defaultDate = new Date(lDate.valueOf() +
                                            lDate.getTimezoneOffset()
                                            * 60000);
                delete this.options.dtPconfig.value;
            }

            // minDate
            if (this.options.dtPconfig.minDate){
                this.options
                    .dtPconfig
                    .minDate = moment.unix(
                                     this.options.dtPconfig.minDate
                                  ).toDate();
            }

            // maxDate
            if (this.options.dtPconfig.maxDate){
                this.options
                    .dtPconfig
                    .maxDate = moment.unix(
                                     this.options.dtPconfig.maxDate
                                  ).toDate();
            }

            if($.fn.isMobile()){
               this.options
                    .dtPconfig = $.extend(this.options
                                              .dtPconfig,
                                              { focusOnShow : false
                                                 ,showClose : true
                                                 ,showClear : true }
                                              );
            }


            this.options.$formItem.datetimepicker(this.options.dtPconfig);

            if (this.options.dtPconfig.inline !== true){
                this.widgetCont.hide();
                intervalFlag.call(
                  this, calculatePosition, "isRendered"
                );

                // reg. resize event
                $(window).resize(function(){

                  this.isRendered = false;
                  intervalFlag.call(
                      this, calculatePosition, "isRendered", 500
                  );

                }.bind(this));
            }

            this.options.$formItem.on("dp.show"  , showHandler.bind(this)  );
            this.options.$formItem.on("dp.hide"  , hideHandler.bind(this)  );
            this.options.$formItem.on("dp.change", changeHandler.bind(this));

            this.$overlayDiv = $(this.options.htmlTemplate.overlay);

            return this;
        }

        return this.init();
    };

    apex.plugins.dateTimePicker.prototype = {

    };

$.fn.datetimepicker.defaults.icons =  {
            time: 'fa fa-clock-o',
            date: 'fa fa-calendar',
            up: 'fa fa-chevron-up',
            down: 'fa fa-chevron-down',
            previous: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            today: 'fa fa-calendar-check-o',
            clear: 'fa fa-trash',
            close: 'fa fa-check'
        }

$.fn.isMobile = function() {
  try{ document.createEvent("TouchEvent"); return true; }
  catch(e){ return false; }
}
})(apex.jQuery, apex);
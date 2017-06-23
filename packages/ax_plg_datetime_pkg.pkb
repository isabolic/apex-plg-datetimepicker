--------------------------------------------------------
--  DDL for Package Body AX_PLG_DATETIME_PKG
--------------------------------------------------------

  CREATE OR REPLACE PACKAGE BODY "AX_PLG_DATETIME_PKG"
as
    gv_playground_host varchar2(100) := 'PLAYGROUND';
    ----------------
    ---
    ---
    function f_is_playground
        return boolean
    is
        v_ax_workspace varchar2(200) ;
    begin
         select apex_util.find_workspace(
            (
                 select apex_application.get_security_group_id from dual
            )
            )
           into v_ax_workspace
           from dual;
        if gv_playground_host = v_ax_workspace then
            return true;
        else
            return false;
        end if;
    end f_is_playground;
----------------
---
---
    function is_numeric(
            p_value varchar2)
        return number
    is
        v_new_num number;
    begin
        v_new_num := to_number(p_value) ;
        return 1;
    exception
    when others then
        return 0;
    end is_numeric;
----------------
---
---
    function get_epoch(p_date date) return number is
     v_epoch_n number;
     begin
     select extract(day from (from_tz(cast(p_date as timestamp), '+00:00') at time zone 'UTC' -timestamp '1970-01-01 00:00:00 +00:00'))*86400+
            extract(hour from (from_tz(cast(p_date as timestamp), '+00:00') at time zone 'UTC' -timestamp '1970-01-01 00:00:00 +00:00'))*3600+
            extract(minute from (from_tz(cast(p_date as timestamp), '+00:00') at time zone 'UTC' -timestamp '1970-01-01 00:00:00 +00:00'))*60+
            extract(second from (from_tz(cast(p_date as timestamp), '+00:00') at time zone 'UTC' -timestamp '1970-01-01 00:00:00 +00:00')) date_to_epoch
       into v_epoch_n
       from dual;

       return v_epoch_n;
    end get_epoch;
----------------
---
---
    procedure res_out(p_clob  clob) is
        v_char varchar2(32000);
        v_clob clob := p_clob;
    begin
        while length(v_clob) > 0 loop
        begin
            if length(v_clob) > 32000 then
                v_char := substr(v_clob,1,32000);
                sys.htp.prn(v_char);
                v_clob:= substr(v_clob, length(v_char) +1);
            else
                v_char := v_clob;
                sys.htp.prn(v_char);
                v_char := '';
                v_clob := '';
            end if;
        end;
        end loop;
    end res_out;
----------------
---
---
    function datetimepicker(
        p_item                in apex_plugin.t_page_item,
        p_plugin              in apex_plugin.t_plugin,
        p_value               in varchar2,
        p_is_readonly         in boolean,
        p_is_printer_friendly in boolean )
        return apex_plugin.t_page_item_render_result
    as
        --
        v_result       apex_plugin.t_page_item_render_result;
        v_prim_lan     varchar2(100);
        v_format       varchar2(100) := p_item.format_mask;
        v_name         varchar2(100) := apex_plugin.get_input_name_for_page_item(p_is_multi_value => false);
        v_val_eph      number;
        v_exe_code     clob;
        v_config       clob;
        v_static_list  wwv_flow_global.vc_arr2;
        --
        v_app_id       varchar2(100) := v('APP_ID');
        v_item_val_id  varchar2(50) := p_item.name;
        --
        v_min_date     p_item.attribute_01%type := p_item.attribute_01;
        v_max_date     p_item.attribute_02%type := p_item.attribute_02;
        v_show_today_b p_item.attribute_05%type := p_item.attribute_05;
        v_header_form  p_item.attribute_06%type := p_item.attribute_06;
        v_use_current  p_item.attribute_07%type := p_item.attribute_07;
        v_min_step     p_item.attribute_08%type := p_item.attribute_08;
        v_def_date     p_item.attribute_09%type := p_item.attribute_09;
        v_d_w_dis      p_item.attribute_10%type := p_item.attribute_10;
        v_inline       p_item.attribute_11%type := p_item.attribute_11;
        v_s_by_s       p_item.attribute_12%type := p_item.attribute_12;
        v_show_time    p_item.attribute_13%type := p_item.attribute_13;
        v_show_date    p_item.attribute_14%type := p_item.attribute_14;
        v_local        p_item.attribute_15%type := p_item.attribute_15;
     begin
        if f_is_playground = false then
            -- libs

            --
            --moment.js
            apex_javascript.add_library(p_name => 'moment', p_directory =>
            p_plugin.file_prefix, p_version => null, p_skip_extension => false) ;

            apex_javascript.add_library(p_name => 'moment-with-locales', p_directory =>
            p_plugin.file_prefix, p_version => null, p_skip_extension => false) ;

            --
            -- bootstrap-datetimepicker
            apex_javascript.add_library(p_name => 'bootstrap-datetimepicker.min', p_directory =>
            p_plugin.file_prefix, p_version => null, p_skip_extension => false) ;

            apex_css.add_file(p_name => 'bootstrap-datetimepicker.min', p_directory =>
            p_plugin.file_prefix) ;


            apex_javascript.add_library(p_name => 'datetime.picker', p_directory =>
            p_plugin.file_prefix, p_version => null, p_skip_extension => false) ;

            apex_css.add_file(p_name => 'datetime.picker', p_directory =>
            p_plugin.file_prefix) ;
            -- end of libs
        end if;

        -- During plug-in development it's very helpful to have some debug information
        if apex_application.g_debug then
            apex_plugin_util.debug_page_item(
                p_plugin                => p_plugin,
                p_page_item             => p_item,
                p_value                 => p_value,
                p_is_readonly           => p_is_readonly,
                p_is_printer_friendly   => p_is_printer_friendly
            );
        end if;

       if v_format is null then
        select value
          into v_format
          from nls_session_parameters
         where parameter = 'NLS_DATE_FORMAT';
       end if;

       --get environment language
       select nvl(application_primary_language, 'en')
        into v_prim_lan
        from apex_applications
       where application_id = v_app_id;

        res_out('<input id="'|| v_item_val_id || '"' ||
                ' name="' || v_name || '"' ||
                ' type="hidden"></input>');

        apex_json.initialize_clob_output;
        apex_json.open_object;

        if v_min_date is not null then

            if p_item.format_mask is null then
                v_val_eph := get_epoch(to_timestamp(v_min_date));
            else
                v_val_eph := get_epoch(to_timestamp(v_min_date, p_item.format_mask));
            end if;
            apex_json.write('minDate' , v_val_eph);
        end if;

        if v_max_date is not null then
            if p_item.format_mask is null then
                v_val_eph := get_epoch(to_timestamp(v_max_date));
            else
                v_val_eph := get_epoch(to_timestamp(v_max_date, p_item.format_mask));
            end if;
            apex_json.write('maxDate',  v_val_eph);
        end if;

        if v_d_w_dis is not null then
           v_static_list    := wwv_flow_utilities.string_to_table2(v_d_w_dis,',');
           apex_json.open_array('daysOfWeekDisabled');

           for i in 1..v_static_list.count loop
            apex_json.write( v_static_list(i));
           end loop;
           apex_json.close_array;
        end if;

        if v_show_today_b = 'Y' then
           apex_json.write('showTodayButton',  true);
        end if;

        if v_header_form is not null then
           apex_json.write('dayViewHeaderFormat',v_header_form);
        end if;

        if v_use_current = 'N' then
           apex_json.write('useCurrent',  false);
        end if;

        if v_min_step is not null then
           apex_json.write('stepping', v_min_step);
        end if;

        if v_def_date is not null then
           if p_item.format_mask is null then
                v_val_eph := get_epoch(to_timestamp(v_def_date));
            else
                v_val_eph := get_epoch(to_timestamp(v_def_date, p_item.format_mask));
            end if;
           apex_json.write('defaultDate', v_val_eph);
        end if;

        if v_inline = 'Y' then
           apex_json.write('inline',  true);
           apex_json.write('keepOpen',  true);
        end if;

        if v_s_by_s = 'Y' then
           apex_json.write('sideBySide',  true);
        end if;

        apex_json.write('locale',  nvl(v_local, 'en'));

        v_static_list    := wwv_flow_utilities.string_to_table2(v_format,' ');

        if v_show_date = 'N' and v_static_list.count = 2 then
            v_format := v_static_list(2);
        end if;

        if v_show_time = 'N' and v_static_list.count = 2 then
            v_format := v_static_list(1);
        end if;

        apex_json.write('format', v_format);

        if p_value is not null then
            if p_item.format_mask is null then
            v_val_eph := get_epoch(to_timestamp(p_value));
            else
            v_val_eph := get_epoch(to_timestamp(p_value, p_item.format_mask));
            end if;
            apex_json.write('value', v_val_eph);
        end if;

        apex_json.close_object;

        v_config := apex_json.stringify(apex_json.get_clob_output);
        apex_json.free_output;

        v_exe_code := ' new apex.plugins.dateTimePicker({' ||
            'itemId         :"'  || p_item.name    || '",' ||
            'itemValId      :"'  || v_item_val_id  || '",' ||
            'locale         :"'  || v_prim_lan     || '",' ||
            'dateTimeFormat :"'  || v_format       || '",' ||
            'dtPconfig      : '  || v_config       ||
        ' });';

        apex_javascript.add_onload_code(p_code => v_exe_code) ;

        if apex_application.g_debug then
          apex_debug_message.message(p_message => 'JS Onload: ' || v_exe_code);
        end if;

        -- Tell APEX that this field is navigable',
        v_result.is_navigable := true;

        return v_result;

    end datetimepicker;
end ax_plg_datetime_pkg;

/

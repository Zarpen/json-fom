/*
Copyright (c) 2012 Alberto Romo Valverde
Licensed under the MIT license
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function JsonFOM(name,data,lang){
    this.json_data = data;
    this.json_lang = lang;
    
    JsonFOM.setInstance(name,this);
    
    for(json_key in this.json_data){
        var class_name = "JsonFOM"+json_key;
        if(typeof window[class_name] == 'function'){
            this[json_key] = [];
            if(JsonFOM.is_array(this.json_data[json_key])){
                for(var i = 0;i < this.json_data[json_key].length;i++){
                    var json_temp = this.json_data[json_key][i];
                    if(json_temp && json_temp != undefined) this[json_key].push(new window[class_name](json_temp));
                }
            }else{
                for(json_key2 in this.json_data[json_key]){
                    var json_temp = this.json_data[json_key][json_key2];
                    if(json_temp && json_temp != undefined) this[json_key].push(new window[class_name](json_temp));
                }
            }
        }
    }
}
JsonFOM.prototype.get = function(key){
    return this.json_data[key];
}
JsonFOM.prototype.getVar = function(key){
    return this[key];
}
JsonFOM.prototype.set = function(key,value){
    this.json_data[key] = value;
}
JsonFOM.prototype.setVar = function(key,value){
    this[key] = value;
}
JsonFOM.prototype.getTable = function(table,id){
    if(id){
        for(var i = 0;i < this[table].length;i++){
            var temp = this[table][i];
            if(temp.get("id") == id){
                return temp;
            }
        }
    }else{
        return this[table];
    }
}
JsonFOM.prototype.getTableFOM = function(table,id){
    if(id){
        var count = 0;
        for(var i = 0;i < this[table].length;i++){
            var temp = this[table][i];
            if(temp.get("Key") == id){
                var res = temp.getFOMRow();
                res["row_index"] = count;
                return res;
            }
            count++;
        }
    }else{
        var rows = [];
        var count = 0;
        for(var i = 0;i < this[table].length;i++){
            var temp = this[table][i];
            var res = temp.getFOMRow();
            res["row_index"] = count;
            rows.push(res);
            count++;
        }
        return rows;
    }
}
JsonFOM.prototype.getRelatedFOM = function(table,key,value,sort){
  var result = value;
  var rows = is_array(this.json_data[table]) ? this.json_data[table] : [this.json_data[table]];
  
  if(JsonFOM.is_array(value)){
        for(var i = 0;i < rows.length;i++){
            var obj = rows[i];
            for(var j = 0;j < value.length;j++){
                if(value[j] == obj[key]){
                    if(typeof window["JsonFOM"+table] == 'function'){
                        result[j] = new window["JsonFOM"+table](obj);
                    }
                }
            }
        }
        if(sort && sort != undefined) result.sort(sort);
    }else{
        for(var i = 0;i < rows.length;i++){
            var obj = rows[i];
            if(value == obj[key]){
                if(typeof window["JsonFOM"+table] == 'function'){
                    result = [new window["JsonFOM"+table](obj)];
                }
            }
        }
    }
    return result && result != undefined ? result : [];
}
JsonFOM.prototype.queryFormat = function(query,prefix_table){
    var formal_query = {};
    var from = {};
    var temp_from = {};
    var select = "";
    var result = [];
    
    formal_query["SELECT"] = query["SELECT"];
    formal_query["FROM"] = query["FROM"];
    formal_query["WHERE"] = query["WHERE"];
    formal_query["GROUP BY"] = query["GROUP BY"];
    formal_query["HAVING"] = query["HAVING"];
    formal_query["ORDER BY"] = query["ORDER BY"];
    formal_query["LIMIT"] = query["LIMIT"];
    
    for(section in formal_query){
        switch(section){
            case "SELECT":
                if(formal_query[section]){
                    select = formal_query[section].split(",");
                }
                break;
            case "FROM":
                if(formal_query[section]){
                    var tables = formal_query[section].split(",");
                    for(var i = 0;i < tables.length;i++){
                        from[tables[i]] = this.getTableFOM(tables[i]);
                        temp_from[tables[i]] = this.getTableFOM(tables[i]);
                    }
                    
                    if(!formal_query["WHERE"]) result = this.queryFormatSelect(from,select);
                }
                break;
            case "WHERE":
                if(formal_query[section]){
                    result = [];
                    
                    var count_statements = 0;
                    var statements = formal_query[section].replace(/\(([^)]+)\)/gi,",").split(",");
                    var logicals = formal_query[section].match(/\(([^)]+)\)/gi);
                    
                    if(!logicals && formal_query[section]){
                        statements = [formal_query[section],formal_query[section]];
                        logicals = ["OR"];
                    }
                    
                    for(var i = 0;i < statements.length;i++) statements[i] = statements[i].replace(/^\s+|\s+$/gm,'');
                    for(var i = 0;i < logicals.length;i++) logicals[i] = logicals[i].replace(")","").replace("(","");
                    
                    for(var i = 0;i < logicals.length;i++){
                        var logical = logicals[i];
                        var side_a = statements[count_statements].split(/\[.*\]/);
                        for(var j = 0;j < side_a.length;j++) side_a[j] = side_a[j].replace(/^\s+|\s+$/gm,'');
                        var opa = statements[count_statements].match(/\[.*\]/);
                        opa = opa[0].replace("]","").replace("[","").replace(/^\s+|\s+$/gm,'');
                        
                        var ta = side_a[0].substr(0,side_a[0].indexOf("."));
                        var fa = side_a[0].indexOf(".") < 0 ? side_a[0] : side_a[0].substr(side_a[0].indexOf(".")+1);
                        var tb = side_a[1].substr(0,side_a[1].indexOf("."));
                        var fb = side_a[1].indexOf(".") < 0 ? side_a[1] : side_a[1].substr(side_a[1].indexOf(".")+1);
                        count_statements++;

                        var side_b = statements[count_statements].split(/\[.*\]/);
                        for(var j = 0;j < side_b.length;j++) side_b[j] = side_b[j].replace(/^\s+|\s+$/gm,'');
                        var opb = statements[count_statements].match(/\[.*\]/);
                        opb = opb[0].replace("]","").replace("[","").replace(/^\s+|\s+$/gm,'');
                        
                        var ta2 = side_b[0].substr(0,side_b[0].indexOf("."));
                        var fa2 = side_b[0].indexOf(".") < 0 ? side_b[0] : side_b[0].substr(side_b[0].indexOf(".")+1);
                        var tb2 = side_b[1].substr(0,side_b[1].indexOf("."));
                        var fb2 = side_b[1].indexOf(".") < 0 ? side_b[1] : side_b[1].substr(side_b[1].indexOf(".")+1);
                        
                        if(i == 0){
                            var side_a_rows = this.queryFormatSide(from,{"ta":ta,"tb":tb,"fa":fa,"fb":fb,"op":opa});
                            var side_b_rows = this.queryFormatSide(from,{"ta":ta2,"tb":tb2,"fa":fa2,"fb":fb2,"op":opb});
                        }else{
                            if(logical == "AND"){
                                var side_a_rows = this.queryFormatSide(from,{"ta":ta,"tb":tb,"fa":fa,"fb":fb,"op":opa});
                                var side_b_rows = this.queryFormatSide(from,{"ta":ta2,"tb":tb2,"fa":fa2,"fb":fb2,"op":opb});
                            }else if(logical == "OR"){
                                var side_a_rows_temp = {};
                                for(table_key in from){
                                    side_a_rows_temp[table_key] = [];
                                    for(var j = 0;j < from[table_key].length;j++) side_a_rows_temp[table_key].push(j);
                                }
                                var side_a_rows = side_a_rows_temp;
                                var side_b_rows = this.queryFormatSide(temp_from,{"ta":ta2,"tb":tb2,"fa":fa2,"fb":fb2,"op":opb});
                            }
                        }

                        switch(logical){
                            case "AND":
                                var side_rows = {};
                                for(table_key in from) side_rows[table_key] = [];

                                for(table_key in side_a_rows){
                                    if(side_b_rows[table_key]){
                                        var table_a = side_a_rows[table_key];
                                        var table_b = side_b_rows[table_key];
                                        for(var j = 0;j < table_a.length;j++){
                                            for(var k = 0;k < table_b.length;k++){
                                                if(table_a[j] == table_b[k]) if(side_rows[table_key].indexOf(table_a[j]) < 0) side_rows[table_key].push(table_a[j]);
                                            }
                                        }
                                    }
                                }

                                for(table_key in side_b_rows){
                                    if(side_a_rows[table_key]){
                                        var table_a = side_a_rows[table_key];
                                        var table_b = side_b_rows[table_key];
                                        for(var j = 0;j < table_b.length;j++){
                                            for(var k = 0;k < table_a.length;k++){
                                                if(table_b[j] == table_a[k]) if(side_rows[table_key].indexOf(table_b[j]) < 0) side_rows[table_key].push(table_b[j]);
                                            }
                                        }
                                    }
                                }

                                for(table_key in from){
                                    var temp = [];
                                    var temp_rows = side_rows[table_key];
                                    for(var j = 0;j < temp_rows.length;j++){
                                        if(JsonFOM.is_array(temp_rows[j])){
                                            var temp2 = from[table_key][temp_rows[j][table_key]];
                                            for(table_key_2 in temp_rows[j]){ 
                                                if(table_key != table_key_2){
                                                    var temp3 = temp_rows[j][table_key_2];
                                                    for(row_key in from[table_key_2][temp3]) temp2["relate_"+row_key] = from[table_key_2][temp3][row_key];
                                                    temp.push(temp2);
                                                }
                                            }
                                        }else{
                                            temp.push(from[table_key][temp_rows[j]]);
                                        }
                                    }
                                    from[table_key] = temp;
                                }

                                temp_from = from;
                                break;
                            case "OR":
                                from_rows = {};
                                temp_from_rows = {};
                                for(table_key in from){
                                    from_rows[table_key] = [];
                                    temp_from_rows[table_key] = [];
                                }
                                
                                for(table_key in side_a_rows){
                                    var temp = side_a_rows[table_key];
                                    if(temp.length > 0){
                                        for(var j = 0;j < temp.length;j++) from_rows[table_key].push(temp[j]);
                                    }
                                }

                                for(table_key in side_b_rows){
                                    var temp = side_b_rows[table_key];
                                    if(temp.length > 0){
                                        for(var j = 0;j < temp.length;j++) if(from_rows[table_key].indexOf(temp[j]) < 0) temp_from_rows[table_key].push(temp[j]);
                                    }
                                }
                                
                                for(table_key in from){
                                    var temp = [];
                                    var temp_rows = from_rows[table_key];
                                    for(var j = 0;j < temp_rows.length;j++){
                                        if(JsonFOM.is_array(temp_rows[j])){
                                            var temp2 = from[table_key][temp_rows[j][table_key]];
                                            for(table_key_2 in temp_rows[j]){ 
                                                if(table_key != table_key_2){
                                                    var temp3 = temp_rows[j][table_key_2];
                                                    for(row_key in from[table_key_2][temp3]) temp2["relate_"+row_key] = from[table_key_2][temp3][row_key];
                                                    temp.push(temp2);
                                                }
                                            }
                                        }else{
                                            temp.push(from[table_key][temp_rows[j]]);
                                        }
                                    }

                                    temp_rows = temp_from_rows[table_key];
                                    for(var j = 0;j < temp_rows.length;j++){
                                        if(JsonFOM.is_array(temp_rows[j])){
                                            var temp2 = from[table_key][temp_rows[j][table_key]];
                                            for(table_key_2 in temp_rows[j]){ 
                                                if(table_key != table_key_2){
                                                    var temp3 = temp_rows[j][table_key_2];
                                                    for(row_key in from[table_key_2][temp3]) temp2["relate_"+row_key] = from[table_key_2][temp3][row_key];
                                                    temp.push(temp2);
                                                }
                                            }
                                        }else{
                                            temp.push(temp_from[table_key][temp_rows[j]]);
                                        }
                                    }

                                    from[table_key] = temp;
                                }
                                
                                break;
                        }
                        
                        result = this.queryFormatSelect(from,select);
                    }
                }
                break;
            case "GROUP BY":
                if(formal_query[section] && result.length > 0){
                    var groups = [];
                    
                    var count = 0;
                    for(group_key in formal_query[section]){
                        groups.push({"0":group_key,"1":formal_query[section][group_key]});
                        count++;
                        if(count > 1) break;
                    }
                    
                    if(groups[0]){
                        var temp = this.queryGroupBy(result,groups[0]);
                        if(temp){
                            for(temp_key in temp){
                                temp[temp_key] = this.queryGroupBy(temp[temp_key],groups[1]);
                            }
                        }
                    }
                    result = [temp];
                }
                break;
            case "HAVING":
                if(formal_query[section] && result.length > 0){
                    
                }
                break;
            case "ORDER BY":
                if(formal_query[section] && result.length > 0){
                    result = mksort.sort(result,formal_query[section]);
                }
                break;
            case "LIMIT":
                if(formal_query[section] && result.length > 0){
                    var tokens = formal_query[section].split(",");
                    result = result.slice(tokens[0],tokens[1]);
                }
                break;
        }
    }
    
    if(!prefix_table){
        var unprefixed_result = [];
        for(var j = 0;j < result.length;j++){
            unprefixed_result[j] = {};
            var temp_value = result[j];
            for(field_name in temp_value){
                var temp_value2 = temp_value[field_name];
                var the_table = field_name.substr(0,field_name.indexOf("."));
                unprefixed_result[j][field_name.replace(the_table+".","")] = temp_value2;
            }
        }
        result = unprefixed_result;
    }
    return result;
}
JsonFOM.prototype.queryGroupBy = function(group,key){
    var result = {};
    for(var i = 0;i < group.length;i++){
        var temp = group[i][key["0"]];
        if(key["1"]){
            temp = this.unformatQueryField(temp);
            var matches = temp.match(new RegExp(key["1"],"gi"));
            temp = matches[0];
        }
        if(!result[temp]) result[temp] = [];
        result[temp].push(group[i]);
    }
    return result;
}
JsonFOM.prototype.queryFormatSelect = function(from,select){
    var result = [];
    
    // remove duplicates (like DISTINCT when no where)
    for(table_key in from){
        var temp_rows = from[table_key];
        var duplicates = [];
        for(var j = 0;j < temp_rows.length;j++){
            if(duplicates.indexOf(temp_rows[j]["row_index"]) < 0){
                var the_row = temp_rows[j];
                var prefixed_row = {};
                // prefix fields for the rest of query operations
                for(table_key_2 in the_row){
                    if(select.indexOf(table_key+"."+table_key_2) >= 0 || select.indexOf(table_key+".*") >= 0){
                        if((the_row[table_key_2]+"").indexOf("relate_") < 0){
                            prefixed_row[table_key+"."+table_key_2] = the_row[table_key_2];
                        }else{
                            var the_table = table_key_2.replace("relate_","");
                            var the_index = the_row[table_key_2];
                            var the_object = from[the_table][the_index];
                            for(relate_name in the_object) prefixed_row[the_table+"."+relate_name] = the_object[relate_name];
                        }
                    }
                }
                
                result.push(prefixed_row);
                duplicates.push(temp_rows[j]["row_index"]);
            }
        }
        break;
    }
    
    return result;
}
JsonFOM.prototype.queryFormatSide = function(from,side){
    var temp = {};
    for(table_key in from) temp[table_key] = [];
    
    //if(side["ta"]) for(var i = 0;i < from[side["ta"]].length;i++) from[side["ta"]][i][side["fa"]] = this.formatQueryField(from[side["ta"]][i][side["fa"]]);
    //if(side["tb"]) for(var i = 0;i < from[side["tb"]].length;i++) from[side["tb"]][i][side["fb"]] = this.formatQueryField(from[side["tb"]][i][side["fb"]]);
    if(side["fa"]) side["fa"] = this.formatQueryField(side["fa"]);
    if(side["fb"]) side["fb"] = this.formatQueryField(side["fb"]);
    
    if(side["ta"] && side["tb"]){
        if(side["ta"] != side["tb"]){
            for(var j = 0;j < from[side["ta"]].length;j++){
                for(var k = 0;k < from[side["tb"]].length;k++){
                    switch(side["op"]){
                        case "=":
                            if(from[side["ta"]][j][side["fa"]] == from[side["tb"]][k][side["fb"]]){
                                var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                temp[side["ta"]].push(temp_o);
                                temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                temp[side["tb"]].push(temp_o);
                            }
                            break;
                        case ">=":
                            if(from[side["ta"]][j][side["fa"]] >= from[side["tb"]][k][side["fb"]]){
                                var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                temp[side["ta"]].push(temp_o);
                                temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                temp[side["tb"]].push(temp_o);
                            }
                            break;
                        case "<=":
                            if(from[side["ta"]][j][side["fa"]] <= from[side["tb"]][k][side["fb"]]){
                                var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                temp[side["ta"]].push(temp_o);
                                temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                temp[side["tb"]].push(temp_o);
                            }
                            break;
                        case "!=":
                            if(from[side["ta"]][j][side["fa"]] != from[side["tb"]][k][side["fb"]]){
                                var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                temp[side["ta"]].push(temp_o);
                                temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                temp[side["tb"]].push(temp_o);
                            }
                            break;
                        case "like":case "regex":
                            var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                            var temp2 = this.unformatQueryField(from[side["tb"]][k][side["fb"]]);
                            if(temp1.match(new RegExp(temp2,"gi"))){
                                var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                temp[side["ta"]].push(temp_o);
                                temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                temp[side["tb"]].push(temp_o);
                            }
                            break;
                        case "in":
                            var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                            var temp2 = this.unformatQueryField(from[side["tb"]][k][side["fb"]]);
                            temp2 = temp2.split(",");
                            for(var z = 0;z < temp2.length;z++){
                                if(temp1 == temp2[z]){
                                    var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                    temp[side["ta"]].push(temp_o);
                                    temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                    temp[side["tb"]].push(temp_o);
                                }
                            }
                            break;
                        case "not in":
                            var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                            var temp2 = this.unformatQueryField(from[side["tb"]][k][side["fb"]]);
                            temp2 = temp2.split(",");
                            var found = false;
                            for(var z = 0;z < temp2.length;z++) if(temp1 == temp2[z]) found = true;
                            if(!found){
                                var temp_o = {};temp_o[side["ta"]] = j;temp_o[side["tb"]] = k;
                                temp[side["ta"]].push(temp_o);
                                temp_o = {};temp_o[side["tb"]] = k;temp_o[side["ta"]] = j;
                                temp[side["tb"]].push(temp_o);
                            }
                            break;
                    }
                }
            }
        }else{
            for(var j = 0;j < from[side["ta"]].length;j++){
                switch(side["op"]){
                    case "=":
                        if(from[side["ta"]][j][side["fa"]] == from[side["ta"]][j][side["fb"]]){
                            temp[side["ta"]].push(j);
                        }
                        break;
                    case ">=":
                        if(from[side["ta"]][j][side["fa"]] >= from[side["ta"]][j][side["fb"]]){
                            temp[side["ta"]].push(j);
                        }
                        break;
                    case "<=":
                        if(from[side["ta"]][j][side["fa"]] <= from[side["ta"]][j][side["fb"]]){
                            temp[side["ta"]].push(j);
                        }
                        break;
                    case "!=":
                        if(from[side["ta"]][j][side["fa"]] != from[side["ta"]][j][side["fb"]]){
                            temp[side["ta"]].push(j);
                        }
                        break;
                    case "like":case "regex":
                        var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                        var temp2 = this.unformatQueryField(from[side["ta"]][j][side["fb"]]);
                        if(temp1.match(new RegExp(temp2,"gi"))){
                            temp[side["ta"]].push(j);
                        }
                        break;
                    case "in":
                        var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                        var temp2 = this.unformatQueryField(from[side["ta"]][j][side["fb"]]);
                        temp2 = temp2.split(",");
                        for(var z = 0;z < temp2.length;z++){
                            if(temp1 == temp2[z]){
                                temp[side["ta"]].push(j);
                            }
                        }
                        break;
                    case "not in":
                        var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                        var temp2 = this.unformatQueryField(from[side["ta"]][j][side["fb"]]);
                        temp2 = temp2.split(",");
                        var found = false;
                        for(var z = 0;z < temp2.length;z++) if(temp1 == temp2[z]) found = true;
                        if(!found){
                            temp[side["ta"]].push(j);
                        }
                        break;
                }
            }
        }
    }else if(!side["ta"]){
        for(var j = 0;j < from[side["tb"]].length;j++){
            switch(side["op"]){
                case "=":
                    if(from[side["tb"]][j][side["fb"]] == side["fa"]){
                        temp[side["tb"]].push(j);
                    }
                    break;
                case ">=":
                    if(from[side["tb"]][j][side["fb"]] >= side["fa"]){
                        temp[side["tb"]].push(j);
                    }
                    break;
                case "<=":
                    if(from[side["tb"]][j][side["fb"]] <= side["fa"]){
                        temp[side["tb"]].push(j);
                    }
                    break;
                case "!=":
                    if(from[side["tb"]][j][side["fb"]] != side["fa"]){
                        temp[side["tb"]].push(j);
                    }
                    break;
                case "like":case "regex":
                    var temp1 = this.unformatQueryField(from[side["tb"]][j][side["fb"]]);
                    var temp2 = this.unformatQueryField(side["fa"]);
                    if(temp1.match(new RegExp(temp2,"gi"))){
                        temp[side["tb"]].push(j);
                    }
                    break;
                case "in":
                    var temp1 = this.unformatQueryField(from[side["tb"]][j][side["fb"]]);
                    var temp2 = this.unformatQueryField(side["fa"]);
                    temp2 = temp2.split(",");
                    for(var z = 0;z < temp2.length;z++){
                        if(temp1 == temp2[z]){
                            temp[side["tb"]].push(j);
                        }
                    }
                    break;
                case "not in":
                    var temp1 = this.unformatQueryField(from[side["tb"]][j][side["fb"]]);
                    var temp2 = this.unformatQueryField(side["fa"]);
                    temp2 = temp2.split(",");
                    var found = false;
                    for(var z = 0;z < temp2.length;z++) if(temp1 == temp2[z]) found = true;
                    if(!found){
                        temp[side["tb"]].push(j);
                    }
                    break;
            }
        }
    }else if(!side["tb"]){
        for(var j = 0;j < from[side["ta"]].length;j++){
            switch(side["op"]){
                case "=":
                    if(from[side["ta"]][j][side["fa"]] == side["fb"]){
                        temp[side["ta"]].push(j);
                    }
                    break;
                case ">=":
                    if(from[side["ta"]][j][side["fa"]] >= side["fb"]){
                        temp[side["ta"]].push(j);
                    }
                    break;
                case "<=":
                    if(from[side["ta"]][j][side["fa"]] <= side["fb"]){
                        temp[side["ta"]].push(j);
                    }
                    break;
                case "!=":
                    if(from[side["ta"]][j][side["fa"]] != side["fb"]){
                        temp[side["ta"]].push(j);
                    }
                    break;
                case "like":case "regex":
                    var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                    var temp2 = this.unformatQueryField(side["fb"]);
                    if(temp1.match(new RegExp(temp2,"gi"))){
                        temp[side["ta"]].push(j);
                    }
                    break;
                case "in":
                    var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                    var temp2 = this.unformatQueryField(side["fb"]);
                    temp2 = temp2.split(",");
                    for(var z = 0;z < temp2.length;z++){
                        if(temp1 == temp2[z]){
                            temp[side["ta"]].push(j);
                        }
                    }
                    break;
                case "not in":
                    var temp1 = this.unformatQueryField(from[side["ta"]][j][side["fa"]]);
                    var temp2 = this.unformatQueryField(side["fb"]);
                    temp2 = temp2.split(",");
                    var found = false;
                    for(var z = 0;z < temp2.length;z++) if(temp1 == temp2[z]) found = true;
                    if(!found){
                        temp[side["ta"]].push(j);
                    }
                    break;
            }
        }
    }
    
    return temp;
}
JsonFOM.prototype.unformatQueryField = function(field){
    var result = field && field != undefined ? field : "";
    if(field){
        if(JsonFOM.is_object(field)){
            result = field.getFullYear()+"-"+(sd2(field.getMonth()+1))+"-"+sd2(field.getDate())+" "+sd2(field.getHours())+":"+sd2(field.getMinutes())+":"+sd2(field.getSeconds());
        }else if(!isNaN(field)){
            result = field+"";
        }else{
            result = field;
        }
    }
    return result ? result.replace(/^\s+|\s+$/gm,'') : "";
}
JsonFOM.prototype.formatQueryField = function(field){
    var result = field && field != undefined ? field : "";
    if(field){
        if(JsonFOM.is_object(field) || !isNaN(field)) return result;
        
        if(field.indexOf("'") >= 0 || field.indexOf('"') >= 0){
            var temp_field = field.replace(/["']/g, "").replace(/^\s+|\s+$/gm,'');
            if(temp_field.match(/^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2}) {1}([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})$/)){
                result = new Date(temp_field.replace(" ","T"));
            }else if(!isNaN(field)){
                result = parseFloat(field);
            }else{
                result = temp_field;
            }
        }else{
            if(field.match(/^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2}) {1}([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})$/)){
                result = new Date(field.replace(" ","T"));
            }else if(!isNaN(field)){
                result = parseFloat(field);
            }else{
                result = field.replace(/^\s+|\s+$/gm,'');
            }
        }
    }
    return result;
}

JsonFOM.prototype.getLang = function(){
    return this.json_lang;
}
JsonFOM.prototype.setLang = function(lang){
    this.json_lang = lang;
}

// static var
JsonFOM.jfom_instances = {};
// static methods
JsonFOM.getInstance = function(name){
    for(instance in JsonFOM.jfom_instances) if(instance == name) return JsonFOM.jfom_instances[name];
}
JsonFOM.setInstance = function(name,value){
    JsonFOM.jfom_instances[name] = value;
}
JsonFOM.is_object = function(value){
    var type = Object.prototype.toString.call(value);
    return type === '[object Object]' || type === '[object Date]';
}
JsonFOM.is_array = function(value){
    return Object.prototype.toString.call(value) === '[object Array]';
}


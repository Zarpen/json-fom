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

function JsonFOMBase(data){
    for(key in data) this[key] = data[key];
}
JsonFOMObject.prototype.get = function(key){
    return this[key];
}
JsonFOMObject.prototype.set = function(key,value){
    this[key] = value;
}
JsonFOMObject.prototype.getFOM = function(key){
    return this["fom"][key];
}
JsonFOMObject.prototype.setFOM = function(key,value){
    this["fom"][key] = value;
}
JsonFOMObject.prototype.getFOMRow = function(){
    return this["fom"];
}
JsonFOMObject.prototype.toFOMSchema = function(){
    for(key in this.fomMap){
        var temp = this.fomMap[key];
        if(key && temp){
            var temp2 = this;
            if(key.indexOf(":") < 0){
                if(is_object(temp2)){
                    temp2 = temp2[key] ? temp2[key] : temp2;
                }
            }else{
                var tokens = key.split(":");
                for(var i = 0;i < tokens.length;i++){
                    if(tokens[i].indexOf("[") < 0){
                        if(tokens[i].indexOf("->") < 0){
                            if(is_object(temp2)){
                                temp2 = temp2[tokens[i]] ? temp2[tokens[i]] : temp2;
                            }
                        }else{
                            var token = tokens[i].replace("->","");
                            if(is_object(temp2)){
                                temp2 = temp2.get(token) ? temp2.get(token) : temp2;
                            }
                        }
                    }else{
                        var token = tokens[i].replace(/\[.*\]/,"");
                        var matches = tokens[i].match(/(?:\[).*(?:\])/);
                        var number = parseInt(matches[0].replace("[","").replace("]",""));
                        if(is_object(temp2)){
                            temp2 = temp2[token];
                            if(temp2) temp2 = temp2[number] ? temp2[number] : temp2;
                        }
                    }
                }
            }
            this.fom[temp] = is_object(temp2) || is_array(temp2) ? "" : temp2;
        }
    }
}

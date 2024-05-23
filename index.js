"use strict";

class ParsedForm {

    constructor() {

        this.data = [];

    }

    pushData(dt) {

        this.data.push(dt);

    }

    getData() {

        return this.data;

    }

    show() {

        console.log("---INCOMIG-FORM---");

        console.log(this.data);

    }

}

class InputData {

    constructor () {

        this.headers = {};

        this.name = undefined;

        this.value = undefined;

        this.filename = undefined;

    }

    setHead(key, value) {

        this.headers[key] = value;

    }

    getHead(key) {

        return this.headers[key];

    }

    setName (val) {

        this.name = val;

    }

    getName () {

        return this.name;

    }

    setValue (val) {

        this.value = val;

    }

    getValue () {

        return this.value;

    }

    setFileName (val) {

        this.filename = val;

    }

    getFileName () {

        return this.filename;

    }    

}

function FormParser (data) {

    const jsonBuf = JSON.parse(JSON.stringify(data));

    const uInt8Buf = jsonBuf.data;
    
    const form = new ParsedForm();

    let input = 0;

    let blbound = false;

    let blhead = false;

    let blval = false;

    let reader = [];

    const regexp_bound = /--([^\r]+)\r\n/;

    const regexp_disposition = /Content-Disposition:([^;]+);/;

    const regexp_type = /Content-Type:([^\r]+)\r\n/;

    const regexp_name = /name="([^"]+)"/;

    const regexp_file = /filename="([^"]+)"/;

    for (let i = 0; i < uInt8Buf.length; i++) { 

        if (!blbound && !blhead && !blval) {

            blbound = true;

            input = new InputData();

        } else if (blbound && !blhead && !blval) {

            reader.push(uInt8Buf[i]);

            if (reader.length >= 2) {

                if (reader[reader.length-2] === 13 && reader[reader.length-1] === 10) {

                    let string = "";
    
                    reader.forEach(val => {
    
                        string += String.fromCharCode(val);
    
                    });

                    const match = string.match(regexp_bound);

                    if (match) {

                        blhead = true;

                    }

                    reader = [];
    
                }

            }

        } else if (blbound && blhead && !blval) {

            reader.push(uInt8Buf[i]);

            if (reader.length >= 2) {

                if (reader[reader.length-2] === 13 && reader[reader.length-1] === 10) {

                    let string = "";
    
                    reader.forEach(val => {
    
                        string += String.fromCharCode(val);
    
                    });

                    const match_disposition = string.match(regexp_disposition);
                    
                    if (match_disposition) {

                        input.setHead("Content-Disposition", match_disposition[1].trim());

                    }

                    const match_type = string.match(regexp_type);
                    
                    if (match_type) {

                        input.setHead("Content-Type", match_type[1].trim());

                    }

                    const match_name = string.match(regexp_name);

                    if (match_name) {

                        input.setName(match_name[1]);

                        const match_file = string.match(regexp_file);

                        if (match_file) {
    
                            input.setFileName(match_file[1].trim());
                            
                        }
                        
                    }

                    if (reader.length === 2) {

                        blbound = false;

                        blval = true;                    

                    }

                    reader = [];

                }

            }

        } else if (!blbound && blhead && blval) {

            if (uInt8Buf[i] === 45 && uInt8Buf[i+1] === 45 && uInt8Buf[i+2] === 45 && uInt8Buf[i+3] === 45) {

                blval = false;

                blhead = false;

                blbound = false;

                input.setValue(reader);

                form.pushData(input);

                reader = [];

            }

            if ( uInt8Buf[i] !== 10 && uInt8Buf[i] !== 13 && input.filename === undefined ) {

                reader.push(uInt8Buf[i]);

            }

            else if (input.filename !== undefined) reader.push(uInt8Buf[i]);

        }

    }

    return form;

}
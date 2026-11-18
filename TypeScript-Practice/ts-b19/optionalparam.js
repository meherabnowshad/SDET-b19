"use strict";
function mycalc(a, b) {
    if (a && b) {
        return a + b;
    }
    return a + a;
}
let res = mycalc(5);
console.log(res);
